import {
  bollinger,
  Candle,
  ema,
  fmtCompact,
  fmtPrice,
  getSeries,
  macd,
  rsi,
  subscribeTicks,
  Timeframe,
  TIMEFRAMES,
} from "@/lib/market";
import { cn } from "@/lib/utils";
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  LineSeries,
  LineStyle,
  Time,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";

export type ChartKind = "candles" | "area";

export interface Overlays {
  ema20: boolean;
  ema50: boolean;
  bb: boolean;
  volume: boolean;
  rsi: boolean;
  macd: boolean;
}

const C = {
  up: "#10b981",
  down: "#f43f5e",
  upSoft: "rgba(16,185,129,0.45)",
  downSoft: "rgba(244,63,94,0.45)",
  grid: "rgba(120,140,190,0.07)",
  text: "#8b93a7",
  crosshair: "rgba(34,211,238,0.5)",
  accent: "#22d3ee",
  ema20: "#d97706",
  ema50: "#8b5cf6",
  bb: "rgba(2,132,199,0.85)",
  bbFill: "rgba(2,132,199,0.35)",
};

interface Legend {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  changePct: number;
}

export function PriceChart({
  symbol,
  timeframe,
  kind,
  overlays,
  className,
  live = true,
}: {
  symbol: string;
  timeframe: Timeframe;
  kind: ChartKind;
  overlays: Overlays;
  className?: string;
  live?: boolean;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [legend, setLegend] = useState<Legend | null>(null);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: C.text,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        attributionLogo: false,
        panes: {
          separatorColor: "rgba(120,140,190,0.15)",
          separatorHoverColor: "rgba(34,211,238,0.25)",
          enableResize: true,
        },
      },
      grid: {
        vertLines: { color: C.grid },
        horzLines: { color: C.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: C.crosshair, width: 1, style: LineStyle.LargeDashed, labelBackgroundColor: "#16324a" },
        horzLine: { color: C.crosshair, width: 1, style: LineStyle.LargeDashed, labelBackgroundColor: "#16324a" },
      },
      rightPriceScale: {
        borderColor: "rgba(120,140,190,0.15)",
        scaleMargins: { top: 0.08, bottom: overlays.volume ? 0.22 : 0.08 },
      },
      timeScale: {
        borderColor: "rgba(120,140,190,0.15)",
        timeVisible: TIMEFRAMES[timeframe].stepSec < 86400,
        secondsVisible: false,
        rightOffset: 4,
        barSpacing: 7,
      },
    });
    chartRef.current = chart;

    const candles = getSeries(symbol, timeframe);
    const closes = candles.map((c) => c.close);
    const t = (c: Candle) => c.time as Time;
    const first = candles[0];

    /* ---- main series ---- */
    let priceSeries: ISeriesApi<"Candlestick"> | ISeriesApi<"Area">;
    if (kind === "candles") {
      priceSeries = chart.addSeries(CandlestickSeries, {
        upColor: C.up,
        downColor: C.down,
        borderUpColor: C.up,
        borderDownColor: C.down,
        wickUpColor: C.upSoft,
        wickDownColor: C.downSoft,
        priceLineColor: C.accent,
        priceLineStyle: LineStyle.Dotted,
      });
      priceSeries.setData(
        candles.map((c) => ({ time: t(c), open: c.open, high: c.high, low: c.low, close: c.close })),
      );
    } else {
      priceSeries = chart.addSeries(AreaSeries, {
        lineColor: C.accent,
        topColor: "rgba(34,211,238,0.25)",
        bottomColor: "rgba(34,211,238,0)",
        lineWidth: 2,
        priceLineColor: C.accent,
        priceLineStyle: LineStyle.Dotted,
      });
      priceSeries.setData(candles.map((c) => ({ time: t(c), value: c.close })));
    }

    /* ---- overlays ---- */
    const lineData = (vals: (number | null)[]) =>
      candles
        .map((c, i) => ({ time: t(c), value: vals[i] }))
        .filter((d): d is { time: Time; value: number } => d.value !== null);

    if (overlays.ema20) {
      chart
        .addSeries(LineSeries, {
          color: C.ema20,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
        .setData(lineData(ema(closes, 20)));
    }
    if (overlays.ema50) {
      chart
        .addSeries(LineSeries, {
          color: C.ema50,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
        .setData(lineData(ema(closes, 50)));
    }
    if (overlays.bb) {
      const bands = bollinger(closes, 20, 2);
      for (const vals of [bands.upper, bands.mid, bands.lower]) {
        chart
          .addSeries(LineSeries, {
            color: vals === bands.mid ? C.bbFill : C.bb,
            lineWidth: 1,
            lineStyle: vals === bands.mid ? LineStyle.Dotted : LineStyle.Solid,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          })
          .setData(lineData(vals));
      }
    }

    /* ---- volume (overlay scale on the main pane) ---- */
    let volSeries: ISeriesApi<"Histogram"> | null = null;
    if (overlays.volume) {
      volSeries = chart.addSeries(HistogramSeries, {
        priceScaleId: "vol",
        priceFormat: { type: "volume" },
        priceLineVisible: false,
        lastValueVisible: false,
      });
      chart.priceScale("vol").applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });
      volSeries.setData(
        candles.map((c) => ({
          time: t(c),
          value: c.volume,
          color: c.close >= c.open ? "rgba(16,185,129,0.35)" : "rgba(244,63,94,0.35)",
        })),
      );
    }

    /* ---- lower panes ---- */
    let paneIdx = 0;
    if (overlays.rsi) {
      paneIdx += 1;
      const rsiSeries = chart.addSeries(
        LineSeries,
        { color: C.accent, lineWidth: 2, priceLineVisible: false },
        paneIdx,
      );
      rsiSeries.setData(lineData(rsi(closes, 14)));
      for (const [level, color] of [
        [70, C.downSoft],
        [30, C.upSoft],
      ] as const) {
        rsiSeries.createPriceLine({
          price: level,
          color,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "",
        });
      }
    }
    if (overlays.macd) {
      paneIdx += 1;
      const m = macd(closes);
      const histSeries = chart.addSeries(
        HistogramSeries,
        { priceLineVisible: false, lastValueVisible: false },
        paneIdx,
      );
      histSeries.setData(
        candles
          .map((c, i) => ({
            time: t(c),
            value: m.hist[i],
            color: (m.hist[i] ?? 0) >= 0 ? "rgba(16,185,129,0.5)" : "rgba(244,63,94,0.5)",
          }))
          .filter((d): d is { time: Time; value: number; color: string } => d.value !== null),
      );
      chart
        .addSeries(LineSeries, { color: C.accent, lineWidth: 1, priceLineVisible: false, lastValueVisible: false }, paneIdx)
        .setData(lineData(m.line));
      chart
        .addSeries(LineSeries, { color: C.ema20, lineWidth: 1, priceLineVisible: false, lastValueVisible: false }, paneIdx)
        .setData(lineData(m.signal));
    }

    // proportion panes: main pane dominant
    const panes = chart.panes();
    if (panes.length > 1) {
      const paneH = Math.max(90, Math.floor(el.clientHeight * 0.16));
      for (let i = 1; i < panes.length; i++) panes[i].setHeight(paneH);
    }

    chart.timeScale().fitContent();

    /* ---- crosshair legend ---- */
    const lastBar = candles[candles.length - 1];
    const defaultLegend: Legend = {
      o: lastBar.open,
      h: lastBar.high,
      l: lastBar.low,
      c: lastBar.close,
      v: lastBar.volume,
      changePct: ((lastBar.close - first.open) / first.open) * 100,
    };
    setLegend(defaultLegend);
    chart.subscribeCrosshairMove((param) => {
      if (!param.time) {
        setLegend(defaultLegend);
        return;
      }
      const bar = candles.find((c) => c.time === (param.time as number));
      if (bar) {
        setLegend({
          o: bar.open,
          h: bar.high,
          l: bar.low,
          c: bar.close,
          v: bar.volume,
          changePct: ((bar.close - bar.open) / bar.open) * 100,
        });
      }
    });

    /* ---- live ticks on the last bar ---- */
    let unsub: (() => void) | undefined;
    if (live) {
      let bar = { ...lastBar };
      unsub = subscribeTicks(symbol, (tick) => {
        bar = {
          ...bar,
          close: tick.price,
          high: Math.max(bar.high, tick.price),
          low: Math.min(bar.low, tick.price),
          volume: bar.volume + tick.volume,
        };
        if (kind === "candles") {
          (priceSeries as ISeriesApi<"Candlestick">).update({
            time: bar.time as Time,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
          });
        } else {
          (priceSeries as ISeriesApi<"Area">).update({
            time: bar.time as Time,
            value: bar.close,
          });
        }
        volSeries?.update({
          time: bar.time as Time,
          value: bar.volume,
          color: bar.close >= bar.open ? "rgba(16,185,129,0.35)" : "rgba(244,63,94,0.35)",
        });
      });
    }

    return () => {
      unsub?.();
      chart.remove();
      chartRef.current = null;
    };
  }, [symbol, timeframe, kind, overlays, live]);

  return (
    <div className={cn("relative", className)}>
      <div ref={holder} className="absolute inset-0" />
      {legend && (
        <div className="absolute top-2 left-3 z-10 pointer-events-none flex flex-wrap items-center gap-x-3 gap-y-1 font-mono-data text-[11px]">
          <LegendCell k="O" v={fmtPrice(legend.o)} />
          <LegendCell k="H" v={fmtPrice(legend.h)} />
          <LegendCell k="L" v={fmtPrice(legend.l)} />
          <LegendCell
            k="C"
            v={fmtPrice(legend.c)}
            className={legend.c >= legend.o ? "text-up" : "text-down"}
          />
          <LegendCell k="VOL" v={fmtCompact(legend.v)} />
          {overlays.ema20 && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <i className="h-0.5 w-3 rounded" style={{ background: C.ema20 }} />
              EMA20
            </span>
          )}
          {overlays.ema50 && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <i className="h-0.5 w-3 rounded" style={{ background: C.ema50 }} />
              EMA50
            </span>
          )}
          {overlays.bb && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <i className="h-0.5 w-3 rounded" style={{ background: C.bb }} />
              BB(20,2)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function LegendCell({
  k,
  v,
  className,
}: {
  k: string;
  v: string;
  className?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-muted-foreground/70">{k}</span>
      <span className={cn("font-medium", className)}>{v}</span>
    </span>
  );
}
