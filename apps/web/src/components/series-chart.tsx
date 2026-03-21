"use client";

import { format, parseISO } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatNumber,
  formatPctDelta,
  formatValueByUnit,
} from "@/lib/formatters";
import type { ChartScaleMode } from "@/lib/series-analysis";
import type { MacroSeries } from "@/types/macro";

interface Props {
  scaleMode: ChartScaleMode;
  series: MacroSeries;
  yAutoScale: boolean;
}

function toChartData(series: MacroSeries, scaleMode: ChartScaleMode) {
  const firstValue = series.points[0]?.value;
  const canScaleToOne =
    scaleMode === "index1" &&
    firstValue !== undefined &&
    Number.isFinite(firstValue) &&
    firstValue !== 0;

  return series.points.map((point) => {
    const chartValue = canScaleToOne
      ? point.value / (firstValue as number)
      : point.value;
    return {
      ...point,
      chartValue,
      dateLabel: format(parseISO(point.date), "MMM yy"),
    };
  });
}

export function SeriesChart({ series, scaleMode, yAutoScale }: Props) {
  const chartData = toChartData(series, scaleMode);
  const formatTooltipValue = (value: number | string | undefined) => {
    if (typeof value !== "number") {
      return "n/a";
    }

    if (scaleMode === "index1") {
      return `${formatNumber(value, 3)}x`;
    }

    return formatValueByUnit(value, series.unit);
  };

  return (
    <article className="rounded-2xl border border-white/10 bg-white/70 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur md:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-base text-slate-900 tracking-tight">
            {series.label}
          </h3>
          <p className="mt-1 text-slate-600 text-xs leading-5">
            {series.description}
          </p>
          {series.error ? (
            <p className="mt-1 font-medium text-rose-700 text-xs">
              Fehler: {series.error}
            </p>
          ) : null}
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-[11px] text-slate-600">
          {series.source.toUpperCase()}
        </span>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-slate-900 p-3 text-slate-100">
          <p className="text-[11px] text-slate-400 uppercase tracking-[0.12em]">
            Aktuell
          </p>
          <p className="mt-1 font-semibold text-sm">
            {series.stats.latestValue === null
              ? "n/a"
              : formatValueByUnit(series.stats.latestValue, series.unit)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-slate-700">
          <p className="text-[11px] text-slate-500 uppercase tracking-[0.12em]">
            1M / 3M / 1Y
          </p>
          <p className="mt-1 font-semibold text-sm">
            {formatPctDelta(series.stats.change1mPct)} /{" "}
            {formatPctDelta(series.stats.change3mPct)} /{" "}
            {formatPctDelta(series.stats.change1yPct)}
          </p>
        </div>
      </div>

      <div className="h-52 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer height="100%" width="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="#dbe3ee" strokeDasharray="3 3" />
              <XAxis
                axisLine={false}
                dataKey="dateLabel"
                minTickGap={28}
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                domain={yAutoScale ? ["auto", "auto"] : [0, "auto"]}
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(value: number) => {
                  if (scaleMode === "index1") {
                    return `${formatNumber(value, 2)}x`;
                  }
                  if (Math.abs(value) >= 1000) {
                    return `${Math.round(value / 1000)}k`;
                  }
                  return `${Math.round(value)}`;
                }}
                tickLine={false}
                width={56}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: "1px solid #e2e8f0",
                  background: "rgba(255,255,255,0.95)",
                  fontSize: "12px",
                }}
                formatter={formatTooltipValue}
              />
              <Line
                dataKey="chartValue"
                dot={false}
                isAnimationActive={false}
                stroke={series.color}
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-slate-300 border-dashed bg-slate-50 text-slate-500 text-sm">
            Keine Daten verfügbar
          </div>
        )}
      </div>
    </article>
  );
}
