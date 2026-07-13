import { Delta, LiveDot } from "@/components/meridian/Primitives";
import {
  Candle,
  fmtPrice,
  getAllQuotes,
  getQuote,
  getSeries,
} from "@/lib/market";
import { cn } from "@/lib/utils";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CandlestickChart,
  ChevronDown,
  Gauge,
  Hexagon,
  Newspaper,
  Radar,
  Zap,
} from "lucide-react";
import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { ScrollVideo } from "@/components/landing/ScrollVideo";

// Self-hosted copy wins when present (drop the file in /public); the CDN copy
// (Higgsfield generation, owned by this account) covers deploys until then.
const LOCAL_VIDEO = "/landing-bg.mp4";
const CDN_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3G6z0bPOaII31htnciAMzy7iYOx/hf_20260713_191213_5352c7ba-2f1c-45d3-947a-2b6cbd7d24ec.mp4";

export default function Landing() {
  const pageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  // The video playhead reads RAW scroll progress (monotonic) so it never
  // jitters. The parallax push-in is decorative, so it can ride a soft spring.
  const parallax = useSpring(scrollYProgress, { stiffness: 60, damping: 22 });
  const videoScale = useTransform(parallax, [0, 1], [1.06, 1.18]);
  const videoY = useTransform(parallax, [0, 1], ["0%", "-4%"]);

  return (
    <div ref={pageRef} className="relative bg-background text-foreground">
      {/* scroll-scrubbed cinematic video pinned behind everything */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {/* ambient fallback while the video loads (or if no source resolves) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 70% at 50% 80%, hsl(187 60% 18% / 0.5), transparent 60%), radial-gradient(70% 55% at 70% 20%, hsl(258 45% 20% / 0.4), transparent 65%), hsl(228 36% 5%)",
          }}
        />
        <motion.div
          style={reducedMotion ? undefined : { scale: videoScale, y: videoY }}
          className="absolute inset-0"
        >
          <ScrollVideo
            scroll={scrollYProgress}
            sources={[LOCAL_VIDEO, CDN_VIDEO]}
            active={!reducedMotion}
          />
        </motion.div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(228_36%_5%/0.55)_70%,hsl(228_36%_5%)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background/80" />
      </div>

      <TopNav />

      <main className="relative z-10">
        <Hero />
        <TerminalShowcase reducedMotion={!!reducedMotion} />
        <Features />
        <StatsBand />
        <ClosingCta />
        <Footer />
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TopNav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-4">
        <div className="glass-bright rounded-2xl h-14 px-4 sm:px-5 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary glow-primary">
              <Hexagon className="h-[18px] w-[18px]" strokeWidth={2.2} />
            </span>
            <span className="font-display font-bold tracking-wide text-[15px]">
              MERIDIAN
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 ml-6 text-[13px] text-muted-foreground">
            <a href="#platform" className="hover:text-foreground transition-colors">Platform</a>
            <a href="#features" className="hover:text-foreground transition-colors">Capabilities</a>
            <a href="#coverage" className="hover:text-foreground transition-colors">Coverage</a>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-2 text-[11px] font-mono-data text-muted-foreground">
              <LiveDot /> LIVE FEED
            </span>
            <Link
              to="/terminal"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:brightness-110 transition-all glow-primary"
            >
              Launch Terminal
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */

function Hero() {
  const quotes = useMemo(() => getAllQuotes().slice(0, 4), []);
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-28 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-4xl"
      >
        <p className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-mono-data uppercase tracking-[0.3em] text-primary mb-6 px-3 py-1.5 rounded-full border border-primary/25 bg-primary/5">
          <Zap className="h-3 w-3" />
          Institutional-grade research terminal
        </p>
        <h1 className="font-display text-[10.5vw] sm:text-7xl lg:text-[86px] font-bold leading-[1.02] sm:leading-[0.98] tracking-tight">
          <span className="text-gradient">Research at the</span>
          <br />
          <span className="text-gradient">speed of markets.</span>
        </h1>
        <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Meridian fuses professional charting, deep fundamentals, sector
          intelligence and real-time sentiment into one precision instrument —
          built for the desks that move first.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/terminal"
            className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all glow-primary"
          >
            <CandlestickChart className="h-[18px] w-[18px]" />
            Open the Terminal
          </Link>
          <a
            href="#platform"
            className="inline-flex items-center gap-2 h-12 px-7 rounded-xl border border-border/80 glass text-foreground/90 font-medium hover:border-primary/40 transition-colors"
          >
            Explore the platform
          </a>
        </div>
      </motion.div>

      {/* live strip */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="mt-14 w-full max-w-3xl glass rounded-2xl px-2 py-2 grid grid-cols-2 sm:grid-cols-4 gap-1"
      >
        {quotes.map((q) => (
          <Link
            key={q.symbol}
            to="/terminal"
            className="rounded-xl px-3 py-2.5 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono-data text-[12px] font-semibold">{q.symbol}</span>
              <Delta value={q.changePct} bare className="text-[10px]" />
            </div>
            <div className="font-mono-data text-sm mt-0.5">{fmtPrice(q.price)}</div>
          </Link>
        ))}
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        className="mt-16 text-muted-foreground"
        aria-hidden
      >
        <ChevronDown className="h-5 w-5" />
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

/** Static candlestick preview rendered from the real data engine. */
function CandlePreview({ candles }: { candles: Candle[] }) {
  const w = 720;
  const h = 260;
  const min = Math.min(...candles.map((c) => c.low));
  const max = Math.max(...candles.map((c) => c.high));
  const span = max - min || 1;
  const y = (v: number) => 8 + (1 - (v - min) / span) * (h - 16);
  const bw = w / candles.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" aria-hidden>
      {[0.25, 0.5, 0.75].map((g) => (
        <line
          key={g}
          x1="0"
          x2={w}
          y1={h * g}
          y2={h * g}
          stroke="hsl(224 40% 40% / 0.12)"
          strokeWidth="1"
        />
      ))}
      {candles.map((c, i) => {
        const up = c.close >= c.open;
        const color = up ? "hsl(160 84% 39%)" : "hsl(347 77% 55%)";
        const cx = i * bw + bw / 2;
        return (
          <g key={i}>
            <line x1={cx} x2={cx} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeOpacity="0.5" strokeWidth="1" />
            <rect
              x={cx - bw * 0.28}
              width={bw * 0.56}
              y={y(Math.max(c.open, c.close))}
              height={Math.max(2, Math.abs(y(c.open) - y(c.close)))}
              rx="1"
              fill={color}
            />
          </g>
        );
      })}
    </svg>
  );
}

function TerminalShowcase({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const rotateX = useTransform(scrollYProgress, [0, 0.45, 1], [24, 0, -8]);
  const scale = useTransform(scrollYProgress, [0, 0.45, 1], [0.92, 1, 0.97]);
  const yShift = useTransform(scrollYProgress, [0, 1], [60, -40]);

  const candles = useMemo(() => getSeries("NVDA", "3M"), []);
  const q = useMemo(() => getQuote("NVDA"), []);

  return (
    <section id="platform" ref={ref} className="relative px-4 sm:px-6 py-24 sm:py-36">
      <div className="mx-auto max-w-5xl text-center mb-12">
        <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight">
          One surface. <span className="text-primary">Total context.</span>
        </h2>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          Charting that answers to you — indicators, depth, levels and tape,
          composed on a workspace that feels engineered, not decorated.
        </p>
      </div>

      <div className="mx-auto max-w-5xl perspective-1200">
        <motion.div
          style={
            reducedMotion
              ? undefined
              : { rotateX, scale, y: yShift, transformStyle: "preserve-3d" }
          }
          className="glass-bright rounded-2xl overflow-hidden shadow-[0_60px_120px_-40px_hsl(228_60%_2%/0.9)]"
        >
          {/* chrome */}
          <div className="flex items-center gap-2 px-4 h-10 border-b border-border/60 bg-surface-1/70">
            <span className="h-2.5 w-2.5 rounded-full bg-down/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-chart-2/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-up/70" />
            <span className="ml-3 font-mono-data text-[11px] text-muted-foreground">
              meridian://terminal/NVDA
            </span>
            <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 font-mono-data text-[10px] text-muted-foreground">
              <LiveDot /> STREAMING
            </span>
          </div>
          {/* header strip */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 border-b border-border/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold">NVDA</span>
                <span className="text-[9px] font-mono-data px-1 py-0.5 rounded border border-primary/25 bg-primary/10 text-primary">
                  TECHNOLOGY
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">NVIDIA Corp</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("font-mono-data text-xl font-bold", q.changePct >= 0 ? "text-up" : "text-down")}>
                {fmtPrice(q.price)}
              </span>
              <Delta value={q.changePct} />
            </div>
            <div className="ml-auto hidden md:flex items-center gap-1.5">
              {["1D", "1W", "1M", "3M", "1Y"].map((t) => (
                <span
                  key={t}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-mono-data",
                    t === "3M" ? "bg-primary/15 text-primary" : "text-muted-foreground",
                  )}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="px-3 sm:px-5 py-4 bg-gradient-to-b from-transparent to-surface-1/40">
            <CandlePreview candles={candles} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: CandlestickChart,
    title: "Pro Charting Engine",
    body: "Candles, overlays, RSI & MACD panes on a GPU-accelerated canvas with crosshair-synced OHLC readout and live tick streaming.",
  },
  {
    icon: Gauge,
    title: "Composite Signals",
    body: "Five-factor technical verdicts distilled into one gauge — momentum, trend and mean-reversion scored on every symbol.",
  },
  {
    icon: Boxes,
    title: "Level II Depth",
    body: "Order-book visualization with proportional size bars, spread tracking and a tape that never sleeps.",
  },
  {
    icon: BarChart3,
    title: "Sector Intelligence",
    body: "Heatmapped performance, rotation quadrants and breadth analytics across eleven GICS sectors.",
  },
  {
    icon: Newspaper,
    title: "Sentiment Wire",
    body: "Headlines scored for direction and impact, mapped to your symbols the moment they cross.",
  },
  {
    icon: Radar,
    title: "Fundamental X-Ray",
    body: "Four-year statement trends, margin bridges and free-cash-flow quality — readable at a glance.",
  },
];

function Features() {
  return (
    <section id="features" className="relative px-4 sm:px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl mb-12">
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight">
            Built like an instrument,
            <br />
            <span className="text-primary">not a dashboard.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="glass rounded-2xl p-6 group hover:border-primary/30 transition-colors"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5 group-hover:glow-primary transition-shadow">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="font-display font-semibold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const STATS = [
  { value: "16", label: "Instruments covered", sub: "expanding universe" },
  { value: "6", label: "Research workspaces", sub: "one keystroke apart" },
  { value: "12ms", label: "Feed latency", sub: "simulated stream" },
  { value: "40+", label: "Indicators & signals", sub: "computed client-side" },
];

function StatsBand() {
  return (
    <section id="coverage" className="relative px-4 sm:px-6 py-20">
      <div className="mx-auto max-w-6xl glass-bright rounded-3xl px-6 sm:px-10 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07, duration: 0.55 }}
          >
            <div className="font-display text-4xl sm:text-5xl font-bold text-gradient">
              {s.value}
            </div>
            <div className="mt-2 text-sm font-medium">{s.label}</div>
            <div className="text-[11px] text-muted-foreground">{s.sub}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function ClosingCta() {
  return (
    <section className="relative px-4 sm:px-6 py-28 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-3xl"
      >
        <h2 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-gradient">
          Take the desk.
        </h2>
        <p className="mt-5 text-muted-foreground text-lg">
          The terminal is live. Your edge is waiting.
        </p>
        <Link
          to="/terminal"
          className="mt-9 inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-primary text-primary-foreground font-semibold text-[15px] hover:brightness-110 transition-all glow-primary"
        >
          Launch Meridian Terminal
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-border/50 px-4 sm:px-6 py-10 bg-background/70 backdrop-blur">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center gap-4 text-[12px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <Hexagon className="h-4 w-4 text-primary" />
          <span className="font-display font-semibold text-foreground/80">MERIDIAN</span>
        </div>
        <span className="sm:ml-auto">
          Market data shown is simulated for demonstration. Not investment advice.
        </span>
      </div>
    </footer>
  );
}
