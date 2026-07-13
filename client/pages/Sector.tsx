import { Delta, Panel } from "@/components/meridian/Primitives";
import { fmtCompact, SECTORS, SectorStat } from "@/lib/market";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export default function Sector() {
  const sorted = useMemo(
    () => [...SECTORS].sort((a, b) => b.marketCap - a.marketCap),
    [],
  );

  return (
    <div className="space-y-4">
      <Panel
        title="Sector Heatmap"
        subtitle="Sized by market cap · shaded by 1-day performance"
        bodyClassName="px-3 pb-3"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[96px] gap-2">
          {sorted.map((s, i) => (
            <HeatCell key={s.name} s={s} big={i < 2} />
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RotationQuadrant />
        <BreadthPanel />
      </div>
    </div>
  );
}

function HeatCell({ s, big }: { s: SectorStat; big: boolean }) {
  const up = s.changePct >= 0;
  const intensity = Math.min(1, Math.abs(s.changePct) / 2);
  const bg = up
    ? `hsl(160 84% 30% / ${0.12 + intensity * 0.5})`
    : `hsl(347 77% 45% / ${0.12 + intensity * 0.5})`;
  const ring = up
    ? `hsl(160 84% 39% / ${0.25 + intensity * 0.4})`
    : `hsl(347 77% 55% / ${0.25 + intensity * 0.4})`;
  return (
    <div
      className={cn(
        "rounded-xl p-3 flex flex-col justify-between transition-transform hover:scale-[1.02] cursor-default",
        big && "col-span-2 row-span-2",
      )}
      style={{ background: bg, boxShadow: `inset 0 0 0 1px ${ring}` }}
    >
      <div>
        <div className={cn("font-display font-semibold leading-tight", big ? "text-lg" : "text-[13px]")}>
          {s.name}
        </div>
        <div className="text-[10px] font-mono-data text-muted-foreground mt-0.5">
          ${fmtCompact(s.marketCap)}
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <Delta value={s.changePct} bare className={big ? "text-sm" : ""} />
        <span className="text-[10px] font-mono-data text-muted-foreground">
          YTD {s.ytdPct >= 0 ? "+" : ""}
          {s.ytdPct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

/** Momentum vs relative strength — the classic rotation view. */
function RotationQuadrant() {
  const W = 480;
  const H = 380;
  const pad = 44;
  const x = (v: number) => pad + ((v + 1) / 2) * (W - pad * 2);
  const y = (v: number) => H - pad - ((v + 1) / 2) * (H - pad * 2);

  return (
    <Panel
      title="Sector Rotation"
      subtitle="Relative strength (x) vs momentum (y) · 20-day window"
    >
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[420px]" role="img" aria-label="Sector rotation quadrant chart">
          {/* quadrant tints */}
          <rect x={x(0)} y={pad} width={x(1) - x(0)} height={y(0) - pad} fill="hsl(160 84% 39% / 0.05)" />
          <rect x={pad} y={y(0)} width={x(0) - pad} height={y(-1) - y(0)} fill="hsl(347 77% 55% / 0.05)" />
          {/* axes */}
          <line x1={pad} x2={W - pad} y1={y(0)} y2={y(0)} stroke="hsl(224 40% 40% / 0.25)" strokeWidth="1" />
          <line x1={x(0)} x2={x(0)} y1={pad} y2={H - pad} stroke="hsl(224 40% 40% / 0.25)" strokeWidth="1" />
          {/* quadrant labels */}
          <text x={W - pad - 4} y={pad + 14} textAnchor="end" className="fill-up" fontSize="10" fontFamily="'JetBrains Mono', monospace" fill="hsl(160 84% 45%)">LEADING</text>
          <text x={pad + 4} y={pad + 14} fontSize="10" fontFamily="'JetBrains Mono', monospace" fill="hsl(222 14% 58%)">IMPROVING</text>
          <text x={W - pad - 4} y={H - pad - 6} textAnchor="end" fontSize="10" fontFamily="'JetBrains Mono', monospace" fill="hsl(222 14% 58%)">WEAKENING</text>
          <text x={pad + 4} y={H - pad - 6} fontSize="10" fontFamily="'JetBrains Mono', monospace" fill="hsl(347 77% 60%)">LAGGING</text>
          {/* points with direct labels */}
          {SECTORS.map((s) => {
            const up = s.momentum >= 0;
            return (
              <g key={s.name}>
                <circle
                  cx={x(s.strength)}
                  cy={y(s.momentum)}
                  r={5 + Math.min(5, s.marketCap / 4e12)}
                  fill={up ? "hsl(160 84% 39% / 0.75)" : "hsl(347 77% 55% / 0.75)"}
                  stroke="hsl(228 36% 5%)"
                  strokeWidth="2"
                />
                <text
                  x={x(s.strength)}
                  y={y(s.momentum) - 11}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontFamily="'JetBrains Mono', monospace"
                  fill="hsl(220 25% 85%)"
                >
                  {s.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </Panel>
  );
}

function BreadthPanel() {
  const sorted = useMemo(
    () => [...SECTORS].sort((a, b) => b.breadth - a.breadth),
    [],
  );
  return (
    <Panel
      title="Sector Breadth"
      subtitle="Share of constituents advancing today"
    >
      <ul className="space-y-2.5">
        {sorted.map((s) => (
          <li key={s.name} className="flex items-center gap-3 text-[12px]">
            <span className="w-36 shrink-0 truncate text-muted-foreground">{s.name}</span>
            <div className="flex-1 h-2 rounded-full bg-surface-3 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full",
                  s.breadth >= 50 ? "bg-up/70" : "bg-down/70",
                )}
                style={{ width: `${s.breadth}%` }}
              />
            </div>
            <span className="w-10 text-right font-mono-data">{s.breadth}%</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
        Breadth above 50% signals participation beyond the index heavyweights —
        rallies with broad breadth historically carry further.
      </p>
    </Panel>
  );
}
