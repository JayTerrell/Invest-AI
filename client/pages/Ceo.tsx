import { Panel } from "@/components/meridian/Primitives";
import { useMarket } from "@/context/MarketContext";
import { EXECUTIVES, ExecProfile, fmtCompact } from "@/lib/market";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export default function Ceo() {
  return (
    <div className="space-y-4">
      <Panel
        title="Executive Scorecards"
        subtitle="Leadership quality scored on capital allocation, execution and shareholder alignment"
        bodyClassName="px-4 pb-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {EXECUTIVES.map((e) => (
            <ExecCard key={e.symbol} exec={e} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ExecCard({ exec }: { exec: ExecProfile }) {
  const navigate = useNavigate();
  const { setActiveSymbol } = useMarket();
  const composite = Math.round(
    (exec.capitalScore + exec.executionScore + exec.alignmentScore) / 3,
  );

  return (
    <article className="rounded-xl border border-border/60 bg-surface-2/50 p-5 hover:border-primary/30 transition-colors">
      <header className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/30 to-chart-4/40 flex items-center justify-center font-display font-bold text-sm">
          {exec.name
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-semibold leading-tight">{exec.name}</h3>
          <p className="text-[11px] text-muted-foreground">{exec.title}</p>
        </div>
        <button
          onClick={() => {
            setActiveSymbol(exec.symbol);
            navigate("/terminal");
          }}
          className="text-[11px] font-mono-data px-2 py-1 rounded-lg border border-primary/25 bg-primary/5 text-primary hover:bg-primary/15 transition-colors"
        >
          {exec.symbol}
        </button>
      </header>

      <div className="mt-4 flex items-center gap-4">
        <div
          className={cn(
            "font-display text-3xl font-bold",
            composite >= 90 ? "text-up" : composite >= 75 ? "text-primary" : "text-chart-2",
          )}
        >
          {composite}
        </div>
        <div className="text-[11px] text-muted-foreground leading-tight">
          composite
          <br />
          leadership score
        </div>
        <div className="ml-auto text-right">
          <div className="font-mono-data text-sm font-semibold text-up">
            +{fmtCompact(exec.totalReturnPct)}%
          </div>
          <div className="text-[10px] text-muted-foreground">
            return over {exec.tenureYears}y tenure
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <ScoreBar label="Capital allocation" value={exec.capitalScore} />
        <ScoreBar label="Execution" value={exec.executionScore} />
        <ScoreBar label="Alignment" value={exec.alignmentScore} sub={`${exec.insiderOwnPct}% insider ownership`} />
      </div>

      <p className="mt-4 text-[12px] text-muted-foreground leading-relaxed">
        {exec.note}
      </p>
    </article>
  );
}

function ScoreBar({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono-data">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/50 to-primary"
          style={{ width: `${value}%` }}
        />
      </div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
