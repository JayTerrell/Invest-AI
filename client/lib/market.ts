/**
 * Meridian synthetic market data engine.
 *
 * All series are deterministic per (symbol, timeframe) — seeded PRNG, no
 * network — so the UI is stable across reloads while still looking like a
 * real tape. A light tick simulator animates the last bar for "live" feel.
 */

export interface Candle {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SymbolMeta {
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  base: number; // anchor price
  vol: number; // daily volatility
  drift: number; // annual drift
  marketCap: number;
  pe: number;
  beta: number;
  divYield: number;
  eps: number;
}

export type Timeframe = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y";

/* ------------------------------------------------------------------ */
/* PRNG                                                               */
/* ------------------------------------------------------------------ */

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box–Muller normal from a uniform PRNG. */
function gaussian(rng: () => number) {
  const u = Math.max(rng(), 1e-9);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ------------------------------------------------------------------ */
/* Universe                                                           */
/* ------------------------------------------------------------------ */

export const UNIVERSE: SymbolMeta[] = [
  { symbol: "NVDA", name: "NVIDIA Corp", sector: "Technology", exchange: "NASDAQ", base: 172.4, vol: 0.031, drift: 0.42, marketCap: 4.21e12, pe: 52.3, beta: 1.74, divYield: 0.03, eps: 3.3 },
  { symbol: "MSFT", name: "Microsoft Corp", sector: "Technology", exchange: "NASDAQ", base: 511.2, vol: 0.016, drift: 0.21, marketCap: 3.8e12, pe: 36.9, beta: 0.92, divYield: 0.66, eps: 13.64 },
  { symbol: "AAPL", name: "Apple Inc", sector: "Technology", exchange: "NASDAQ", base: 228.6, vol: 0.017, drift: 0.12, marketCap: 3.42e12, pe: 34.5, beta: 1.11, divYield: 0.44, eps: 6.62 },
  { symbol: "AMZN", name: "Amazon.com Inc", sector: "Consumer Disc.", exchange: "NASDAQ", base: 224.1, vol: 0.021, drift: 0.18, marketCap: 2.35e12, pe: 36.1, beta: 1.19, divYield: 0, eps: 6.2 },
  { symbol: "GOOGL", name: "Alphabet Inc", sector: "Communication", exchange: "NASDAQ", base: 186.9, vol: 0.019, drift: 0.16, marketCap: 2.28e12, pe: 21.4, beta: 1.03, divYield: 0.43, eps: 8.74 },
  { symbol: "META", name: "Meta Platforms", sector: "Communication", exchange: "NASDAQ", base: 719.4, vol: 0.023, drift: 0.24, marketCap: 1.82e12, pe: 28.6, beta: 1.22, divYield: 0.28, eps: 25.14 },
  { symbol: "TSLA", name: "Tesla Inc", sector: "Consumer Disc.", exchange: "NASDAQ", base: 318.7, vol: 0.041, drift: 0.1, marketCap: 1.02e12, pe: 182.4, beta: 2.29, divYield: 0, eps: 1.75 },
  { symbol: "AVGO", name: "Broadcom Inc", sector: "Technology", exchange: "NASDAQ", base: 276.3, vol: 0.026, drift: 0.3, marketCap: 1.3e12, pe: 41.2, beta: 1.16, divYield: 0.85, eps: 6.71 },
  { symbol: "JPM", name: "JPMorgan Chase", sector: "Financials", exchange: "NYSE", base: 289.5, vol: 0.014, drift: 0.13, marketCap: 8.05e11, pe: 14.1, beta: 1.05, divYield: 1.72, eps: 20.53 },
  { symbol: "V", name: "Visa Inc", sector: "Financials", exchange: "NYSE", base: 354.8, vol: 0.013, drift: 0.12, marketCap: 6.9e11, pe: 32.4, beta: 0.95, divYield: 0.67, eps: 10.95 },
  { symbol: "UNH", name: "UnitedHealth Group", sector: "Healthcare", exchange: "NYSE", base: 308.2, vol: 0.022, drift: -0.05, marketCap: 2.8e11, pe: 12.6, beta: 0.55, divYield: 2.75, eps: 24.46 },
  { symbol: "XOM", name: "Exxon Mobil", sector: "Energy", exchange: "NYSE", base: 114.9, vol: 0.016, drift: 0.05, marketCap: 4.9e11, pe: 14.5, beta: 0.88, divYield: 3.44, eps: 7.92 },
  { symbol: "LLY", name: "Eli Lilly & Co", sector: "Healthcare", exchange: "NYSE", base: 782.1, vol: 0.024, drift: 0.2, marketCap: 7.4e11, pe: 63.8, beta: 0.42, divYield: 0.77, eps: 12.26 },
  { symbol: "CAT", name: "Caterpillar Inc", sector: "Industrials", exchange: "NYSE", base: 412.6, vol: 0.018, drift: 0.11, marketCap: 1.98e11, pe: 19.3, beta: 1.12, divYield: 1.42, eps: 21.38 },
  { symbol: "COST", name: "Costco Wholesale", sector: "Consumer Staples", exchange: "NASDAQ", base: 962.3, vol: 0.014, drift: 0.15, marketCap: 4.27e11, pe: 54.2, beta: 0.79, divYield: 0.48, eps: 17.76 },
  { symbol: "AMD", name: "Advanced Micro Devices", sector: "Technology", exchange: "NASDAQ", base: 156.8, vol: 0.035, drift: 0.14, marketCap: 2.54e11, pe: 46.1, beta: 1.97, divYield: 0, eps: 3.4 },
];

export const bySymbol = (s: string): SymbolMeta =>
  UNIVERSE.find((u) => u.symbol === s) ?? UNIVERSE[0];

/* ------------------------------------------------------------------ */
/* Series generation                                                  */
/* ------------------------------------------------------------------ */

export const TIMEFRAMES: Record<
  Timeframe,
  { bars: number; stepSec: number; label: string }
> = {
  "1D": { bars: 156, stepSec: 150, label: "1 Day · 2.5m" },
  "1W": { bars: 130, stepSec: 1800, label: "1 Week · 30m" },
  "1M": { bars: 150, stepSec: 13000, label: "1 Month · 4h" },
  "3M": { bars: 66, stepSec: 86400, label: "3 Months · 1D" },
  "1Y": { bars: 252, stepSec: 86400, label: "1 Year · 1D" },
  "5Y": { bars: 260, stepSec: 604800, label: "5 Years · 1W" },
};

const seriesCache = new Map<string, Candle[]>();

/** Session anchor so every series ends at the same "now" per page load. */
const NOW = Math.floor(Date.now() / 1000 / 60) * 60;

export function getSeries(symbol: string, tf: Timeframe): Candle[] {
  const key = `${symbol}:${tf}`;
  const hit = seriesCache.get(key);
  if (hit) return hit;

  const meta = bySymbol(symbol);
  const { bars, stepSec } = TIMEFRAMES[tf];
  const rng = mulberry32(hashSeed(key));

  const dtYears = stepSec / (86400 * 252);
  const sigma = meta.vol * Math.sqrt(stepSec / 86400);

  // Walk backwards from the anchor price so the last close matches the quote.
  const closes: number[] = new Array(bars);
  closes[bars - 1] = meta.base;
  for (let i = bars - 2; i >= 0; i--) {
    const shock = gaussian(rng) * sigma;
    const trend = meta.drift * dtYears;
    // occasional regime kick for realistic swings
    const kick = rng() < 0.03 ? gaussian(rng) * sigma * 4 : 0;
    closes[i] = closes[i + 1] / Math.exp(trend + shock + kick);
  }

  const out: Candle[] = new Array(bars);
  for (let i = 0; i < bars; i++) {
    const close = closes[i];
    const open = i === 0 ? close * (1 + gaussian(rng) * sigma * 0.4) : closes[i - 1];
    const hi = Math.max(open, close) * (1 + Math.abs(gaussian(rng)) * sigma * 0.55);
    const lo = Math.min(open, close) * (1 - Math.abs(gaussian(rng)) * sigma * 0.55);
    const range = Math.abs(close - open) / (close * sigma + 1e-9);
    const volume = Math.round(
      (meta.marketCap / meta.base) * 0.004 * (0.5 + rng() + range * 0.6),
    );
    out[i] = {
      time: NOW - (bars - 1 - i) * stepSec,
      open: round2(open),
      high: round2(hi),
      low: round2(lo),
      close: round2(close),
      volume,
    };
  }
  seriesCache.set(key, out);
  return out;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ */
/* Quotes                                                             */
/* ------------------------------------------------------------------ */

export interface Quote {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
  spark: number[];
}

export function getQuote(symbol: string): Quote {
  const meta = bySymbol(symbol);
  const day = getSeries(symbol, "1D");
  const last = day[day.length - 1];
  const first = day[0];
  const prevClose = first.open;
  const change = last.close - prevClose;
  return {
    symbol: meta.symbol,
    name: meta.name,
    sector: meta.sector,
    price: last.close,
    change: round2(change),
    changePct: round2((change / prevClose) * 100 * 100) / 100,
    open: first.open,
    high: Math.max(...day.map((c) => c.high)),
    low: Math.min(...day.map((c) => c.low)),
    prevClose: round2(prevClose),
    volume: day.reduce((a, c) => a + c.volume, 0),
    spark: day.filter((_, i) => i % 6 === 0).map((c) => c.close),
  };
}

export const getAllQuotes = (): Quote[] =>
  UNIVERSE.map((u) => getQuote(u.symbol));

/* ------------------------------------------------------------------ */
/* Indicators                                                         */
/* ------------------------------------------------------------------ */

export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    prev = prev === null ? values[i] : values[i] * k + prev * (1 - k);
    if (i >= period - 1) out[i] = prev;
  }
  return out;
}

export function bollinger(values: number[], period = 20, mult = 2) {
  const mid = sma(values, period);
  const upper: (number | null)[] = new Array(values.length).fill(null);
  const lower: (number | null)[] = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    const m = mid[i]!;
    let acc = 0;
    for (let j = i - period + 1; j <= i; j++) acc += (values[j] - m) ** 2;
    const sd = Math.sqrt(acc / period);
    upper[i] = m + mult * sd;
    lower[i] = m - mult * sd;
  }
  return { mid, upper, lower };
}

export function rsi(values: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    const gain = Math.max(d, 0);
    const loss = Math.max(-d, 0);
    if (i <= period) {
      avgGain += gain / period;
      avgLoss += loss / period;
      if (i === period) out[i] = 100 - 100 / (1 + avgGain / (avgLoss || 1e-9));
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      out[i] = 100 - 100 / (1 + avgGain / (avgLoss || 1e-9));
    }
  }
  return out;
}

export function macd(values: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const line = values.map((_, i) =>
    emaFast[i] !== null && emaSlow[i] !== null
      ? emaFast[i]! - emaSlow[i]!
      : null,
  );
  const firstIdx = line.findIndex((v) => v !== null);
  const sigTail = ema(line.slice(firstIdx) as number[], signal);
  const sig: (number | null)[] = new Array(values.length).fill(null);
  for (let i = 0; i < sigTail.length; i++) sig[firstIdx + i] = sigTail[i];
  const hist = line.map((v, i) =>
    v !== null && sig[i] !== null ? v - sig[i]! : null,
  );
  return { line, signal: sig, hist };
}

/* ------------------------------------------------------------------ */
/* Live tick simulation                                               */
/* ------------------------------------------------------------------ */

export interface Tick {
  price: number;
  time: number;
  volume: number;
}

/** Simulated tick stream nudging off the last close. Returns unsubscribe. */
export function subscribeTicks(
  symbol: string,
  onTick: (t: Tick) => void,
  intervalMs = 900,
): () => void {
  const meta = bySymbol(symbol);
  let price = getQuote(symbol).price;
  const rng = mulberry32(hashSeed(symbol + ":live") ^ (Date.now() & 0xffff));
  const id = window.setInterval(() => {
    price = Math.max(
      0.01,
      price * (1 + gaussian(rng) * meta.vol * 0.02),
    );
    onTick({
      price: round2(price),
      time: Math.floor(Date.now() / 1000),
      volume: Math.round(1000 + rng() * 40000),
    });
  }, intervalMs);
  return () => window.clearInterval(id);
}

/* ------------------------------------------------------------------ */
/* Sector intelligence                                                */
/* ------------------------------------------------------------------ */

export interface SectorStat {
  name: string;
  changePct: number;
  ytdPct: number;
  marketCap: number;
  momentum: number; // -1..1
  strength: number; // -1..1 relative strength
  breadth: number; // % of members advancing
}

export const SECTORS: SectorStat[] = [
  { name: "Technology", changePct: 1.84, ytdPct: 22.4, marketCap: 16.2e12, momentum: 0.72, strength: 0.65, breadth: 71 },
  { name: "Communication", changePct: 1.12, ytdPct: 14.8, marketCap: 5.1e12, momentum: 0.44, strength: 0.38, breadth: 63 },
  { name: "Financials", changePct: 0.58, ytdPct: 11.2, marketCap: 7.4e12, momentum: 0.31, strength: 0.12, breadth: 58 },
  { name: "Consumer Disc.", changePct: 0.35, ytdPct: 6.9, marketCap: 5.6e12, momentum: 0.18, strength: -0.08, breadth: 52 },
  { name: "Industrials", changePct: 0.22, ytdPct: 9.4, marketCap: 4.2e12, momentum: 0.12, strength: 0.05, breadth: 54 },
  { name: "Healthcare", changePct: -0.41, ytdPct: -2.6, marketCap: 5.9e12, momentum: -0.35, strength: -0.42, breadth: 41 },
  { name: "Consumer Staples", changePct: -0.18, ytdPct: 3.1, marketCap: 3.1e12, momentum: -0.1, strength: -0.22, breadth: 47 },
  { name: "Energy", changePct: -0.86, ytdPct: 1.8, marketCap: 2.4e12, momentum: -0.48, strength: -0.31, breadth: 38 },
  { name: "Utilities", changePct: 0.44, ytdPct: 12.6, marketCap: 1.4e12, momentum: 0.26, strength: 0.3, breadth: 61 },
  { name: "Real Estate", changePct: -0.29, ytdPct: -1.2, marketCap: 1.2e12, momentum: -0.2, strength: -0.36, breadth: 43 },
  { name: "Materials", changePct: 0.15, ytdPct: 4.4, marketCap: 1.6e12, momentum: 0.02, strength: -0.12, breadth: 50 },
];

/* ------------------------------------------------------------------ */
/* News & sentiment                                                   */
/* ------------------------------------------------------------------ */

export interface NewsItem {
  id: number;
  headline: string;
  source: string;
  minutesAgo: number;
  symbols: string[];
  sentiment: number; // -1..1
  impact: "high" | "medium" | "low";
  summary: string;
}

export const NEWS: NewsItem[] = [
  { id: 1, headline: "NVIDIA unveils next-gen Rubin architecture, cites 4x inference gains", source: "Meridian Wire", minutesAgo: 12, symbols: ["NVDA", "AMD"], sentiment: 0.82, impact: "high", summary: "Data-center roadmap accelerates with HBM4 adoption; hyperscaler capex commentary points to sustained order visibility into FY27." },
  { id: 2, headline: "Fed minutes signal patience on cuts as core inflation cools to 2.4%", source: "Macro Desk", minutesAgo: 34, symbols: ["JPM", "V"], sentiment: 0.35, impact: "high", summary: "Rates market now prices two cuts by year-end; financials bid on steepening curve expectations." },
  { id: 3, headline: "Microsoft expands Copilot enterprise seats 40% QoQ, raises Azure guide", source: "Meridian Wire", minutesAgo: 58, symbols: ["MSFT"], sentiment: 0.74, impact: "high", summary: "AI services revenue run-rate crosses $14B annualized; management flags GPU supply as the only constraint to faster growth." },
  { id: 4, headline: "UnitedHealth faces DOJ scrutiny over Medicare billing practices", source: "Regulatory Watch", minutesAgo: 87, symbols: ["UNH"], sentiment: -0.68, impact: "high", summary: "Civil investigative demands widen; analysts trim EPS estimates on potential remediation costs and enrollment friction." },
  { id: 5, headline: "Tesla begins Optimus pilot production; Street skeptical on 2026 volumes", source: "Industry Pulse", minutesAgo: 121, symbols: ["TSLA"], sentiment: 0.18, impact: "medium", summary: "Fremont line targeting 10k units; bulls see optionality, bears note automotive gross margin compression continues." },
  { id: 6, headline: "Crude slides 2.1% as OPEC+ signals supply normalization", source: "Macro Desk", minutesAgo: 145, symbols: ["XOM"], sentiment: -0.44, impact: "medium", summary: "Brent breaks below $78 support; energy sector relative strength weakest since March." },
  { id: 7, headline: "Eli Lilly oral GLP-1 clears Phase III with 14.7% weight reduction", source: "BioDesk", minutesAgo: 190, symbols: ["LLY"], sentiment: 0.79, impact: "high", summary: "Orforglipron data beats consensus; manufacturing scale-up already underway across three sites." },
  { id: 8, headline: "Broadcom lands third hyperscaler custom-silicon mandate", source: "Meridian Wire", minutesAgo: 240, symbols: ["AVGO", "NVDA"], sentiment: 0.61, impact: "medium", summary: "XPU pipeline now $90B through 2027; gross margin mix shifts favorably as networking attach rates climb." },
  { id: 9, headline: "Visa volume growth decelerates in Europe; cross-border still +12%", source: "Financial Ledger", minutesAgo: 320, symbols: ["V"], sentiment: -0.21, impact: "low", summary: "FX headwinds mask underlying resilience; management reiterates full-year outlook." },
  { id: 10, headline: "Costco September comps +7.4%, e-commerce +21% on grocery strength", source: "Retail Monitor", minutesAgo: 410, symbols: ["COST"], sentiment: 0.52, impact: "low", summary: "Membership renewal rate hits record 93.3% worldwide; executive team flags no tariff-driven price actions yet." },
  { id: 11, headline: "Caterpillar backlog swells on data-center power generation demand", source: "Industry Pulse", minutesAgo: 480, symbols: ["CAT"], sentiment: 0.57, impact: "medium", summary: "Energy & Transportation segment orders +28% YoY; reciprocating engine capacity sold out through mid-2027." },
  { id: 12, headline: "Apple Vision line refresh delayed to H2 as focus shifts to AI wearables", source: "Meridian Wire", minutesAgo: 560, symbols: ["AAPL"], sentiment: -0.15, impact: "low", summary: "Supply chain checks point to camera-equipped AirPods entering EVT; Vision Pro 2 pushed a quarter." },
];

/* ------------------------------------------------------------------ */
/* Financial statements                                               */
/* ------------------------------------------------------------------ */

export interface FinPeriod {
  period: string;
  revenue: number;
  grossProfit: number;
  opIncome: number;
  netIncome: number;
  fcf: number;
  grossMargin: number;
  opMargin: number;
  netMargin: number;
}

export function getFinancials(symbol: string): FinPeriod[] {
  const meta = bySymbol(symbol);
  const rng = mulberry32(hashSeed(symbol + ":fin"));
  const baseRev = meta.marketCap / (6 + rng() * 6) / 1e9; // $B annual-ish
  const gm = 0.38 + rng() * 0.4;
  const om = gm * (0.45 + rng() * 0.3);
  const nm = om * (0.72 + rng() * 0.2);
  const growth = 0.04 + Math.max(meta.drift, 0) * 0.45;
  const periods = ["FY22", "FY23", "FY24", "FY25 TTM"];
  return periods.map((period, i) => {
    const wobble = 1 + gaussian(rng) * 0.02;
    const revenue = baseRev * Math.pow(1 + growth, i) * wobble;
    const gmi = Math.min(0.92, gm + i * 0.008);
    const omi = Math.min(gmi - 0.05, om + i * 0.01);
    const nmi = Math.min(omi - 0.02, nm + i * 0.009);
    return {
      period,
      revenue,
      grossProfit: revenue * gmi,
      opIncome: revenue * omi,
      netIncome: revenue * nmi,
      fcf: revenue * nmi * (0.85 + rng() * 0.35),
      grossMargin: gmi * 100,
      opMargin: omi * 100,
      netMargin: nmi * 100,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Executives                                                         */
/* ------------------------------------------------------------------ */

export interface ExecProfile {
  symbol: string;
  name: string;
  title: string;
  tenureYears: number;
  totalReturnPct: number; // stock return under tenure
  capitalScore: number; // 0-100 capital allocation
  executionScore: number; // 0-100
  alignmentScore: number; // 0-100 insider ownership/comp alignment
  insiderOwnPct: number;
  note: string;
}

export const EXECUTIVES: ExecProfile[] = [
  { symbol: "NVDA", name: "Jensen Huang", title: "Founder & CEO", tenureYears: 32, totalReturnPct: 312400, capitalScore: 96, executionScore: 98, alignmentScore: 94, insiderOwnPct: 3.5, note: "Founder-led; near-perfect platform-transition record from graphics to accelerated computing to AI." },
  { symbol: "MSFT", name: "Satya Nadella", title: "Chairman & CEO", tenureYears: 12, totalReturnPct: 1240, capitalScore: 91, executionScore: 93, alignmentScore: 78, insiderOwnPct: 0.01, note: "Cloud pivot architect; disciplined M&A (LinkedIn, GitHub, Activision) with strong integration outcomes." },
  { symbol: "AAPL", name: "Tim Cook", title: "CEO", tenureYears: 15, totalReturnPct: 1580, capitalScore: 88, executionScore: 85, alignmentScore: 72, insiderOwnPct: 0.02, note: "Operational master; record buyback program, though product-cycle innovation cadence has slowed." },
  { symbol: "AMZN", name: "Andy Jassy", title: "President & CEO", tenureYears: 5, totalReturnPct: 34, capitalScore: 79, executionScore: 82, alignmentScore: 70, insiderOwnPct: 0.09, note: "AWS builder; cost-discipline era restored margins, retail reacceleration remains the open question." },
  { symbol: "TSLA", name: "Elon Musk", title: "CEO", tenureYears: 18, totalReturnPct: 21400, capitalScore: 71, executionScore: 74, alignmentScore: 88, insiderOwnPct: 13, note: "Category creator with volatile execution; attention split across ventures is the persistent governance discount." },
  { symbol: "JPM", name: "Jamie Dimon", title: "Chairman & CEO", tenureYears: 20, totalReturnPct: 690, capitalScore: 93, executionScore: 91, alignmentScore: 81, insiderOwnPct: 0.4, note: "Fortress balance sheet doctrine; best-in-class through-cycle returns among money-center banks." },
];

/* ------------------------------------------------------------------ */
/* Formatting                                                         */
/* ------------------------------------------------------------------ */

export const fmtPrice = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtSigned = (n: number, digits = 2) =>
  `${n >= 0 ? "+" : ""}${n.toFixed(digits)}`;

export const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

export function fmtCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}
