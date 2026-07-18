import { Panel, StatTile } from "@/components/meridian/Primitives";
import { useMarket } from "@/context/MarketContext";
import {
  bySymbol,
  fmtCompact,
  getFinancials,
  UNIVERSE,
} from "@/lib/market";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const GRID = "hsl(224 40% 40% / 0.1)";
const TEXT = "hsl(222 14% 58%)";
const C1 = "hsl(var(--chart-1))";
const C2 = "hsl(var(--chart-2))";
const C3 = "hsl(var(--chart-3))";

const tooltipStyle = {
  background: "hsl(227 34% 10%)",
  border: "1px solid hsl(226 24% 20%)",
  borderRadius: 10,
  fontSize: 12,
  fontFamily: "'JetBrains Mono', monospace",
};

export default function Financials() {
  const { activeSymbol, setActiveSymbol } = useMarket();
  const meta = bySymbol(activeSymbol);
  const fin = useMemo(() => getFinancials(activeSymbol), [activeSymbol]);
  const latest = fin[fin.length - 1];
  const prior = fin[fin.length - 2];
  const revGrowth = ((latest.revenue - prior.revenue) / prior.revenue) * 100;

  return (
    <div className="space-y-4">
      {/* symbol selector */}
      <div className="glass rounded-xl px-3 py-2.5 flex items-center gap-2 overflow-x-auto">
        {UNIVERSE.map((u) => (
          <button
            key={u.symbol}
            onClick={() => setActiveSymbol(u.symbol)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[12px] font-mono-data font-medium whitespace-nowrap transition-colors",
              u.symbol === activeSymbol
                ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.3)]"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
          >
            {u.symbol}
          </button>
        ))}
      </div>

      {/* headline metrics */}
      <div className="glass rounded-xl px-5 py-4">
        <div className="flex items-baseline gap-3 mb-4">
          <h1 className="font-display text-xl font-bold">{meta.name}</h1>
          <span className="text-[11px] font-mono-data text-muted-foreground">
            {meta.symbol} · {meta.sector} · FY25 trailing twelve months
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-3">
          <StatTile label="Revenue (TTM)" value={`$${fmtCompact(latest.revenue * 1e9)}`} sub={`${revGrowth >= 0 ? "+" : ""}${revGrowth.toFixed(1)}% YoY`} />
          <StatTile label="Net Income" value={`$${fmtCompact(latest.netIncome * 1e9)}`} />
          <StatTile label="Free Cash Flow" value={`$${fmtCompact(latest.fcf * 1e9)}`} />
          <StatTile label="Gross Margin" value={`${latest.grossMargin.toFixed(1)}%`} />
          <StatTile label="Operating Margin" value={`${latest.opMargin.toFixed(1)}%`} />
          <StatTile label="EPS (TTM)" value={`$${meta.eps.toFixed(2)}`} sub={`P/E ${meta.pe.toFixed(1)}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Revenue & Free Cash Flow" subtitle="USD billions · fiscal years">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={fin} barGap={2}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="period" tick={{ fill: TEXT, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: TEXT, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v.toFixed(0)}B`} width={52} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "hsl(226 30% 20% / 0.25)" }}
                  formatter={(v: number) => [`$${v.toFixed(1)}B`]}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: TEXT }} />
                <Bar name="Revenue" dataKey="revenue" fill={C1} radius={[4, 4, 0, 0]} maxBarSize={38} />
                <Bar name="Free cash flow" dataKey="fcf" fill={C2} radius={[4, 4, 0, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Margin Structure" subtitle="Percent of revenue · fiscal years">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={fin}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="period" tick={{ fill: TEXT, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: TEXT, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v.toFixed(0)}%`} width={44} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [`${v.toFixed(1)}%`]}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: TEXT }} />
                <Line name="Gross margin" dataKey="grossMargin" stroke={C1} strokeWidth={2} dot={{ r: 3 }} />
                <Line name="Operating margin" dataKey="opMargin" stroke={C2} strokeWidth={2} dot={{ r: 3 }} />
                <Line name="Net margin" dataKey="netMargin" stroke={C3} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Income Statement" subtitle="USD billions unless noted" bodyClassName="px-0 pb-1">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border/60">
                <th className="px-4 py-2.5 text-left font-medium">Line Item</th>
                {fin.map((p) => (
                  <th key={p.period} className="px-4 py-2.5 text-right font-medium font-mono-data">
                    {p.period}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["Revenue", (p) => `$${p.revenue.toFixed(1)}`],
                  ["Gross profit", (p) => `$${p.grossProfit.toFixed(1)}`],
                  ["Operating income", (p) => `$${p.opIncome.toFixed(1)}`],
                  ["Net income", (p) => `$${p.netIncome.toFixed(1)}`],
                  ["Free cash flow", (p) => `$${p.fcf.toFixed(1)}`],
                  ["Gross margin", (p) => `${p.grossMargin.toFixed(1)}%`],
                  ["Operating margin", (p) => `${p.opMargin.toFixed(1)}%`],
                  ["Net margin", (p) => `${p.netMargin.toFixed(1)}%`],
                ] as [string, (p: (typeof fin)[number]) => string][]
              ).map(([label, get]) => (
                <tr key={label} className="border-b border-border/40 last:border-0 hover:bg-accent/30">
                  <td className="px-4 py-2 text-muted-foreground">{label}</td>
                  {fin.map((p) => (
                    <td key={p.period} className="px-4 py-2 text-right font-mono-data">
                      {get(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
