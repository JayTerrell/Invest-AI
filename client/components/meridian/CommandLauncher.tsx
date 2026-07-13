import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useMarket } from "@/context/MarketContext";
import { fmtPrice, getAllQuotes } from "@/lib/market";
import { Delta } from "@/components/meridian/Primitives";
import {
  BarChart3,
  CandlestickChart,
  ListChecks,
  Newspaper,
  Search,
  Table2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const PAGES = [
  { label: "Charting Terminal", to: "/terminal", icon: CandlestickChart },
  { label: "Watchlist & Alerts", to: "/watchlist", icon: ListChecks },
  { label: "Financial Statements", to: "/financials", icon: Table2 },
  { label: "Sector Intelligence", to: "/sector", icon: BarChart3 },
  { label: "Executive Analysis", to: "/ceo", icon: Users },
  { label: "News & Sentiment", to: "/news", icon: Newspaper },
];

/** ⌘K launcher: jump to any symbol or page. */
export function CommandLauncher() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { setActiveSymbol } = useMarket();
  const quotes = useMemo(getAllQuotes, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 h-8 w-72 rounded-lg border border-border/70 bg-surface-2/60 px-3 text-[13px] text-muted-foreground hover:border-primary/40 hover:text-foreground/80 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search symbols, pages…</span>
        <kbd className="font-mono text-[10px] rounded border border-border bg-muted/60 px-1.5 py-0.5">
          ⌘K
        </kbd>
      </button>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground"
      >
        <Search className="h-4 w-4" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a ticker or command…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Symbols">
            {quotes.map((q) => (
              <CommandItem
                key={q.symbol}
                value={`${q.symbol} ${q.name}`}
                onSelect={() => {
                  setActiveSymbol(q.symbol);
                  setOpen(false);
                  navigate("/terminal");
                }}
              >
                <span className="font-mono-data font-semibold w-14">{q.symbol}</span>
                <span className="flex-1 truncate text-muted-foreground">{q.name}</span>
                <span className="font-mono-data mr-2">{fmtPrice(q.price)}</span>
                <Delta value={q.changePct} bare />
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Workspaces">
            {PAGES.map((p) => (
              <CommandItem
                key={p.to}
                value={p.label}
                onSelect={() => {
                  setOpen(false);
                  navigate(p.to);
                }}
              >
                <p.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                {p.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
