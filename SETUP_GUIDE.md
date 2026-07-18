# Invest-AI Setup & Deployment Guide

## Quick Start (Development)

### Prerequisites
- Node.js 18+ (pnpm v10+ installed)
- PostgreSQL 13+
- Massive.com API key

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Required: Massive.com API Key
MASSIVE_API_KEY=your_api_key_from_massive_com

# Required: PostgreSQL connection
DATABASE_URL=postgresql://username:password@localhost:5432/invest_ai

# Optional: OAuth (for future authentication)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### 3. Initialize Database

```bash
# Create database
createdb invest_ai

# Run schema
psql invest_ai -f server/db/schema.sql

# Verify tables
psql invest_ai -c "\dt"
```

### 4. Run Development Server

```bash
pnpm dev
```

Server will start on `http://localhost:5173` (Vite) with Express API at `http://localhost:3000`.

## Testing the Screener

### Single Stock Analysis

```bash
curl http://localhost:3000/api/screener/analyze/NVDA
```

Response:
```json
{
  "success": true,
  "symbol": "NVDA",
  "analysis": {
    "symbol": "NVDA",
    "convictionScore": 65.3,
    "technicalPass": true,
    "metadata": {
      "currentPrice": 172.45,
      "technicals": {
        "ema144": 169.20,
        "ema169": 168.50,
        "ema233": 167.80,
        "rsi14": 72.3
      },
      "dailySwingPoints": [
        {
          "date": "2024-07-18",
          "type": "HH",
          "price": 175.20,
          "barIndex": 495
        }
      ]
    }
  }
}
```

### Run Full Screener (S&P 100)

```bash
curl -X POST http://localhost:3000/api/screener/run \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": ["NVDA", "MSFT", "AAPL"],
    "config": {
      "dailyMicroLookback": 11,
      "dailyMicroRetrace": 5,
      "weeklyMacroLookback": 50,
      "weeklyMacroRetrace": 25
    }
  }'
```

### Get Available Symbols

```bash
curl http://localhost:3000/api/screener/symbols
```

## Production Deployment

### Build for Production

```bash
pnpm run build
```

Output:
- Client bundle: `dist/spa/`
- Server bundle: `dist/server/`

### Run Production Server

```bash
NODE_ENV=production node dist/server/node-build.mjs
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://prod_user:prod_pass@prod_host:5432/invest_ai
MASSIVE_API_KEY=your_production_key
```

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .

RUN npm install -g pnpm
RUN pnpm install
RUN pnpm run build

EXPOSE 3000
CMD ["node", "dist/server/node-build.mjs"]
```

Build & run:
```bash
docker build -t invest-ai .
docker run -p 3000:3000 -e DATABASE_URL=... -e MASSIVE_API_KEY=... invest-ai
```

## Screener Configuration

### Default Settings (Your Current Config)

```typescript
{
  dailyMicroLookback: 11,      // Sub-2-week swings
  dailyMicroRetrace: 5,        // 5% minimum retracement
  weeklyMacroLookback: 50,     // Macro structure
  weeklyMacroRetrace: 25       // 25% retracement for weekly
}
```

### Customization Examples

**Aggressive (More signals):**
```json
{
  "dailyMicroLookback": 8,
  "dailyMicroRetrace": 2,
  "weeklyMacroLookback": 40,
  "weeklyMacroRetrace": 15
}
```

**Conservative (Fewer false positives):**
```json
{
  "dailyMicroLookback": 14,
  "dailyMicroRetrace": 8,
  "weeklyMacroLookback": 60,
  "weeklyMacroRetrace": 35
}
```

## Database Maintenance

### Backup

```bash
pg_dump invest_ai > backup-$(date +%Y%m%d).sql
```

### Restore

```bash
psql invest_ai < backup-20240718.sql
```

### Monitor Tables

```sql
-- Count screener results
SELECT symbol, COUNT(*) as results_count 
FROM screener_results 
GROUP BY symbol 
ORDER BY results_count DESC;

-- Latest swing points
SELECT symbol, date, type, price 
FROM swing_points_daily 
WHERE date >= NOW() - INTERVAL '5 days'
ORDER BY date DESC;

-- Recent screener runs
SELECT run_date, total_screened, total_passed 
FROM screener_runs 
ORDER BY run_date DESC 
LIMIT 10;
```

## Troubleshooting

### "Cannot find module 'pg'"

```bash
pnpm install @types/pg pg
```

### Database Connection Error

1. Verify PostgreSQL is running:
   ```bash
   psql -c "SELECT version();"
   ```

2. Check connection string:
   ```bash
   psql $DATABASE_URL -c "SELECT NOW();"
   ```

3. Verify schema is loaded:
   ```bash
   psql invest_ai -c "\dt"
   ```

### API Returns 500 Errors

1. Check server logs:
   ```bash
   pnpm dev
   ```

2. Verify Massive.com API key:
   ```bash
   curl -H "Authorization: Bearer $MASSIVE_API_KEY" \
     https://api.massive.com/api/v1/universe
   ```

3. Check database health:
   ```bash
   psql invest_ai -c "SELECT COUNT(*) FROM daily_candles;"
   ```

### Slow Screener Performance

Check database indexes:
```sql
-- Verify indexes exist
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('daily_candles', 'swing_points_daily', 'rsi_values');

-- Add missing indexes if needed
CREATE INDEX idx_daily_candles_symbol_date ON daily_candles(symbol, date DESC);
```

## Next Steps

1. **Implement User Authentication**
   - OAuth (Google/GitHub/Apple)
   - JWT session tokens
   - Workspace isolation

2. **Build Screener Results UI**
   - Display conviction scores
   - Interactive filtering
   - Export to CSV

3. **Add Portfolio Tracking**
   - Fidelity/Schwab API integration
   - Daily P&L calculations
   - Position performance attribution

4. **Integrate Fundamental Data**
   - SEC EDGAR filings
   - Quarterly metrics
   - Valuation ratios

5. **Add News Sentiment**
   - News aggregation API
   - Sentiment scoring
   - Insider transaction tracking

6. **Implement Options Analysis**
   - IV rank positioning
   - Greeks calculations
   - Earnings catalysts

## Performance Metrics

### Current Benchmarks (S&P 100)

| Stage | Time | Output |
|-------|------|--------|
| Stage 2 (Technical) | 50-80s | ~50-100 stocks |
| Stage 4 (Fundamentals) | <1s | Cached |
| Stage 6 (Conviction) | <1s | 0-100 scores |
| **Total** | **2-3 min** | **Ranked results** |

### Optimization Roadmap

- [ ] Implement result caching (same-day reruns)
- [ ] Add incremental updates (only changed candles)
- [ ] Parallel batch processing (10 concurrent)
- [ ] Redis caching for API responses
- [ ] GraphQL instead of REST (single query)

## Support & Resources

- **Massive.com Docs**: https://massive.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Express.js Docs**: https://expressjs.com/
- **Technical Analysis Theory**: See PLATFORM_ARCHITECTURE.md
