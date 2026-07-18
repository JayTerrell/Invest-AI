/**
 * Screener API Routes
 *
 * POST /api/screener/run - Execute a full screener run
 * GET /api/screener/results/:runId - Get results from a previous run
 * POST /api/screener/config - Save screener configuration
 */

import { Router, Request, Response } from "express";
import { runScreener, ScreenerConfig } from "../lib/screener";
import { randomUUID } from "crypto";

const router = Router();

// List of symbols to screen (S&P 100 for now)
const S_P_100_SYMBOLS = [
  "AAPL",
  "MSFT",
  "NVDA",
  "GOOGL",
  "AMZN",
  "META",
  "TSLA",
  "AVGO",
  "JPM",
  "V",
  "UNH",
  "XOM",
  "LLY",
  "CAT",
  "COST",
  "AMD",
  "NFLX",
  "INTC",
  "UBER",
  "GS",
  "BA",
  "CSCO",
  "QCOM",
  "TXN",
  "IBM",
  "WMT",
  "MCD",
  "PG",
  "JNJ",
  "KO",
  "CVX",
  "COP",
  "MPC",
  "PSX",
  "VLO",
  "FANG",
  "SO",
  "DUK",
  "NEE",
  "AEP",
  "EXC",
  "PEG",
  "PNW",
  "SRE",
];

/**
 * Run a full screener across the universe
 * Query params:
 *   - symbols: comma-separated list (default: S&P 100)
 *   - dailyLookback: daily micro lookback bars (default: 11)
 *   - dailyRetrace: daily micro retrace % (default: 5)
  */
router.post("/api/screener/run", async (req: Request, res: Response) => {
  try {
    const { symbols, config } = req.body;
    const symbolList = symbols || S_P_100_SYMBOLS;

    const screenerConfig: ScreenerConfig = config || {
      dailyMicroLookback: 11,
      dailyMicroRetrace: 5,
      weeklyMacroLookback: 50,
      weeklyMacroRetrace: 25,
    };

    // Run screener
    const results = await runScreener(symbolList, screenerConfig);

    // Filter to only passing stocks
    const passedResults = results.filter(
      (r) => r.technicalPass || r.convictionScore > 0
    );

    res.json({
      success: true,
      runId: randomUUID(),
      timestamp: new Date().toISOString(),
      config: screenerConfig,
      total: symbolList.length,
      passed: passedResults.length,
      results: passedResults.sort(
        (a, b) => b.convictionScore - a.convictionScore
      ),
    });
  } catch (error) {
    console.error("Screener error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Quick technical analysis for a single symbol
 * GET /api/screener/analyze/:symbol
 */
router.get(
  "/api/screener/analyze/:symbol",
  async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const config: ScreenerConfig = {
        dailyMicroLookback: 11,
        dailyMicroRetrace: 5,
        weeklyMacroLookback: 50,
        weeklyMacroRetrace: 25,
      };

      const results = await runScreener([symbol], config);
      const result = results[0];

      res.json({
        success: true,
        symbol,
        analysis: result,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * Get available symbols (S&P 100)
 * GET /api/screener/symbols
 */
router.get("/api/screener/symbols", (_req: Request, res: Response) => {
  res.json({
    success: true,
    count: S_P_100_SYMBOLS.length,
    symbols: S_P_100_SYMBOLS,
  });
});

export default router;
