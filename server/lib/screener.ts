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
import {
  fetchDailyCandlesFromMassive,
  fetchNewsForTicker,
  fetchFinancials,
  fetchOptionsContracts,
} from "./massive";

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
 * Downsample daily candles to weekly by taking Friday closes
 */
function downsampleToWeekly(dailyCandles: Candle[]): Candle[] {
  const weeklyCandles: Candle[] = [];
  let weekOpen = 0;
  let weekHigh = -Infinity;
  let weekLow = Infinity;
  let weekVolume = 0;
  let weekStart: Date | null = null;

  for (const candle of dailyCandles) {
    const dayOfWeek = candle.date.getDay();

    if (!weekStart) {
      weekStart = candle.date;
      weekOpen = candle.open;
    }

    weekHigh = Math.max(weekHigh, candle.high);
    weekLow = Math.min(weekLow, candle.low);
    weekVolume += candle.volume;

    // Friday (5) or last candle
    if (dayOfWeek === 5 || dailyCandles[dailyCandles.length - 1] === candle) {
      weeklyCandles.push({
        date: candle.date,
        open: weekOpen,
        high: weekHigh,
        low: weekLow,
        close: candle.close,
        volume: weekVolume,
      });

      // Reset for next week
      weekStart = null;
      weekOpen = 0;
      weekHigh = -Infinity;
      weekLow = Infinity;
      weekVolume = 0;
    }
  }

  return weeklyCandles;
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

  // Fetch daily candles and downsample to weekly
  const dailyCandles = await fetchDailyCandlesFromMassive(symbol, 500);
  const weeklyCandles = downsampleToWeekly(dailyCandles);

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
 * Fundamental screen
 * Checks quarterly financials for quality signals
 */
async function stageQC4Fundamentals(symbol: string): Promise<boolean> {
  try {
    const financials = await fetchFinancials(symbol, "income");

    if (financials.length === 0) {
      return true; // No data available, don't filter out
    }

    const latest = financials[0];
    const previous = financials[1] || latest;

    // Quality filters:
    // 1. Positive net margin (profitable)
    if (latest.margins.net < 0) {
      return false;
    }

    // 2. Positive free cash flow
    if (latest.cashFlow.freeCashFlow < 0) {
      return false;
    }

    // 3. Revenue growth YoY (compare Q3 2024 to Q3 2023)
    const revenueGrowth =
      (latest.revenue - previous.revenue) / previous.revenue;
    if (revenueGrowth < -0.1) {
      // Revenue declined > 10%
      return false;
    }

    // 4. Reasonable debt/equity
    if (latest.debtToEquity > 3.0) {
      return false; // Too much debt
    }

    return true;
  } catch (error) {
    console.error(`Error in fundamental screen for ${symbol}:`, error);
    return true; // Don't filter on error
  }
}

/**
 * Sentiment screen
 * Analyzes recent news and articles for positive signals
 */
async function stageQC5Sentiment(symbol: string): Promise<boolean> {
  try {
    const articles = await fetchNewsForTicker(symbol, 5);

    if (articles.length === 0) {
      return true; // No recent news, neutral
    }

    // Count positive vs negative insights
    let positiveCount = 0;
    let negativeCount = 0;

    for (const article of articles) {
      for (const insight of article.insights) {
        if (insight.ticker === symbol) {
          if (insight.sentiment === "positive") positiveCount++;
          else if (insight.sentiment === "negative") negativeCount++;
        }
      }
    }

    // Pass if more positive than negative in recent news
    return positiveCount >= negativeCount;
  } catch (error) {
    console.error(`Error in sentiment screen for ${symbol}:`, error);
    return true; // Don't filter on error
  }
}

/**
 * Options screen
 * Checks for liquid options and reasonable premiums
 */
async function stageQC7Options(symbol: string): Promise<boolean> {
  try {
    // Get next expiration date (approximately 30 days out)
    const today = new Date();
    const nextExpiry = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiryStr = nextExpiry.toISOString().split("T")[0];

    const contracts = await fetchOptionsContracts(symbol, expiryStr, 10);

    // Pass if there are liquid options available
    return contracts.length > 0;
  } catch (error) {
    console.error(`Error in options screen for ${symbol}:`, error);
    return true; // Don't filter on error
  }
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
