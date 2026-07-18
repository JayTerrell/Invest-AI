# Invest-AI Data Integration Guide

## Overview

Your platform now integrates Polygon.io market data (via Massive.com API) across all screener stages:
- **Technical**: Daily OHLCV candles, computed technical metrics
- **Fundamental**: Quarterly financial statements (income, balance sheet, cash flow)
- **Sentiment**: AI-analyzed news articles with per-stock sentiment
- **Options**: Contract reference data and pricing

## Available Data Points

### 1. Stock Price Data (Daily Candles)

**Source**: Polygon.io `/v2/aggs/ticker/{symbol}/range/1/day`

**What You Get** (up to 252 bars = 1 year):
- `open` - First trade price
- `high` - Session high
- `low` - Session low
- `close` - Last trade price (used for technicals)
- `volume` - Total shares traded
- `vwap` - Volume Weighted Average Price (fair value for the day)
- `numTrades` - Number of individual transactions

**Usage in Screener**:
```
Stage 2 (Technical):
- Input: 500 daily bars
- Process: Calculate Vegas EMAs (144, 169, 233 periods)
- Process: Calculate RSI(14)
- Process: Detect swing points (11-bar micro, 50-bar macro)
- Downsampling: Convert daily → weekly (Friday closes for macro analysis)
- Output: Technical pass/fail + conviction score
```

### 2. Company Information (Ticker Details)

**Source**: Polygon.io `/v3/reference/tickers/{symbol}`

**Data Fields**:
- `name` - Company legal name
- `market_cap` - Total market capitalization (USD)
- `employees` - Total headcount
- `list_date` - IPO date
- `weighted_shares_outstanding` - Total shares in circulation
- `sic_code` / `sic_description` - Industry classification
- `homepage_url` - Company website
- `phone_number` - Investor relations phone
- `description` - Business summary

**Current Usage**: Stored for reference; used for sector grouping (SIC code)

**Future Usage**: Market cap filtering, sector comparisons

### 3. Financial Statements (Quarterly Data)

**Source**: Polygon.io `/vX/reference/financials/{type}`

**Available Types**:
- Income statements (revenue, margins, EPS)
- Balance sheets (assets, liabilities, equity, debt)
- Cash flow statements (operating, investing, financing activities)

**Income Statement Metrics**:
```typescript
{
  revenue: 94_036_000_000,           // Total revenue
  gross_profit: 43_718_000_000,      // Revenue - COGS
  operating_income: 28_202_000_000,  // Operating profit
  net_income: 4_000_000_000,         // Bottom line
  earnings: {
    basic: 2.50,                     // EPS (basic)
    diluted: 2.45                    // EPS (diluted)
  },
  shares: {
    basic: 1_500_000_000,
    diluted: 1_550_000_000
  },
  margins: {
    gross: 46.5,                     // (gross_profit / revenue) * 100
    operating: 30.0,                 // (operating_income / revenue) * 100
    net: 4.2                         // (net_income / revenue) * 100
  },
  period: {
    endDate: "2025-06-28",
    fiscalYear: 2025,
    fiscalQuarter: 3,
    filingDate: "2025-08-01"
  }
}
```

**Balance Sheet Metrics**:
```typescript
balanceSheet: {
  totalAssets: 331_495_000_000,
  totalLiabilities: 141_000_000_000,
  totalEquity: 190_495_000_000,
  cashAndEquivalents: 36_269_000_000,
  receivables: 46_835_000_000,
  inventories: 5_925_000_000,
  accountsPayable: 50_374_000_000,
  longTermDebt: 82_430_000_000
}
```

**Cash Flow Metrics**:
```typescript
cashFlow: {
  operatingActivities: 27_867_000_000,   // Cash from core business
  investingActivities: 5_073_000_000,    // CapEx, acquisitions
  financingActivities: -24_833_000_000,  // Debt, dividends, buybacks
  changeInCash: 8_107_000_000,
  dividends: 3_945_000_000,              // Cash returned to shareholders
  freeCashFlow: 24_067_000_000           // Operating CF - CapEx
}
```

**Computed Ratios**:
- `debtToEquity = totalLiabilities / totalEquity`
- `grossMargin = (grossProfit / revenue) * 100`
- `operatingMargin = (operatingIncome / revenue) * 100`
- `netMargin = (netIncome / revenue) * 100`

**Usage in Screener**:

```
Stage 4 (Fundamental Filter):
1. Revenue Growth Check
   - Compare latest quarter to same quarter previous year
   - FAIL if revenue declined > 10% YoY
   - SIGNAL: Struggling business

2. Profitability Check
   - Latest netMargin > 0
   - FAIL if negative (unprofitable)
   - SIGNAL: Company is losing money

3. Free Cash Flow Check
   - operatingCashFlow - capex > 0
   - FAIL if negative (burning cash)
   - SIGNAL: Unsustainable operations

4. Debt Burden Check
   - debtToEquity < 3.0
   - FAIL if > 3.0 (over-leveraged)
   - SIGNAL: High bankruptcy risk
```

### 4. News & Sentiment Analysis

**Source**: Polygon.io `/v2/reference/news`

**Article Data**:
```typescript
{
  id: "fa5952d4...",
  title: "Best Warren Buffett Stock...",
  author: "Adria Cimino",
  published_utc: "2026-05-19T10:10:00Z",
  article_url: "https://www.fool.com/...",
  description: "AI-generated summary (2-4 sentences)",
  keywords: ["Warren Buffett", "Apple", ...],
  tickers: ["AAPL", "KO", "BRK.A"],
  publisher: {
    name: "The Motley Fool",
    homepage_url: "https://www.fool.com/"
  },
  insights: [
    {
      ticker: "AAPL",
      sentiment: "positive",  // or "negative" / "neutral"
      sentiment_reasoning: "Praised for strong competitive moat..."
    }
  ]
}
```

**Usage in Screener**:

```
Stage 5 (Sentiment Filter):
1. Fetch 5 most recent articles mentioning the stock
2. For each article, check insights array for ticker match
3. Count positive vs negative sentiment
4. PASS if: positive_count >= negative_count
5. NEUTRAL if: no recent articles
```

**Example**:
```
NVDA recent news (last 5 articles):
- Article 1: positive (AI chip demand)
- Article 2: positive (earnings beat)
- Article 3: positive (guidance raised)
= PASS (3 positive, 0 negative)

INTC recent news:
- Article 1: negative (market share loss)
- Article 2: negative (earnings missed)
- Article 3: neutral (analyst downgrade)
= FAIL (0 positive, 2 negative)
```

### 5. Options Data

**Source**: Polygon.io `/v3/reference/options/contracts` and `/v2/aggs/ticker/{options_ticker}`

**Contract Data**:
```typescript
{
  ticker: "O:AAPL260618C00297500",      // Options contract ID
  underlying_ticker: "AAPL",
  strike_price: 297.50,
  expiration_date: "2026-06-18",
  contract_type: "call",                // or "put"
  exercise_style: "american",           // Can exercise anytime
  shares_per_contract: 100              // Always 100 for US options
}
```

**Pricing Data** (historical bars):
```typescript
{
  lastClose: 8.45,                      // Premium per share (same as c)
  totalContractCost: 845.00,            // lastClose × 100 (actual cost)
  open: 9.54,
  high: 9.54,
  low: 7.65,
  close: 8.45,
  volume: 539,                          // Number of contracts traded
  vwap: 8.05,
  numTrades: 90
}
```

**Usage in Screener**:

```
Stage 7 (Options Filter):
1. Query available options expiring ~30 days out
2. Filter for 10 contracts nearest to current price (ATM)
3. PASS if: contracts exist and are liquid (volume > 0)
4. SIGNAL: Can trade options if needed for hedging/leverage

Example for AAPL @ $297.84:
- 297.50 call: volume 539 ✓
- 300.00 call: volume 412 ✓
- 310.00 call: volume 89 ✓
= PASS (options are liquid)
```

## Screener Pipeline Data Flow

```
┌─────────────────────────────────────────┐
│ Input: 100 stocks to screen             │
└──────────────────┬──────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │ Fetch 500 daily     │
         │ OHLCV candles       │
         │ (Polygon)           │
         └────────────┬────────┘
                      │
    ┌─────────────────┴──────────────────┐
    │                                    │
    ▼                                    ▼
┌─────────────────────┐        ┌──────────────────┐
│ Daily Candles       │        │ Weekly Candles   │
│ 500 bars (2 yrs)    │        │ Downsampled      │
│ For: EMA, RSI       │        │ For: Macro setup │
│ Swing points (11B)  │        │ Swing points     │
│                     │        │ (50B)            │
└────────┬────────────┘        └────────┬─────────┘
         │                              │
         └──────────────┬───────────────┘
                        │
         STAGE 2: TECHNICAL FILTER
         ├─ EMA144, EMA169, EMA233 ✓
         ├─ RSI(14) ✓
         ├─ Fractal structure ✓
         │
         └─ Result: ~50-100 pass → continue
                    ~0-50 fail → drop
                        │
                        ▼
         ┌─────────────────────────────┐
         │ Fetch Quarterly Financials  │
         │ (Income, Balance, Cash Flow)│
         │ (Polygon)                   │
         └────────────┬────────────────┘
                      │
         STAGE 4: FUNDAMENTALS FILTER
         ├─ Revenue growth > -10% YoY ✓
         ├─ Net margin > 0% ✓
         ├─ Free cash flow > 0 ✓
         ├─ Debt/equity < 3.0 ✓
         │
         └─ Result: ~30-50 pass → continue
                    ~20-30 fail → drop
                        │
                        ▼
         ┌─────────────────────────────┐
         │ Fetch Recent News Articles  │
         │ & Sentiment (Polygon)       │
         └────────────┬────────────────┘
                      │
         STAGE 5: SENTIMENT FILTER
         ├─ Count positive articles ✓
         ├─ Count negative articles ✓
         ├─ Pass if: positive ≥ negative ✓
         │
         └─ Result: ~20-30 pass → continue
                        │
                        ▼
         ┌─────────────────────────────┐
         │ Fetch Options Contracts     │
         │ (Polygon)                   │
         └────────────┬────────────────┘
                      │
         STAGE 7: OPTIONS FILTER
         ├─ Query 30-day expiration ✓
         ├─ Check ATM contracts exist ✓
         │
         └─ Result: All pass (informational)
                        │
                        ▼
         STAGE 6: CONVICTION SCORING
         ├─ Vegas tunnel proximity (25pts)
         ├─ RSI momentum (20pts)
         ├─ Swing structure (20pts)
         ├─ EMA alignment (15pts)
         │
         └─ Result: 0-100 score per stock
                        │
                        ▼
         ┌─────────────────────────────┐
         │ Final Ranked Results        │
         │ Sorted by conviction score  │
         │ Top 20-30 high-conviction   │
         │ setups ready for action     │
         └─────────────────────────────┘
```

## Testing the Data Integration

### Test Single Stock Analysis

```bash
curl http://localhost:3000/api/screener/analyze/NVDA | jq '.'
```

Response includes:
- Current price and Vegas EMAs
- Daily/weekly swing points (fractal structure)
- Conviction score breakdown
- Technical pass/fail status

### Test Full Screener

```bash
curl -X POST http://localhost:3000/api/screener/run \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": ["NVDA", "MSFT", "AAPL", "GOOGL", "AMZN"],
    "config": {
      "dailyMicroLookback": 11,
      "dailyMicroRetrace": 5,
      "weeklyMacroLookback": 50,
      "weeklyMacroRetrace": 25
    }
  }' | jq '.results[0]'
```

Example output:
```json
{
  "symbol": "NVDA",
  "convictionScore": 72.5,
  "technicalPass": true,
  "fundamentalPass": true,
  "sentimentPass": true,
  "optionsPass": true,
  "metadata": {
    "currentPrice": 175.32,
    "technicals": {
      "ema144": 170.41,
      "ema169": 168.93,
      "ema233": 166.22,
      "rsi14": 68.4
    },
    "dailySwingPoints": [
      {
        "date": "2026-07-18",
        "type": "HH",
        "price": 177.84,
        "barIndex": 495
      }
    ],
    "weeklySwingPoints": [
      {
        "date": "2026-07-11",
        "type": "HH",
        "price": 172.15,
        "barIndex": 95
      }
    ]
  }
}
```

## Data Freshness & Update Frequency

### Daily Candles
- **Updated**: After market close (4:00 PM ET)
- **Latency**: ~15-30 minutes
- **History**: 252 bars (1 year) available per query

### Financial Statements
- **Updated**: Within 2 business days of SEC filing
- **Frequency**: 4 per year (quarterly)
- **Lag**: Q3 data typically filed in November

### News & Sentiment
- **Updated**: Real-time as articles published
- **Frequency**: Multiple per day per stock
- **Lag**: 0-2 hours from publication

### Options Data
- **Updated**: Every 15 minutes during trading hours
- **Frequency**: Continuous
- **Lag**: Delayed by 15 minutes (by regulatory requirement)

## Cost Optimization

### Current Screener Cost Profile

Massive.com API pricing depends on endpoint usage:

**Per-Run Data Fetching** (100 stocks):
- 100 × (5 daily candles) = 500 calls
- 100 × (2 fundamentals queries) = 200 calls
- 100 × (1 news query) = 100 calls
- 100 × (1 options query) = 100 calls
- **Total**: ~900 API calls per run

**Optimization Ideas**:
1. **Cache fundamentals** - Only update quarterly (not per run)
2. **Cache news** - Only fetch for stocks that pass technical stage
3. **Batch universe syncs** - Run full screening weekly, not daily
4. **Incremental updates** - Only fetch new daily bars since last run

## Troubleshooting API Issues

### 401 Unauthorized

```bash
# Verify API key format
echo $MASSIVE_API_KEY
# Should output: your_key_here_without_quotes

# Check for typos in .env.local
grep MASSIVE_API_KEY .env.local
```

### 429 Too Many Requests

The screener includes rate limiting (1 second between batches). If you still hit limits:

1. Reduce concurrent requests in screener.ts (currently 5)
2. Increase batch delay from 1000ms to 2000ms
3. Request higher tier from Massive.com

### Empty Results from Financials

Some companies don't have public financials:
- Private companies
- ADRs (American Depositary Receipts)
- SPACs before merger

The screener gracefully skips the fundamental filter in these cases.

## Next Steps

1. **Deploy to production** - Database + API running live
2. **Build UI for screener results** - Display conviction scores + setup details
3. **Add portfolio sync** - Import Fidelity positions, track P&L
4. **Nightly batch jobs** - Run screener automatically each evening
5. **Alert system** - Notify on new high-conviction setups
