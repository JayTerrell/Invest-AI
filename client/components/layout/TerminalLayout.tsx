import { CommandLauncher } from "@/components/meridian/CommandLauncher";
import { Delta, LiveDot } from "@/components/meridian/Primitives";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fmtPrice, getAllQuotes } from "@/lib/market";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Bell,
  CandlestickChart,
  Hexagon,
  ListChecks,
  Newspaper,
  Settings,
  Table2,
  Users,
} from "lucide-react";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

const NAV = [
  { label: "Charting Terminal", to: "/terminal", icon: CandlestickChart },
  { label: "Watchlist & Alerts", to: "/watchlist", icon: ListChecks },
  { label: "Financial Statements", to: "/financials", icon: Table2 },
  { label: "Sector Intelligence", to: "/sector", icon: BarChart3 },
  { label: "Executive Analysis", to: "/ceo", icon: Users },
  { label: "News & Sentiment", to: "/news", icon: Newspaper },
];

const PAGE_TITLES: Record<string, string> = {
  "/terminal": "Charting Terminal",
  "/watchlist": "Watchlist & Alerts",
  "/financials": "Financial Statements",
  "/sector": "Sector Intelligence",
  "/ceo": "Executive Analysis",
  "/news": "News & Sentiment",
};

export default function TerminalLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <div className="flex flex-1 min-h-0">
        <Rail />
        <div className="flex-1 min-w-0 flex flex-col">
          <TopBar title={PAGE_TITLES[location.pathname] ?? "Meridian"} />
          <TickerTape />
          <main className="flex-1 min-h-0 overflow-y-auto bg-grid">
            <div className="p-3 sm:p-4 lg:p-5 pb-20 md:pb-5">{children}</div>
          </main>
          <StatusBar />
        </div>
      </div>
      <MobileTabBar />
    </div>
  );
}

/** Bottom tab bar — replaces the rail on small screens. */
function MobileTabBar() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 glass-bright border-t border-border/70 flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 rounded-lg my-1.5 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground",
            )
          }
        >
          <item.icon className="h-[18px] w-[18px]" />
          <span className="text-[8.5px] font-medium leading-none">
            {item.label.split(" ")[0]}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}

function Rail() {
  return (
    <aside className="hidden md:flex w-14 shrink-0 border-r border-border/70 bg-sidebar flex-col items-center py-3 gap-1 z-30">
      <Link
        to="/"
        aria-label="Meridian home"
        className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary glow-primary"
      >
        <Hexagon className="h-5 w-5" strokeWidth={2.2} />
      </Link>
      {NAV.map((item) => (
        <Tooltip key={item.to} delayDuration={0}>
          <TooltipTrigger asChild>
            <NavLink
              to={item.to}
              aria-label={item.label}
              className={({ isActive }) =>
                cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                  isActive
                    ? "bg-primary/12 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.3)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
                )
              }
            >
              <item.icon className="h-[18px] w-[18px]" />
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      ))}
      <div className="mt-auto flex flex-col items-center gap-1">
        <button
          aria-label="Settings"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60"
        >
          <Settings className="h-[18px] w-[18px]" />
        </button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/70 to-chart-4 mt-1 ring-1 ring-border" />
      </div>
    </aside>
  );
}

function TopBar({ title }: { title: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <header className="h-12 shrink-0 border-b border-border/70 bg-background/70 backdrop-blur-md flex items-center gap-3 px-3 sm:px-4 z-20">
      <Link
        to="/"
        aria-label="Meridian home"
        className="md:hidden inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary"
      >
        <Hexagon className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </Link>
      <div className="flex items-baseline gap-3 min-w-0">
        <span className="font-display font-700 text-sm font-semibold tracking-wide">
          {title}
        </span>
        <span className="hidden sm:inline text-[11px] text-muted-foreground truncate">
          Meridian Research Terminal
        </span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <CommandLauncher />
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-muted-foreground font-mono-data">
          <LiveDot />
          <span>US MARKETS OPEN</span>
          <span className="text-border">·</span>
          <span suppressHydrationWarning>
            {now.toLocaleTimeString("en-US", { hour12: false })} ET
          </span>
        </div>
        <button
          aria-label="Notifications"
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-down" />
        </button>
      </div>
    </header>
  );
}

function TickerTape() {
  const quotes = useMemo(getAllQuotes, []);
  const items = [...quotes, ...quotes]; // duplicated for a seamless loop
  return (
    <div className="h-8 shrink-0 border-b border-border/70 bg-surface-1/80 overflow-hidden relative mask-fade-x">
      <div className="flex items-center h-full w-max animate-marquee hover:[animation-play-state:paused]">
        {items.map((q, i) => (
          <div
            key={`${q.symbol}-${i}`}
            className="flex items-center gap-2 px-4 border-r border-border/40 text-[12px] whitespace-nowrap"
          >
            <span className="font-mono-data font-semibold">{q.symbol}</span>
            <span className="font-mono-data text-muted-foreground">
              {fmtPrice(q.price)}
            </span>
            <Delta value={q.changePct} bare />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <footer className="hidden md:flex h-7 shrink-0 border-t border-border/70 bg-sidebar items-center gap-4 px-4 text-[10px] font-mono-data text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <LiveDot className="scale-75" />
        FEED CONNECTED
      </span>
      <span>LATENCY 12ms</span>
      <span className="hidden sm:inline">DATA: SIMULATED · 15 MIN DELAY DISCLOSURE N/A</span>
      <span className="ml-auto hidden md:inline">
        MERIDIAN v2.4.1 · INSTITUTIONAL
      </span>
    </footer>
  );
}
