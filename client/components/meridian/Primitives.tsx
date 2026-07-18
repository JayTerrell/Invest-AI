import { cn } from "@/lib/utils";
import { fmtPct, fmtSigned } from "@/lib/market";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { PropsWithChildren, ReactNode } from "react";

/** Glass panel — the core Meridian surface. */
export function Panel({
  title,
  subtitle,
  actions,
  className,
  bodyClassName,
  children,
}: PropsWithChildren<{
  title?: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
}>) {
  return (
    <section className={cn("glass rounded-xl overflow-hidden", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
          <div className="min-w-0">
            {title && (
              <h3 className="font-display text-[13px] font-semibold tracking-wide text-foreground/90 uppercase">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
        </header>
      )}
      <div className={cn("px-4 pb-4", !title && !actions && "pt-4", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

/** Signed change chip. Direction is carried by icon + sign, not color alone. */
export function Delta({
  value,
  suffix = "%",
  className,
  bare,
}: {
  value: number;
  suffix?: string;
  className?: string;
  bare?: boolean;
}) {
  const dir = value > 0.0001 ? "up" : value < -0.0001 ? "down" : "flat";
  const Icon = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : Minus;
  const text =
    suffix === "%" ? fmtPct(value) : `${fmtSigned(value)}${suffix}`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono-data text-[12px] font-medium",
        dir === "up" && "text-up",
        dir === "down" && "text-down",
        dir === "flat" && "text-muted-foreground",
        !bare &&
          cn(
            "px-1.5 py-0.5 rounded-md",
            dir === "up" && "bg-up/10",
            dir === "down" && "bg-down/10",
            dir === "flat" && "bg-muted/40",
          ),
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {text}
    </span>
  );
}

/** Inline SVG sparkline with soft gradient fill. */
export function Sparkline({
  data,
  width = 96,
  height = 28,
  positive,
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
  className?: string;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 2;
  const pts = data.map((v, i) => [
    pad + (i / (data.length - 1)) * (width - pad * 2),
    pad + (1 - (v - min) / span) * (height - pad * 2),
  ]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const up = positive ?? data[data.length - 1] >= data[0];
  const stroke = up ? "hsl(var(--up))" : "hsl(var(--down))";
  const gid = `sg-${up ? "u" : "d"}`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${line} L${(width - pad).toFixed(1)},${height - pad} L${pad},${height - pad} Z`}
        fill={`url(#${gid})`}
        stroke="none"
      />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/** Compact stat tile: label over a hero number. */
export function StatTile({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="font-mono-data text-sm font-semibold mt-0.5 truncate">
        {value}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

/** Live-status dot with pulsing animation. */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex h-2 w-2", className)}>
      <span className="absolute inline-flex h-full w-full rounded-full bg-up opacity-60 animate-ping" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-up" />
    </span>
  );
}
