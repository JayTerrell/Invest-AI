/**
 * Shared types between client and server
 */

export interface SwingPoint {
  date: string; // ISO string
  type: "HH" | "HL" | "LH" | "LL";
  price: number;
  barIndex: number;
}

export interface TechnicalValues {
  ema144: number;
  ema169: number;
  ema233: number;
  rsi14: number;
}

export interface ScreenerResult {
  symbol: string;
  convictionScore: number;
  technicalPass: boolean;
  fundamentalPass: boolean;
  sentimentPass: boolean;
  optionsPass: boolean;
  metadata: {
    currentPrice: number;
    dailySwingPoints: SwingPoint[];
    weeklySwingPoints: SwingPoint[];
    technicals: TechnicalValues;
  };
}

export interface ScreenerRunResponse {
  success: boolean;
  runId: string;
  timestamp: string;
  config: {
    dailyMicroLookback: number;
    dailyMicroRetrace: number;
    weeklyMacroLookback: number;
    weeklyMacroRetrace: number;
  };
  total: number;
  passed: number;
  results: ScreenerResult[];
}

export interface ScreenerAnalysisResponse {
  success: boolean;
  symbol: string;
  analysis: ScreenerResult;
}

export interface PortfolioHolding {
  symbol: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedReturn: number;
  acquiredDate: string;
}

export interface PortfolioDailyPnL {
  date: string;
  totalValue: number;
  dailyPnL: number;
  dailyReturn: number;
}
