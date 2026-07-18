-- Users and authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  oauth_provider VARCHAR(50),
  oauth_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workspaces (multi-tenant)
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Screener configurations
CREATE TABLE IF NOT EXISTS screeners (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily market data (raw candles)
CREATE TABLE IF NOT EXISTS daily_candles (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  open DECIMAL(10, 2) NOT NULL,
  high DECIMAL(10, 2) NOT NULL,
  low DECIMAL(10, 2) NOT NULL,
  close DECIMAL(10, 2) NOT NULL,
  volume BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(symbol, date)
);

-- Fractal swing points (daily)
CREATE TABLE IF NOT EXISTS swing_points_daily (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(2) NOT NULL, -- 'HH', 'HL', 'LH', 'LL'
  price DECIMAL(10, 2) NOT NULL,
  bar_index INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weekly swing points
CREATE TABLE IF NOT EXISTS swing_points_weekly (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  week_start DATE NOT NULL,
  type VARCHAR(2) NOT NULL, -- 'HH', 'HL', 'LH', 'LL'
  price DECIMAL(10, 2) NOT NULL,
  bar_index INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vegas Wave EMAs
CREATE TABLE IF NOT EXISTS vegas_emas (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  timeframe VARCHAR(2) NOT NULL, -- 'D' for daily, 'W' for weekly
  ema_144 DECIMAL(10, 2),
  ema_169 DECIMAL(10, 2),
  ema_233 DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(symbol, date, timeframe)
);

-- RSI calculations
CREATE TABLE IF NOT EXISTS rsi_values (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  timeframe VARCHAR(2) NOT NULL, -- 'D' for daily, 'W' for weekly
  rsi_14 DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(symbol, date, timeframe)
);

-- Screener results
CREATE TABLE IF NOT EXISTS screener_runs (
  id UUID PRIMARY KEY,
  screener_id UUID NOT NULL REFERENCES screeners(id) ON DELETE CASCADE,
  run_date DATE NOT NULL,
  total_screened INT,
  total_passed INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual stock results from a screener run
CREATE TABLE IF NOT EXISTS screener_results (
  id BIGSERIAL PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES screener_runs(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  conviction_score DECIMAL(6, 2),
  technical_pass BOOLEAN,
  fundamental_pass BOOLEAN,
  sentiment_pass BOOLEAN,
  options_pass BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fundamental data (quarterly)
CREATE TABLE IF NOT EXISTS fundamentals_quarterly (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  quarter_end_date DATE NOT NULL,
  revenue BIGINT,
  gross_margin DECIMAL(5, 2),
  operating_margin DECIMAL(5, 2),
  net_margin DECIMAL(5, 2),
  debt_to_equity DECIMAL(10, 2),
  fcf BIGINT,
  eps DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(symbol, quarter_end_date)
);

-- Portfolio holdings
CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  quantity DECIMAL(12, 4) NOT NULL,
  average_cost DECIMAL(10, 2) NOT NULL,
  acquired_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Portfolio daily performance
CREATE TABLE IF NOT EXISTS portfolio_daily_pnl (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_value DECIMAL(12, 2),
  daily_pnl DECIMAL(12, 2),
  daily_return DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, date)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_daily_candles_symbol_date ON daily_candles(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_swing_points_daily_symbol ON swing_points_daily(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_swing_points_weekly_symbol ON swing_points_weekly(symbol);
CREATE INDEX IF NOT EXISTS idx_vegas_emas_symbol_date ON vegas_emas(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_rsi_values_symbol_date ON rsi_values(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_screener_runs_screener_id ON screener_runs(screener_id, run_date DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_user_id ON workspaces(user_id);
