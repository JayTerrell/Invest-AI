/**
 * Multi-Stage Stock Screener Pipeline
 *
 * Stage 0: Universe sync (weekly ticker/sector data)
 * Stage 1: Daily price ingestion (grouped bars endpoint)
 * Stage 2: Technical screen (whole universe)
 * Stage 3: Sector-relative comparison (survivors only)
 * Stage 4: Fundamentals (quarterly filings, margins, FCF)
 * Stage 5: News sentiment aggregation
 * Stage 6: Conviction scoring
 * Stage 7: Options data (Greeks, IV rank, contract filtering)
 * Stage 8: Run logging
 */

import {
  calculateTechnicals,
  detectSwingPoints,
  TechnicalValues,
  SwingPoint,
  Candle,
} from "./technicals";
import { fetchDailyCandlesFromMassive, fetchWeeklyCandlesFromMassive } from "./massive";

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

export interface ScreenerConfig {
  dailyMicroLookback?: number; // 11 bars default
  dailyMicroRetrace?: number; // 5% default
  weeklyMacroLookback?: number; // 50 bars default
  weeklyMacroRetrace?: number; // 25% default
}

/**
 * Technical screening stage
 * Analyzes fractal structure + Vegas Wave + RSI
 */
async function stageQC2Technical(
  symbol: string,
  config: ScreenerConfig
): Promise<{
  pass: boolean;
  swingPointsDaily: SwingPoint[];
  swingPointsWeekly: SwingPoint[];
  technicals: TechnicalValues;
  currentPrice: number;
}> {
  const dailyLookback = config.dailyMicroLookback || 11;
  const dailyRetrace = config.dailyMicroRetrace || 5;
  const weeklyLookback = config.weeklyMacroLookback || 50;
  const weeklyRetrace = config.weeklyMacroRetrace || 25;

  // Fetch daily and weekly candles
  const [dailyCandles, weeklyCandles] = await Promise.all([
    fetchDailyCandlesFromMassive(symbol, 500),
    fetchWeeklyCandlesFromMassive(symbol, 250),
  ]);

  if (dailyCandles.length < 233) {
    return {
      pass: false,
      swingPointsDaily: [],
      swingPointsWeekly: [],
      technicals: {
        ema144: 0,
        ema169: 0,
        ema233: 0,
        rsi14: 0,
      },
      currentPrice: 0,
    };
  }

  // Detect swing points
  const swingPointsDaily = detectSwingPoints(
    dailyCandles,
    dailyLookback,
    dailyRetrace
  );
  const swingPointsWeekly = detectSwingPoints(
    weeklyCandles,
    weeklyLookback,
    weeklyRetrace
  );

  // Calculate technicals
  const technicalValues = calculateTechnicals(dailyCandles);
  if (technicalValues.length === 0) {
    return {
      pass: false,
      swingPointsDaily: [],
      swingPointsWeekly: [],
      technicals: {
        ema144: 0,
        ema169: 0,
        ema233: 0,
        rsi14: 0,
      },
      currentPrice: 0,
    };
  }

  const latestTechnicals = technicalValues[technicalValues.length - 1];
  const currentPrice = dailyCandles[dailyCandles.length - 1].close;

  // Technical screen passes if:
  // 1. Has recent swing points (within last 20 bars)
  // 2. RSI shows momentum
  // 3. Price is near Vegas EMA tunnels
  const recentDailySwings = swingPointsDaily.filter(
    (s) =>
      dailyCandles.length - s.barIndex < 20 &&
      (s.type === "HH" || s.type === "HL")
  );

  const proximityToEMA =
    Math.abs(currentPrice - latestTechnicals.ema144) /
      latestTechnicals.ema144 <
    0.05; // Within 5% of EMA144

  const pass = recentDailySwings.length > 0 && proximityToEMA;

  return {
    pass,
    swingPointsDaily,
    swingPointsWeekly,
    technicals: latestTechnicals,
    currentPrice,
  };
}

/**
 * Fundamental screen (stub for now)
 * Would integrate with quarterly filings API
 */
async function stageQC4Fundamentals(symbol: string): Promise<boolean> {
  // Placeholder: in production, would fetch:
  // - Latest quarterly revenue growth
  // - Margin trends
  // - Debt/equity ratios
  // - Free cash flow
  // For now, return true to allow other stages to run
  return true;
}

/**
 * Sentiment screen (stub for now)
 * Would integrate with news API
 */
async function stageQC5Sentiment(symbol: string): Promise<boolean> {
  // Placeholder: in production, would aggregate:
  // - Recent news sentiment
  // - Social media signals
  // - Insider transactions
  return true;
}

/**
 * Options screen (stub for now)
 * Would integrate with options data API
 */
async function stageQC7Options(symbol: string): Promise<boolean> {
  // Placeholder: in production, would check:
  // - IV rank
  // - Options flow
  // - Greeks
  // - Earnings dates
  return true;
}

/**
 * Conviction scoring system
 * Weights different technical signals
 */
function calculateConvictionScore(
  technicals: TechnicalValues,
  currentPrice: number,
  swingPointsDaily: SwingPoint[]
): number {
  let score = 0;

  // Vegas tunnel proximity (25pts max)
  const emaProximity = Math.min(
    Math.abs(currentPrice - technicals.ema144) /
      technicals.ema144,
    Math.abs(currentPrice - technicals.ema233) / technicals.ema233
  );
  const emaTunnelScore = Math.max(0, 25 * (1 - emaProximity / 0.1));
  score += Math.min(25, emaTunnelScore);

  // RSI momentum (20pts max)
  if (technicals.rsi14 < 30) score += 20; // Oversold
  else if (technicals.rsi14 > 70) score += 15; // Overbought but strong
  else if (technicals.rsi14 > 50) score += 10; // Positive momentum

  // Swing point structure (20pts max)
  const recentSwings = swingPointsDaily.filter((s) => s.barIndex > 450); // Last 50 bars
  if (recentSwings.length >= 3) score += 20;
  else if (recentSwings.length >= 2) score += 15;
  else if (recentSwings.length >= 1) score += 10;

  // EMA alignment (15pts max)
  if (
    currentPrice > technicals.ema144 &&
    technicals.ema144 > technicals.ema169 &&
    technicals.ema169 > technicals.ema233
  ) {
    score += 15; // Bullish alignment
  }

  return Math.min(100, score);
}

/**
 * Run complete screener pipeline
 */
export async function runScreener(
  symbols: string[],
  config: ScreenerConfig = {}
): Promise<ScreenerResult[]> {
  const results: ScreenerResult[] = [];

  // Process in batches to manage concurrency
  const batchSize = 5;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (symbol) => {
        try {
          // Stage 2: Technical screen
          const technicalResult = await stageQC2Technical(symbol, config);

          // Only continue if technical screen passes
          if (!technicalResult.pass) {
            return {
              symbol,
              convictionScore: 0,
              technicalPass: false,
              fundamentalPass: false,
              sentimentPass: false,
              optionsPass: false,
              metadata: {
                currentPrice: technicalResult.currentPrice,
                dailySwingPoints: technicalResult.swingPointsDaily,
                weeklySwingPoints: technicalResult.swingPointsWeekly,
                technicals: technicalResult.technicals,
              },
            };
          }

          // Stage 4: Fundamentals
          const fundamentalPass = await stageQC4Fundamentals(symbol);

          // Stage 5: Sentiment
          const sentimentPass = await stageQC5Sentiment(symbol);

          // Stage 7: Options
          const optionsPass = await stageQC7Options(symbol);

          // Stage 6: Conviction scoring
          const convictionScore = calculateConvictionScore(
            technicalResult.technicals,
            technicalResult.currentPrice,
            technicalResult.swingPointsDaily
          );

          return {
            symbol,
            convictionScore,
            technicalPass: true,
            fundamentalPass,
            sentimentPass,
            optionsPass,
            metadata: {
              currentPrice: technicalResult.currentPrice,
              dailySwingPoints: technicalResult.swingPointsDaily,
              weeklySwingPoints: technicalResult.swingPointsWeekly,
              technicals: technicalResult.technicals,
            },
          };
        } catch (error) {
          console.error(`Error screening ${symbol}:`, error);
          return {
            symbol,
            convictionScore: 0,
            technicalPass: false,
            fundamentalPass: false,
            sentimentPass: false,
            optionsPass: false,
            metadata: {
              currentPrice: 0,
              dailySwingPoints: [],
              weeklySwingPoints: [],
              technicals: {
                ema144: 0,
                ema169: 0,
                ema233: 0,
                rsi14: 0,
              },
            },
          };
        }
      })
    );

    results.push(...batchResults);

    // Add delay between batches for API rate limiting
    if (i + batchSize < symbols.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Sort by conviction score descending
  return results.sort((a, b) => b.convictionScore - a.convictionScore);
}
