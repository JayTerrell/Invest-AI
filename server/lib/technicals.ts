/**
 * Technical Analysis Calculations
 *
 * Vegas Wave EMAs (144, 169, 233 periods)
 * RSI(14) calculation
 * Fractal swing point detection (daily + weekly)
 */

export interface Candle {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalValues {
  ema144: number;
  ema169: number;
  ema233: number;
  rsi14: number;
}

export interface SwingPoint {
  date: Date;
  type: "HH" | "HL" | "LH" | "LL";
  price: number;
  barIndex: number;
}

/**
 * Calculate exponential moving average
 */
export function calculateEMA(closes: number[], period: number): number[] {
  if (closes.length < period) return [];

  const emas: number[] = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA for the first period
  let sma = 0;
  for (let i = 0; i < period; i++) {
    sma += closes[i];
  }
  sma /= period;
  emas.push(sma);

  // Calculate EMA for remaining values
  for (let i = period; i < closes.length; i++) {
    const ema = closes[i] * multiplier + emas[i - period] * (1 - multiplier);
    emas.push(ema);
  }

  return emas;
}

/**
 * Calculate RSI(14)
 */
export function calculateRSI(closes: number[], period: number = 14): number[] {
  if (closes.length < period + 1) return [];

  const rsis: number[] = [];
  const changes: number[] = [];

  // Calculate price changes
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  // Calculate gains and losses
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    const change = changes[i];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }

  avgGain /= period;
  avgLoss /= period;

  // Calculate RSI
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    rsis.push(rsi);
  }

  return rsis;
}

/**
 * Detect fractal swing points with dynamic retracement filtering
 * lookback: number of bars to look back
 * minRetracePct: minimum retracement percentage of previous wave magnitude
 */
export function detectSwingPoints(
  candles: Candle[],
  lookback: number,
  minRetracePct: number
): SwingPoint[] {
  if (candles.length < lookback * 2) return [];

  const swings: SwingPoint[] = [];
  let lastType: "high" | "low" | null = null;
  let lastPrice = 0;
  let prevWaveMagnitude = 0;

  for (let i = lookback; i < candles.length; i++) {
    // Find highest/lowest in lookback window
    let highestPrice = -Infinity;
    let lowestPrice = Infinity;
    let highestIdx = i;
    let lowestIdx = i;

    for (let j = i - lookback + 1; j <= i; j++) {
      if (candles[j].high > highestPrice) {
        highestPrice = candles[j].high;
        highestIdx = j;
      }
      if (candles[j].low < lowestPrice) {
        lowestPrice = candles[j].low;
        lowestIdx = j;
      }
    }

    // Check for new highs (HH or HL)
    if (highestIdx === i) {
      if (lastType === "high") {
        // Same direction as last high - check if higher (HH)
        if (highestPrice > lastPrice) {
          // New HH - verify retracement if we have previous wave
          if (prevWaveMagnitude > 0) {
            const pctRetracement =
              ((highestPrice - lowestPrice) / prevWaveMagnitude) * 100;
            if (pctRetracement >= minRetracePct) {
              swings.push({
                date: candles[i].date,
                type: "HH",
                price: highestPrice,
                barIndex: i,
              });
              prevWaveMagnitude = Math.abs(highestPrice - lastPrice);
              lastPrice = highestPrice;
            }
          } else {
            swings.push({
              date: candles[i].date,
              type: "HH",
              price: highestPrice,
              barIndex: i,
            });
            lastPrice = highestPrice;
          }
        }
      } else if (lastType === "low") {
        // Trend change from low to high (LH)
        if (prevWaveMagnitude > 0) {
          const pctRetracement =
            ((highestPrice - lowestPrice) / prevWaveMagnitude) * 100;
          if (pctRetracement >= minRetracePct) {
            swings.push({
              date: candles[i].date,
              type: "LH",
              price: highestPrice,
              barIndex: i,
            });
            prevWaveMagnitude = Math.abs(highestPrice - lastPrice);
            lastPrice = highestPrice;
            lastType = "high";
          }
        } else {
          swings.push({
            date: candles[i].date,
            type: "LH",
            price: highestPrice,
            barIndex: i,
          });
          lastPrice = highestPrice;
          lastType = "high";
        }
      } else {
        // First swing point
        swings.push({
          date: candles[i].date,
          type: "HH",
          price: highestPrice,
          barIndex: i,
        });
        lastType = "high";
        lastPrice = highestPrice;
      }
    }

    // Check for new lows (LL or LH)
    if (lowestIdx === i) {
      if (lastType === "low") {
        // Same direction as last low - check if lower (LL)
        if (lowestPrice < lastPrice) {
          if (prevWaveMagnitude > 0) {
            const pctRetracement =
              ((highestPrice - lowestPrice) / prevWaveMagnitude) * 100;
            if (pctRetracement >= minRetracePct) {
              swings.push({
                date: candles[i].date,
                type: "LL",
                price: lowestPrice,
                barIndex: i,
              });
              prevWaveMagnitude = Math.abs(lastPrice - lowestPrice);
              lastPrice = lowestPrice;
            }
          } else {
            swings.push({
              date: candles[i].date,
              type: "LL",
              price: lowestPrice,
              barIndex: i,
            });
            lastPrice = lowestPrice;
          }
        }
      } else if (lastType === "high") {
        // Trend change from high to low (HL)
        if (prevWaveMagnitude > 0) {
          const pctRetracement =
            ((highestPrice - lowestPrice) / prevWaveMagnitude) * 100;
          if (pctRetracement >= minRetracePct) {
            swings.push({
              date: candles[i].date,
              type: "HL",
              price: lowestPrice,
              barIndex: i,
            });
            prevWaveMagnitude = Math.abs(lastPrice - lowestPrice);
            lastPrice = lowestPrice;
            lastType = "low";
          }
        } else {
          swings.push({
            date: candles[i].date,
            type: "HL",
            price: lowestPrice,
            barIndex: i,
          });
          lastPrice = lowestPrice;
          lastType = "low";
        }
      } else {
        // First swing point
        swings.push({
          date: candles[i].date,
          type: "LL",
          price: lowestPrice,
          barIndex: i,
        });
        lastType = "low";
        lastPrice = lowestPrice;
      }
    }
  }

  return swings;
}

/**
 * Calculate all technical values for a symbol
 */
export function calculateTechnicals(candles: Candle[]): TechnicalValues[] {
  if (candles.length < 233) return [];

  const closes = candles.map((c) => c.close);
  const ema144Values = calculateEMA(closes, 144);
  const ema169Values = calculateEMA(closes, 169);
  const ema233Values = calculateEMA(closes, 233);
  const rsiValues = calculateRSI(closes, 14);

  const results: TechnicalValues[] = [];

  // Start from index 232 (where all indicators have values)
  for (let i = 232; i < candles.length; i++) {
    results.push({
      ema144: ema144Values[i - (233 - 144)],
      ema169: ema169Values[i - (233 - 169)],
      ema233: ema233Values[i - (233 - 233)],
      rsi14: rsiValues[i - 233],
    });
  }

  return results;
}
