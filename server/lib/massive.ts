/**
 * Polygon.io via Massive.com API Integration
 *
 * Complete market data, fundamentals, news sentiment, and options pricing.
 * Uses API key from environment variable MASSIVE_API_KEY.
 */

export interface Candle {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
}

export interface TickerDetails {
  symbol: string;
  name: string;
  market: string;
  exchange: string;
  currency: string;
  active: boolean;
  marketCap: number;
  description: string;
  website: string;
  employees: number;
  ipoDate: string;
  sharesOutstanding: number;
  sectorCode: string;
  sectorName: string;
  phone: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  author: string;
  publishedAt: string;
  url: string;
  description: string;
  keywords: string[];
  relatedTickers: string[];
  publisher: {
    name: string;
    url: string;
  };
  insights: Array<{
    ticker: string;
    sentiment: "positive" | "negative" | "neutral";
    reasoning: string;
  }>;
}

export interface FinancialMetrics {
  revenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  earnings: {
    basic: number;
    diluted: number;
  };
  shares: {
    basic: number;
    diluted: number;
  };
  margins: {
    gross: number;
    operating: number;
    net: number;
  };
  balanceSheet: {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    cashAndEquivalents: number;
    receivables: number;
    inventories: number;
    accountsPayable: number;
    longTermDebt: number;
  };
  cashFlow: {
    operatingActivities: number;
    investingActivities: number;
    financingActivities: number;
    changeInCash: number;
    dividends: number;
    freeCashFlow: number;
  };
  debtToEquity: number;
  period: {
    endDate: string;
    fiscalYear: number;
    fiscalQuarter: number;
    filingDate: string;
  };
}

export interface OptionContract {
  ticker: string;
  underlyingTicker: string;
  strikePrice: number;
  expirationDate: string;
  contractType: "call" | "put";
  premium: number;
  totalContractCost: number;
  volume: number;
}

const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY || "";
const POLYGON_BASE_URL = "https://api.polygon.io";

if (!MASSIVE_API_KEY) {
  console.warn(
    "Warning: MASSIVE_API_KEY not set. Market data will be unavailable."
  );
}

/**
 * Fetch daily candle data (up to 252 bars = 1 year)
 */
export async function fetchDailyCandlesFromMassive(
  symbol: string,
  limit: number = 252
): Promise<Candle[]> {
  if (!MASSIVE_API_KEY) {
    throw new Error("MASSIVE_API_KEY not configured");
  }

  try {
    const url = new URL(
      `${POLYGON_BASE_URL}/v2/aggs/ticker/${symbol}/range/1/day/1900-01-01/2099-12-31`
    );
    url.searchParams.append("limit", limit.toString());
    url.searchParams.append("apiKey", MASSIVE_API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(
        `Polygon API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as any;

    if (!data.results) {
      return [];
    }

    return data.results
      .map((bar: any) => ({
        date: new Date(bar.t),
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: bar.v,
        vwap: bar.vw,
      }))
      .sort((a: Candle, b: Candle) => a.date.getTime() - b.date.getTime());
  } catch (error) {
    console.error(`Error fetching candles for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Fetch ticker details (market cap, employees, IPO date, etc.)
 */
export async function fetchTickerDetails(symbol: string): Promise<TickerDetails> {
  if (!MASSIVE_API_KEY) {
    throw new Error("MASSIVE_API_KEY not configured");
  }

  try {
    const url = new URL(`${POLYGON_BASE_URL}/v3/reference/tickers/${symbol}`);
    url.searchParams.append("apiKey", MASSIVE_API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = (await response.json()) as any;
    const ticker = data.results;

    return {
      symbol: ticker.ticker,
      name: ticker.name,
      market: ticker.market,
      exchange: ticker.primary_exchange,
      currency: ticker.currency_name,
      active: ticker.active,
      marketCap: ticker.market_cap || 0,
      description: ticker.description || "",
      website: ticker.homepage_url || "",
      employees: ticker.total_employees || 0,
      ipoDate: ticker.list_date || "",
      sharesOutstanding: ticker.weighted_shares_outstanding || 0,
      sectorCode: ticker.sic_code || "",
      sectorName: ticker.sic_description || "",
      phone: ticker.phone_number || "",
    };
  } catch (error) {
    console.error(`Error fetching ticker details for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Fetch news articles with sentiment for a ticker
 */
export async function fetchNewsForTicker(
  symbol: string,
  limit: number = 10
): Promise<NewsArticle[]> {
  if (!MASSIVE_API_KEY) {
    throw new Error("MASSIVE_API_KEY not configured");
  }

  try {
    const url = new URL(`${POLYGON_BASE_URL}/v2/reference/news`);
    url.searchParams.append("ticker", symbol);
    url.searchParams.append("limit", limit.toString());
    url.searchParams.append("sort", "published_utc");
    url.searchParams.append("apiKey", MASSIVE_API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = (await response.json()) as any;

    if (!data.results) {
      return [];
    }

    return data.results.map((article: any) => ({
      id: article.id,
      title: article.title,
      author: article.author || "",
      publishedAt: article.published_utc,
      url: article.article_url,
      description: article.description || "",
      keywords: article.keywords || [],
      relatedTickers: article.tickers || [],
      publisher: {
        name: article.publisher?.name || "",
        url: article.publisher?.homepage_url || "",
      },
      insights: (article.insights || []).map((insight: any) => ({
        ticker: insight.ticker,
        sentiment: insight.sentiment,
        reasoning: insight.sentiment_reasoning || "",
      })),
    }));
  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Fetch latest quarterly financial statements
 */
export async function fetchFinancials(
  symbol: string,
  type: "income" | "balance" | "cash" = "income"
): Promise<FinancialMetrics[]> {
  if (!MASSIVE_API_KEY) {
    throw new Error("MASSIVE_API_KEY not configured");
  }

  try {
    const endpoints: Record<string, string> = {
      income: "income_statements",
      balance: "balance_sheets",
      cash: "cash_flow_statements",
    };

    const url = new URL(
      `${POLYGON_BASE_URL}/vX/reference/financials/${endpoints[type]}`
    );
    url.searchParams.append("ticker", symbol);
    url.searchParams.append("limit", "4");
    url.searchParams.append("timeframe", "quarterly");
    url.searchParams.append("apiKey", MASSIVE_API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = (await response.json()) as any;

    if (!data.results) {
      return [];
    }

    return data.results.map((stmt: any) => {
      const revenue = stmt.revenue || 0;
      const grossProfit = stmt.gross_profit || 0;
      const operatingIncome = stmt.operating_income || 0;
      const netIncome = stmt.net_income || 0;
      const totalLiabilities = stmt.total_liabilities || 0;
      const totalEquity = stmt.total_equity || 0;

      return {
        revenue,
        grossProfit,
        operatingIncome,
        netIncome,
        earnings: {
          basic: stmt.basic_earnings_per_share || 0,
          diluted: stmt.diluted_earnings_per_share || 0,
        },
        shares: {
          basic: stmt.basic_shares_outstanding || 0,
          diluted: stmt.diluted_shares_outstanding || 0,
        },
        margins: {
          gross: revenue ? (grossProfit / revenue) * 100 : 0,
          operating: revenue ? (operatingIncome / revenue) * 100 : 0,
          net: revenue ? (netIncome / revenue) * 100 : 0,
        },
        balanceSheet: {
          totalAssets: stmt.total_assets || 0,
          totalLiabilities,
          totalEquity,
          cashAndEquivalents: stmt.cash_and_equivalents || 0,
          receivables: stmt.receivables || 0,
          inventories: stmt.inventories || 0,
          accountsPayable: stmt.accounts_payable || 0,
          longTermDebt:
            stmt.long_term_debt_and_capital_lease_obligations || 0,
        },
        cashFlow: {
          operatingActivities:
            stmt.net_cash_from_operating_activities || 0,
          investingActivities:
            stmt.net_cash_from_investing_activities || 0,
          financingActivities:
            stmt.net_cash_from_financing_activities || 0,
          changeInCash: stmt.change_in_cash_and_equivalents || 0,
          dividends: Math.abs(stmt.dividends || 0),
          freeCashFlow:
            (stmt.net_cash_from_operating_activities || 0) -
            (stmt.capital_expenditures || 0),
        },
        debtToEquity: totalEquity ? totalLiabilities / totalEquity : 0,
        period: {
          endDate: stmt.period_end || "",
          fiscalYear: stmt.fiscal_year || 0,
          fiscalQuarter: stmt.fiscal_quarter || 0,
          filingDate: stmt.filing_date || "",
        },
      };
    });
  } catch (error) {
    console.error(`Error fetching financials for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Fetch options contracts near the money
 */
export async function fetchOptionsContracts(
  symbol: string,
  expirationDate?: string,
  limit: number = 10
): Promise<OptionContract[]> {
  if (!MASSIVE_API_KEY) {
    throw new Error("MASSIVE_API_KEY not configured");
  }

  try {
    const url = new URL(
      `${POLYGON_BASE_URL}/v3/reference/options/contracts`
    );
    url.searchParams.append("underlying_ticker", symbol);
    url.searchParams.append("limit", limit.toString());
    url.searchParams.append("sort", "strike_price");
    if (expirationDate) {
      url.searchParams.append("expiration_date", expirationDate);
    }
    url.searchParams.append("apiKey", MASSIVE_API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = (await response.json()) as any;

    if (!data.results) {
      return [];
    }

    return data.results.map((contract: any) => ({
      ticker: contract.ticker,
      underlyingTicker: contract.underlying_ticker,
      strikePrice: contract.strike_price,
      expirationDate: contract.expiration_date,
      contractType: contract.contract_type,
      premium: 0,
      totalContractCost: 0,
      volume: 0,
    }));
  } catch (error) {
    console.error(`Error fetching options for ${symbol}:`, error);
    return [];
  }
}

/**
 * Batch fetch candles for multiple symbols with concurrency control
 */
export async function fetchCandlesForSymbols(
  symbols: string[],
  limit: number = 252
): Promise<Map<string, Candle[]>> {
  const results = new Map<string, Candle[]>();
  const concurrency = 5;

  for (let i = 0; i < symbols.length; i += concurrency) {
    const batch = symbols.slice(i, i + concurrency);
    const promises = batch.map(async (symbol) => {
      try {
        const candles = await fetchDailyCandlesFromMassive(symbol, limit);
        results.set(symbol, candles);
      } catch (error) {
        console.error(`Failed to fetch ${symbol}:`, error);
      }
    });

    await Promise.all(promises);

    if (i + concurrency < symbols.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
