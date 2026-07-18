# Invest-AI Platform Architecture

## Overview

Invest-AI is a production investment research platform that automates the analyst workflow. It replaces TradingView with an advanced multi-stage stock screener, real-time portfolio tracking, and configurable technical analysis.

## Core System Design

### Multi-Stage Screener Pipeline (8 Stages)

The screener processes the market universe through a precision funnel:

```
Stage 0: Universe Sync (Weekly)
   ↓
Stage 1: Daily Price Ingestion (Massive.com API)
   ↓
Stage 2: Technical Screen (Fractal + Vegas + RSI)
   ├→ Detects swing points (daily + weekly)
   ├→ Calculates Vegas EMAs (144, 169, 233)
   ├→ Calculates RSI(14) momentum
   └→ FILTERS: ~300-400 stocks → ~50-100 qualified
   ↓
Stage 3: Sector-Relative Comparison (Survivors only)
   └→ FILTERS: ~50-100 → ~20-30
   ↓
Stage 4: Fundamentals (Quarterly Filings)
   ├→ Revenue growth trends
   ├→ Margin analysis
   ├→ Debt/equity ratios
   └→ Free cash flow
   ↓
Stage 5: News Sentiment Aggregation
   ├→ Recent news scores
   ├→ Social signals
   └→ Insider transactions
   ↓
Stage 6: Conviction Scoring
   ├→ Vegas tunnel proximity (25pts)
   ├→ RSI momentum (20pts)
   ├→ Swing point structure (20pts)
   ├→ EMA alignment (15pts)
   └→ OUTPUT: 0-100 conviction score per stock
   ↓
Stage 7: Options Analysis
   ├→ IV rank positioning
   ├→ Options flow signals
   ├→ Greeks analysis
   └→ Earnings dates
   ↓
Stage 8: Run Logging
   └→ Persist results to database
```

## Technical Analysis System

### Fractal Market Structure Detection

Identifies swing points (Higher Highs, Lower Lows, etc.) using dynamic retracement filtering:

**Daily Settings** (Micro trends):
- Lookback: 11 bars (sub-2 week moves)
- Min retracement: 5% of previous wave magnitude

**Weekly Settings** (Macro trends):
- Lookback: 50 bars
- Min retracement: 25% of previous wave magnitude

Formula: `retracement_pct = (pullback_size / previous_wave_magnitude) * 100`

### Vegas Wave EMAs

Three-layer exponential moving average (144, 169, 233 periods) creates dynamic support/resistance tunnel:
- Forms confluence zone for entry signals
- Indicates trend strength via alignment
- Calculated daily and weekly

### Momentum Confirmation

RSI(14) provides secondary confirmation:
- Oversold < 30: High conviction buys
- Overbought > 70: Caution signals
- 50-70: Positive momentum bias

## Database Schema

### Core Tables

**users** - Authentication & workspace ownership
**workspaces** - Multi-tenant isolated environments
**screeners** - Saved screener configurations

**daily_candles** - Raw OHLCV data
**swing_points_daily** - Detected micro trends
**swing_points_weekly** - Detected macro trends

**vegas_emas** - EMA144, EMA169, EMA233 values
**rsi_values** - RSI(14) momentum calculations

**screener_runs** - Historical screener executions
**screener_results** - Individual stock results per run

**fundamentals_quarterly** - Company financial data
**portfolio_holdings** - User positions
**portfolio_daily_pnl** - Performance tracking

See `server/db/schema.sql` for complete DDL.

## API Endpoints

### Screener Operations

```
POST /api/screener/run
  body: { symbols: string[], config: ScreenerConfig }
  response: ScreenerRunResponse with full results

GET /api/screener/analyze/:symbol
  response: Single-stock technical analysis

GET /api/screener/symbols
  response: List of available tickers to screen
```

### Configuration

All screener settings are configurable:
- `dailyMicroLookback` (default: 11 bars)
- `dailyMicroRetrace` (default: 5%)
- `weeklyMacroLookback` (default: 50 bars)
- `weeklyMacroRetrace` (default: 25%)

## Data Sources

### Massive.com Integration

The platform uses Massive.com API for real-time market data:

**Required Setup:**
1. Get API key from https://massive.com
2. Add to `.env.local`: `MASSIVE_API_KEY=your_key_here`

**Data Available:**
- Daily candles (up to 20+ years)
- Weekly candles
- Quote data
- Universe metadata (5000+ symbols)

See `server/lib/massive.ts` for implementation.

## File Structure

```
server/
  ├── lib/
  │   ├── technicals.ts      # EMA, RSI, swing detection
  │   ├── screener.ts        # 8-stage pipeline
  │   └── massive.ts         # API integration
  ├── db/
  │   ├── schema.sql         # Database DDL
  │   └── client.ts          # Connection pooling
  └── routes/
      ├── screener.ts        # REST endpoints
      └── index.ts           # Server setup
shared/
  └── types.ts               # Client/server types
client/
  └── pages/
      ├── Terminal.tsx       # Charts (lightweight-charts)
      ├── Watchlist.tsx      # Screener results
      ├── Financials.tsx     # Fundamentals
      └── ...
```

## Conviction Scoring System

Raw conviction score (0-100) combines multiple signals:

- **Vegas Tunnel Proximity** (25pts): Distance to EMA144/233
- **RSI Momentum** (20pts): Oversold/overbought extremes
- **Swing Structure** (20pts): Recent fractal setup quality
- **EMA Alignment** (15pts): 144 > 169 > 233 (uptrend)

Stocks are ranked by conviction for portfolio focus.

## Performance Characteristics

### Screener Runtime

With S&P 100 universe:
- Stage 2 (Technical): ~50-80 seconds (API-bound)
- Stages 4-7: Quick (fundamental/sentiment data cached)
- Total: ~2-3 minutes per full run

Optimizations:
- Batch API requests (5 concurrent with rate-limit delays)
- Database indexes on symbol + date
- ResultSet caching for same-day reruns

## Development Workflow

### Setting Up Locally

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Fill in MASSIVE_API_KEY and DATABASE_URL
   ```

3. **Initialize database:**
   ```bash
   psql $DATABASE_URL -f server/db/schema.sql
   ```

4. **Run development server:**
   ```bash
   pnpm dev
   ```

### Building for Production

```bash
pnpm run build
pnpm start
```

## Next Implementation Priorities

1. **User Authentication** - OAuth (Google/GitHub/Apple)
2. **Portfolio Sync** - Fidelity/Schwab API integration
3. **Fundamentals Data** - SEC EDGAR integration
4. **News Sentiment** - Real-time news aggregation
5. **Options Greeks** - IV rank and flow analysis
6. **Client UI** - Screener results display + charting

## Configuration for Your Workflow

Your 4-step analysis process maps to the screener:

1. **Technical Analysis** → Stage 2 (fractal detection + Vegas + RSI)
2. **Fundamental Analysis** → Stage 4 (margins, FCF, growth)
3. **Sentiment Analysis** → Stage 5 (news + flow)
4. **Position Sizing** → Stage 6 (conviction scoring)

Users can enable/disable stages and adjust thresholds per workspace.
