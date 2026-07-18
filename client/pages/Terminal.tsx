import { Delta, LiveDot, Panel, Sparkline, StatTile } from "@/components/meridian/Primitives";
import { ChartKind, Overlays, PriceChart } from "@/components/terminal/PriceChart";
import { useMarket } from "@/context/MarketContext";
import {
  bySymbol,
  ema,
  fmtCompact,
  fmtPrice,
  getAllQuotes,
  getQuote,
  getSeries,
  macd,
  NEWS,
  rsi,
  subscribeTicks,
  Timeframe,
} from "@/lib/market";
import { cn } from "@/lib/utils";
import { AreaChart, CandlestickChart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const TF_LIST: Timeframe[] = ["1D", "1W", "1M", "3M", "1Y", "5Y"];

const IND_TOGGLES: { key: keyof Overlays; label: string }[] = [
  { key: "ema20", label: "EMA 20" },
  { key: "ema50", label: "EMA 50" },
  { key: "bb", label: "BBANDS" },
  { key: "volume", label: "VOL" },
  { key: "rsi", label: "RSI" },
  { key: "macd", label: "MACD" },
];

export default function Terminal() {
  const { activeSymbol, setActiveSymbol } = useMarket();
  const [tf, setTf] = useState<Timeframe>("3M");
  const [kind, setKind] = useState<ChartKind>("candles");
  const [overlays, setOverlays] = useState<Overlays>({
    ema20: true,
    ema50: true,
    bb: false,
    volume: true,
    rsi: true,
    macd: false,
  });

  const meta = bySymbol(activeSymbol);
  const quote = useMemo(() => getQuote(activeSymbol), [activeSymbol]);

  // Live header price
  const [livePrice, setLivePrice] = useState(quote.price);
  useEffect(() => {
    setLivePrice(quote.price);
    return subscribeTicks(activeSymbol, (t) => setLivePrice(t.price));
  }, [activeSymbol, quote.price]);
  const liveChangePct = ((livePrice - quote.prevClose) / quote.prevClose) * 100;

  return (
    <div className="space-y-4">
      {/* ---- Symbol masthead ---- */}
      <div className="glass rounded-xl px-5 py-4 flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {meta.symbol}
            </h1>
            <span className="text-[10px] font-mono-data px-1.5 py-0.5 rounded border border-border text-muted-foreground">
              {meta.exchange}
            </span>
            <span className="text-[10px] font-mono-data px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/25">
              {meta.sector.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate">{meta.name}</p>
        </div>
        <div className="flex items-end gap-3">
          <span
            className={cn(
              "font-mono-data text-3xl font-bold tabular transition-colors",
              liveChangePct >= 0 ? "text-up" : "text-down",
            )}
          >
            {fmtPrice(livePrice)}
          </span>
          <div className="pb-1 flex items-center gap-2">
            <Delta value={liveChangePct} />
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono-data text-muted-foreground">
              <LiveDot /> LIVE
            </span>
          </div>
        </div>
        <div className="ml-auto grid grid-cols-3 sm:grid-cols-6 gap-x-8 gap-y-2">
          <StatTile label="Open" value={fmtPrice(quote.open)} />
          <StatTile label="Day High" value={fmtPrice(quote.high)} />
          <StatTile label="Day Low" value={fmtPrice(quote.low)} />
          <StatTile label="Volume" value={fmtCompact(quote.volume)} />
          <StatTile label="Mkt Cap" value={`$${fmtCompact(meta.marketCap)}`} />
          <StatTile label="P/E" value={meta.pe.toFixed(1)} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* ---- Chart workspace ---- */}
        <Panel className="xl:col-span-3" bodyClassName="px-2 pb-2">
          <div className="flex flex-wrap items-center gap-2 px-2 pt-3 pb-2">
            <div className="flex items-center rounded-lg border border-border/70 bg-surface-2/60 p-0.5">
              {TF_LIST.map((t) => (
                <button
                  key={t}
                  onClick={() => setTf(t)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-mono-data font-medium transition-colors",
                    tf === t
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center rounded-lg border border-border/70 bg-surface-2/60 p-0.5">
              <button
                onClick={() => setKind("candles")}
                aria-label="Candlestick chart"
                className={cn(
                  "px-2 py-1 rounded-md",
                  kind === "candles" ? "bg-primary/15 text-primary" : "text-muted-foreground",
                )}
              >
                <CandlestickChart className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setKind("area")}
                aria-label="Area chart"
                className={cn(
                  "px-2 py-1 rounded-md",
                  kind === "area" ? "bg-primary/15 text-primary" : "text-muted-foreground",
                )}
              >
                <AreaChart className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {IND_TOGGLES.map((ind) => (
                <button
                  key={ind.key}
                  onClick={() =>
                    setOverlays((o) => ({ ...o, [ind.key]: !o[ind.key] }))
                  }
                  className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-mono-data border transition-colors",
                    overlays[ind.key]
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/70 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {ind.label}
                </button>
              ))}
            </div>
            <span className="ml-auto hidden lg:inline text-[10px] font-mono-data text-muted-foreground pr-2">
              {meta.symbol} · {tf}
            </span>
          </div>
          <PriceChart
            symbol={activeSymbol}
            timeframe={tf}
            kind={kind}
            overlays={overlays}
            className="h-[380px] sm:h-[460px] xl:h-[520px]"
          />
        </Panel>

        {/* ---- Right stack ---- */}
        <div className="space-y-4">
          <WatchlistMini active={activeSymbol} onSelect={setActiveSymbol} />
          <OrderBook symbol={activeSymbol} price={livePrice} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TechnicalSummary symbol={activeSymbol} />
        <KeyLevels symbol={activeSymbol} price={livePrice} />
        <SymbolNews symbol={activeSymbol} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function WatchlistMini({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (s: string) => void;
}) {
  const quotes = useMemo(getAllQuotes, []);
  return (
    <Panel title="Watchlist" subtitle="Primary universe" bodyClassName="px-1.5 pb-2">
      <div className="max-h-[300px] overflow-y-auto pr-0.5">
        {quotes.map((q) => (
          <button
            key={q.symbol}
            onClick={() => onSelect(q.symbol)}
            className={cn(
              "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors",
              q.symbol === active
                ? "bg-primary/10 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.25)]"
                : "hover:bg-accent/50",
            )}
          >
            <div className="w-14">
              <div className="font-mono-data text-[12px] font-semibold">{q.symbol}</div>
            </div>
            <Sparkline data={q.spark} width={64} height={22} className="shrink-0" />
            <div className="ml-auto text-right">
              <div className="font-mono-data text-[12px]">{fmtPrice(q.price)}</div>
              <Delta value={q.changePct} bare className="text-[10px]" />
            </div>
          </button>
        ))}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */

interface BookRow {
  price: number;
  size: number;
}

function OrderBook({ symbol, price }: { symbol: string; price: number }) {
  const [book, setBook] = useState<{ bids: BookRow[]; asks: BookRow[] }>({
    bids: [],
    asks: [],
  });

  useEffect(() => {
    const gen = () => {
      const tickSize = Math.max(0.01, price * 0.0004);
      const mk = (side: 1 | -1): BookRow[] =>
        Array.from({ length: 7 }, (_, i) => ({
          price: price + side * tickSize * (i + 1),
          size: Math.round(200 + Math.random() * 4800 * Math.exp(-i * 0.18)),
        }));
      setBook({ bids: mk(-1), asks: mk(1) });
    };
    gen();
    const id = setInterval(gen, 1400);
    return () => clearInterval(id);
  }, [symbol, price]);

  const maxSize = Math.max(
    1,
    ...book.bids.map((r) => r.size),
    ...book.asks.map((r) => r.size),
  );

  return (
    <Panel title="Depth" subtitle="Level II · simulated" bodyClassName="px-3 pb-3">
      <div className="font-mono-data text-[11px] space-y-px">
        {[...book.asks].reverse().map((r, i) => (
          <div key={`a${i}`} className="relative flex justify-between px-1.5 py-[3px] rounded">
            <div
              className="absolute inset-y-0 right-0 bg-down/10 rounded"
              style={{ width: `${(r.size / maxSize) * 100}%` }}
            />
            <span className="relative text-down">{fmtPrice(r.price)}</span>
            <span className="relative text-muted-foreground">{r.size.toLocaleString()}</span>
          </div>
        ))}
        <div className="flex items-center justify-center gap-2 py-1.5 my-0.5 border-y border-border/60">
          <span className="text-[13px] font-semibold">{fmtPrice(price)}</span>
          <span className="text-[9px] text-muted-foreground uppercase tracking-widest">spread</span>
        </div>
        {book.bids.map((r, i) => (
          <div key={`b${i}`} className="relative flex justify-between px-1.5 py-[3px] rounded">
            <div
              className="absolute inset-y-0 right-0 bg-up/10 rounded"
              style={{ width: `${(r.size / maxSize) * 100}%` }}
            />
            <span className="relative text-up">{fmtPrice(r.price)}</span>
            <span className="relative text-muted-foreground">{r.size.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */

function TechnicalSummary({ symbol }: { symbol: string }) {
  const { score, signals } = useMemo(() => {
    const candles = getSeries(symbol, "1Y");
    const closes = candles.map((c) => c.close);
    const last = closes[closes.length - 1];
    const r = rsi(closes, 14).at(-1) ?? 50;
    const m = macd(closes);
    const hist = m.hist.at(-1) ?? 0;
    const e20 = ema(closes, 20).at(-1) ?? last;
    const e50 = ema(closes, 50).at(-1) ?? last;
    const e200 = ema(closes, 200).at(-1) ?? last;

    const signals: { name: string; value: string; vote: -1 | 0 | 1 }[] = [
      {
        name: "RSI (14)",
        value: r.toFixed(1),
        vote: r > 60 ? 1 : r < 40 ? -1 : 0,
      },
      {
        name: "MACD (12,26,9)",
        value: hist >= 0 ? "Bullish cross" : "Bearish cross",
        vote: hist >= 0 ? 1 : -1,
      },
      {
        name: "Price vs EMA20",
        value: last >= e20 ? "Above" : "Below",
        vote: last >= e20 ? 1 : -1,
      },
      {
        name: "Price vs EMA50",
        value: last >= e50 ? "Above" : "Below",
        vote: last >= e50 ? 1 : -1,
      },
      {
        name: "Price vs EMA200",
        value: last >= e200 ? "Above" : "Below",
        vote: last >= e200 ? 1 : -1,
      },
    ];
    const score =
      signals.reduce((a, s) => a + s.vote, 0) / signals.length; // -1..1
    return { score, signals };
  }, [symbol]);

  const verdict =
    score > 0.5 ? "STRONG BUY" : score > 0.1 ? "BUY" : score < -0.5 ? "STRONG SELL" : score < -0.1 ? "SELL" : "NEUTRAL";
  const angle = -90 + ((score + 1) / 2) * 180;

  return (
    <Panel title="Technical Summary" subtitle="Composite of 5 signals · 1Y daily">
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 120 70" className="w-36 shrink-0" role="img" aria-label={`Technical gauge: ${verdict}`}>
          <path d="M10 62 A 50 50 0 0 1 43 15" fill="none" stroke="hsl(var(--down)/0.55)" strokeWidth="7" strokeLinecap="round" />
          <path d="M48 13 A 50 50 0 0 1 72 13" fill="none" stroke="hsl(var(--flat)/0.45)" strokeWidth="7" strokeLinecap="round" />
          <path d="M77 15 A 50 50 0 0 1 110 62" fill="none" stroke="hsl(var(--up)/0.55)" strokeWidth="7" strokeLinecap="round" />
          <g transform={`rotate(${angle} 60 62)`} style={{ transition: "transform 0.8s cubic-bezier(0.16,1,0.3,1)" }}>
            <line x1="60" y1="62" x2="60" y2="22" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
          </g>
          <circle cx="60" cy="62" r="4" fill="hsl(var(--foreground))" />
        </svg>
        <div>
          <div
            className={cn(
              "font-display text-xl font-bold tracking-wide",
              score > 0.1 ? "text-up" : score < -0.1 ? "text-down" : "text-muted-foreground",
            )}
          >
            {verdict}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {signals.filter((s) => s.vote > 0).length} bullish ·{" "}
            {signals.filter((s) => s.vote === 0).length} neutral ·{" "}
            {signals.filter((s) => s.vote < 0).length} bearish
          </p>
        </div>
      </div>
      <ul className="mt-3 space-y-1.5">
        {signals.map((s) => (
          <li key={s.name} className="flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">{s.name}</span>
            <span
              className={cn(
                "font-mono-data",
                s.vote > 0 && "text-up",
                s.vote < 0 && "text-down",
              )}
            >
              {s.value}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */

function KeyLevels({ symbol, price }: { symbol: string; price: number }) {
  const levels = useMemo(() => {
    const yr = getSeries(symbol, "1Y");
    const highs = yr.map((c) => c.high);
    const lows = yr.map((c) => c.low);
    const hi52 = Math.max(...highs);
    const lo52 = Math.min(...lows);
    const recent = yr.slice(-40);
    const r1 = Math.max(...recent.map((c) => c.high));
    const s1 = Math.min(...recent.map((c) => c.low));
    const pivot = (r1 + s1 + yr[yr.length - 1].close) / 3;
    return { hi52, lo52, r1, s1, pivot };
  }, [symbol]);

  const pct = Math.min(
    100,
    Math.max(0, ((price - levels.lo52) / (levels.hi52 - levels.lo52)) * 100),
  );

  const rows = [
    { name: "52W High", v: levels.hi52, tone: "text-down" },
    { name: "Resistance (R1)", v: levels.r1, tone: "text-down" },
    { name: "Pivot", v: levels.pivot, tone: "text-muted-foreground" },
    { name: "Support (S1)", v: levels.s1, tone: "text-up" },
    { name: "52W Low", v: levels.lo52, tone: "text-up" },
  ];

  return (
    <Panel title="Key Levels" subtitle="Derived from 1Y daily swings">
      <div className="mb-4">
        <div className="flex justify-between text-[10px] font-mono-data text-muted-foreground mb-1.5">
          <span>{fmtPrice(levels.lo52)}</span>
          <span>52-WEEK RANGE</span>
          <span>{fmtPrice(levels.hi52)}</span>
        </div>
        <div className="relative h-2 rounded-full bg-surface-3 overflow-visible">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/40 to-primary"
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute -top-1 h-4 w-1 rounded-full bg-foreground shadow-[0_0_8px_hsl(var(--primary))]"
            style={{ left: `calc(${pct}% - 2px)` }}
          />
        </div>
      </div>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">{r.name}</span>
            <span className={cn("font-mono-data font-medium", r.tone)}>
              {fmtPrice(r.v)}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */

function SymbolNews({ symbol }: { symbol: string }) {
  const items = useMemo(() => {
    const tagged = NEWS.filter((n) => n.symbols.includes(symbol));
    return (tagged.length ? tagged : NEWS).slice(0, 4);
  }, [symbol]);

  return (
    <Panel title="Tape" subtitle={`Headlines · ${symbol}`}>
      <ul className="space-y-3">
        {items.map((n) => (
          <li key={n.id} className="group">
            <div className="flex items-start gap-2">
              <span
                className={cn(
                  "mt-1.5 h-1.5 w-1.5 rounded-full shrink-0",
                  n.sentiment > 0.2 ? "bg-up" : n.sentiment < -0.2 ? "bg-down" : "bg-flat",
                )}
              />
              <div className="min-w-0">
                <p className="text-[13px] leading-snug group-hover:text-primary transition-colors cursor-pointer">
                  {n.headline}
                </p>
                <p className="text-[10px] font-mono-data text-muted-foreground mt-0.5">
                  {n.source} · {n.minutesAgo}m ago ·{" "}
                  {n.impact.toUpperCase()} IMPACT
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
