import { Delta, Panel, Sparkline, StatTile } from "@/components/meridian/Primitives";
import { useMarket } from "@/context/MarketContext";
import {
  bySymbol,
  fmtCompact,
  fmtPrice,
  getAllQuotes,
  Quote,
} from "@/lib/market";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Bell, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type SortKey = "symbol" | "price" | "changePct" | "volume" | "marketCap";

const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "symbol", label: "Symbol" },
  { key: "price", label: "Last", align: "right" },
  { key: "changePct", label: "Chg %", align: "right" },
  { key: "volume", label: "Volume", align: "right" },
  { key: "marketCap", label: "Mkt Cap", align: "right" },
];

export default function Watchlist() {
  const quotes = useMemo(getAllQuotes, []);
  const [sortKey, setSortKey] = useState<SortKey>("changePct");
  const [asc, setAsc] = useState(false);
  const navigate = useNavigate();
  const { setActiveSymbol } = useMarket();

  const sorted = useMemo(() => {
    const val = (q: Quote): number | string =>
      sortKey === "marketCap" ? bySymbol(q.symbol).marketCap : q[sortKey];
    return [...quotes].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      const cmp =
        typeof av === "string"
          ? av.localeCompare(bv as string)
          : (av as number) - (bv as number);
      return asc ? cmp : -cmp;
    });
  }, [quotes, sortKey, asc]);

  const advancers = quotes.filter((q) => q.changePct > 0).length;
  const best = [...quotes].sort((a, b) => b.changePct - a.changePct)[0];
  const worst = [...quotes].sort((a, b) => a.changePct - b.changePct)[0];
  const totalVol = quotes.reduce((a, q) => a + q.volume, 0);

  const open = (s: string) => {
    setActiveSymbol(s);
    navigate("/terminal");
  };

  const onSort = (k: SortKey) => {
    if (k === sortKey) setAsc((v) => !v);
    else {
      setSortKey(k);
      setAsc(k === "symbol");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Panel bodyClassName="p-4">
          <StatTile
            label="Breadth"
            value={
              <span>
                <span className="text-up">{advancers}▲</span>
                <span className="text-muted-foreground mx-1.5">/</span>
                <span className="text-down">{quotes.length - advancers}▼</span>
              </span>
            }
            sub="advancers vs decliners"
          />
        </Panel>
        <Panel bodyClassName="p-4">
          <StatTile
            label="Top Gainer"
            value={
              <span className="inline-flex items-center gap-2">
                {best.symbol} <Delta value={best.changePct} bare />
              </span>
            }
            sub={best.name}
          />
        </Panel>
        <Panel bodyClassName="p-4">
          <StatTile
            label="Top Decliner"
            value={
              <span className="inline-flex items-center gap-2">
                {worst.symbol} <Delta value={worst.changePct} bare />
              </span>
            }
            sub={worst.name}
          />
        </Panel>
        <Panel bodyClassName="p-4">
          <StatTile
            label="Aggregate Volume"
            value={fmtCompact(totalVol)}
            sub="across watchlist"
          />
        </Panel>
      </div>

      <Panel
        title="Primary Watchlist"
        subtitle={`${quotes.length} instruments · click any row to chart`}
        actions={
          <button className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-border/70 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
            <Bell className="h-3 w-3" /> Alerts
          </button>
        }
        bodyClassName="px-0 pb-1"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border/60">
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      "px-4 py-2.5 font-medium cursor-pointer select-none whitespace-nowrap",
                      c.align === "right" ? "text-right" : "text-left",
                    )}
                    onClick={() => onSort(c.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.label}
                      {sortKey === c.key ? (
                        asc ? (
                          <ArrowUp className="h-3 w-3 text-primary" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-primary" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-2.5 font-medium text-right text-[10px] uppercase tracking-[0.12em]">
                  Trend · 1D
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((q) => {
                const meta = bySymbol(q.symbol);
                return (
                  <tr
                    key={q.symbol}
                    onClick={() => open(q.symbol)}
                    className="border-b border-border/40 last:border-0 hover:bg-accent/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-mono-data font-semibold">{q.symbol}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                        {q.name}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono-data">
                      {fmtPrice(q.price)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Delta value={q.changePct} />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono-data text-muted-foreground">
                      {fmtCompact(q.volume)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono-data text-muted-foreground">
                      ${fmtCompact(meta.marketCap)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end">
                        <Sparkline data={q.spark} width={110} height={26} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
