import { Panel, StatTile } from "@/components/meridian/Primitives";
import { useMarket } from "@/context/MarketContext";
import { NEWS, NewsItem } from "@/lib/market";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Filter = "all" | "high" | "bullish" | "bearish";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "high", label: "High Impact" },
  { key: "bullish", label: "Bullish" },
  { key: "bearish", label: "Bearish" },
];

export default function News() {
  const [filter, setFilter] = useState<Filter>("all");

  const items = useMemo(() => {
    switch (filter) {
      case "high":
        return NEWS.filter((n) => n.impact === "high");
      case "bullish":
        return NEWS.filter((n) => n.sentiment > 0.2);
      case "bearish":
        return NEWS.filter((n) => n.sentiment < -0.2);
      default:
        return NEWS;
    }
  }, [filter]);

  const avgSentiment = NEWS.reduce((a, n) => a + n.sentiment, 0) / NEWS.length;
  const bullish = NEWS.filter((n) => n.sentiment > 0.2).length;
  const bearish = NEWS.filter((n) => n.sentiment < -0.2).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Panel bodyClassName="p-4">
          <StatTile
            label="Wire Sentiment"
            value={
              <span className={avgSentiment >= 0 ? "text-up" : "text-down"}>
                {avgSentiment >= 0 ? "RISK-ON" : "RISK-OFF"}
              </span>
            }
            sub={`net score ${avgSentiment >= 0 ? "+" : ""}${avgSentiment.toFixed(2)}`}
          />
        </Panel>
        <Panel bodyClassName="p-4">
          <StatTile label="Bullish Stories" value={<span className="text-up">{bullish}</span>} sub="score > +0.2" />
        </Panel>
        <Panel bodyClassName="p-4">
          <StatTile label="Bearish Stories" value={<span className="text-down">{bearish}</span>} sub="score < −0.2" />
        </Panel>
        <Panel bodyClassName="p-4">
          <StatTile label="High Impact" value={NEWS.filter((n) => n.impact === "high").length} sub="market-moving flags" />
        </Panel>
      </div>

      <Panel
        title="Sentiment Wire"
        subtitle="Headlines scored −1 to +1 by direction and conviction"
        actions={
          <div className="flex items-center gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors",
                  filter === f.key
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
        bodyClassName="px-0 pb-0"
      >
        <ul className="divide-y divide-border/40">
          {items.map((n) => (
            <NewsRow key={n.id} item={n} />
          ))}
          {items.length === 0 && (
            <li className="px-5 py-10 text-center text-sm text-muted-foreground">
              No stories match this filter.
            </li>
          )}
        </ul>
      </Panel>
    </div>
  );
}

function NewsRow({ item }: { item: NewsItem }) {
  const navigate = useNavigate();
  const { setActiveSymbol } = useMarket();
  const pos = item.sentiment >= 0;
  return (
    <li className="px-4 sm:px-5 py-4 hover:bg-accent/30 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        {/* sentiment meter */}
        <div className="sm:w-24 shrink-0 flex sm:flex-col items-center sm:items-start gap-2 sm:gap-1">
          <span
            className={cn(
              "font-mono-data text-sm font-bold",
              pos ? "text-up" : "text-down",
            )}
          >
            {pos ? "+" : ""}
            {item.sentiment.toFixed(2)}
          </span>
          <div className="relative flex-1 sm:flex-none sm:w-full h-1.5 rounded-full bg-surface-3 overflow-hidden min-w-[64px]">
            <div
              className={cn("absolute inset-y-0", pos ? "bg-up/80" : "bg-down/80")}
              style={{
                left: pos ? "50%" : `${50 - Math.abs(item.sentiment) * 50}%`,
                width: `${Math.abs(item.sentiment) * 50}%`,
              }}
            />
            <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
          </div>
          <span
            className={cn(
              "text-[9px] font-mono-data uppercase tracking-wider px-1.5 py-0.5 rounded border",
              item.impact === "high"
                ? "border-down/40 text-down"
                : item.impact === "medium"
                  ? "border-chart-2/40 text-chart-2"
                  : "border-border text-muted-foreground",
            )}
          >
            {item.impact}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-medium leading-snug hover:text-primary transition-colors cursor-pointer">
            {item.headline}
          </h3>
          <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
            {item.summary}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono-data text-muted-foreground">
              {item.source} · {item.minutesAgo}m ago
            </span>
            {item.symbols.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setActiveSymbol(s);
                  navigate("/terminal");
                }}
                className="text-[10px] font-mono-data px-1.5 py-0.5 rounded border border-primary/25 bg-primary/5 text-primary hover:bg-primary/15 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </li>
  );
}
