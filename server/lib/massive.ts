/**
 * Massive.com API Integration
 *
 * Fetches real-time market data from Massive.com API.
 * Uses API key from environment variable MASSIVE_API_KEY.
 */

import { Candle } from "./technicals";

const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY || "";
const MASSIVE_BASE_URL = "https://api.massive.com/api/v1";

if (!MASSIVE_API_KEY) {
  console.warn(
    "Warning: MASSIVE_API_KEY not set. Market data will be unavailable."
  );
}

export interface MassiveTickerData {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  marketCap: number;
  pe: number;
  beta: number;
  divYield: number;
  eps: number;
}

export interface MassiveBarsResponse {
  bars: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  meta: {
    symbol: string;
    resolution: string;
    count: number;
  };
}

/**
 * Fetch daily candle data from Massive.com
 * Returns most recent N bars
 */
export async function fetchDailyCandlesFromMassive(
  symbol: string,
  limit: number = 500
): Promise<Candle[]> {
  if (!MASSIVE_API_KEY) {
    throw new Error("MASSIVE_API_KEY not configured");
  }

  try {
    const url = new URL(`${MASSIVE_BASE_URL}/bars`);
    url.searchParams.append("symbol", symbol);
    url.searchParams.append("resolution", "1D");
    url.searchParams.append("limit", limit.toString());

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${MASSIVE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Massive.com API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as MassiveBarsResponse;

    // Convert to our Candle format
    return data.bars
      .map((bar) => ({
        date: new Date(bar.timestamp * 1000),
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime()); // Ensure chronological order
  } catch (error) {
    console.error(`Error fetching candles for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Fetch weekly candle data from Massive.com
 */
export async function fetchWeeklyCandlesFromMassive(
  symbol: string,
  limit: number = 250
): Promise<Candle[]> {
  if (!MASSIVE_API_KEY) {
    throw new Error("MASSIVE_API_KEY not configured");
  }

  try {
    const url = new URL(`${MASSIVE_BASE_URL}/bars`);
    url.searchParams.append("symbol", symbol);
    url.searchParams.append("resolution", "1W");
    url.searchParams.append("limit", limit.toString());

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${MASSIVE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Massive.com API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as MassiveBarsResponse;

    return data.bars
      .map((bar) => ({
        date: new Date(bar.timestamp * 1000),
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch (error) {
    console.error(`Error fetching weekly candles for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Fetch universe of stocks (tickers and metadata)
 */
export async function fetchUniverseFromMassive(): Promise<MassiveTickerData[]> {
  if (!MASSIVE_API_KEY) {
    throw new Error("MASSIVE_API_KEY not configured");
  }

  try {
    const url = new URL(`${MASSIVE_BASE_URL}/universe`);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${MASSIVE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Massive.com API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as {
      symbols: MassiveTickerData[];
    };
    return data.symbols;
  } catch (error) {
    console.error("Error fetching universe:", error);
    throw error;
  }
}

/**
 * Fetch latest quote for a symbol
 */
export async function fetchLatestQuote(symbol: string) {
  if (!MASSIVE_API_KEY) {
    throw new Error("MASSIVE_API_KEY not configured");
  }

  try {
    const url = new URL(`${MASSIVE_BASE_URL}/quote`);
    url.searchParams.append("symbol", symbol);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${MASSIVE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Massive.com API error: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Batch fetch candles for multiple symbols
 */
export async function fetchCandlesForSymbols(
  symbols: string[],
  timeframe: "1D" | "1W" = "1D",
  limit: number = 500
): Promise<Map<string, Candle[]>> {
  const results = new Map<string, Candle[]>();

  // Parallel fetch with concurrency limit (5 at a time)
  const concurrency = 5;
  for (let i = 0; i < symbols.length; i += concurrency) {
    const batch = symbols.slice(i, i + concurrency);
    const promises = batch.map(async (symbol) => {
      try {
        const candles =
          timeframe === "1W"
            ? await fetchWeeklyCandlesFromMassive(symbol, limit)
            : await fetchDailyCandlesFromMassive(symbol, limit);
        results.set(symbol, candles);
      } catch (error) {
        console.error(`Failed to fetch ${symbol}:`, error);
      }
    });

    await Promise.all(promises);

    // Add delay between batches to respect API rate limits
    if (i + concurrency < symbols.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
