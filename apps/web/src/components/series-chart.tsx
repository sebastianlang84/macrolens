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
import { formatPctDelta, formatValueByUnit } from "@/lib/formatters";
import type { MacroSeries } from "@/types/macro";

type Props = {
  series: MacroSeries;
};

function toChartData(series: MacroSeries) {
  return series.points.map((point) => ({
    ...point,
    dateLabel: format(parseISO(point.date), "MMM yy"),
  }));
}

export function SeriesChart({ series }: Props) {
  const chartData = toChartData(series);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/70 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur md:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-slate-900">
            {series.label}
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">{series.description}</p>
          {series.error ? (
            <p className="mt-1 text-xs font-medium text-rose-700">Fehler: {series.error}</p>
          ) : null}
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
          {series.source.toUpperCase()}
        </span>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-slate-900 p-3 text-slate-100">
          <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Aktuell</p>
          <p className="mt-1 text-sm font-semibold">
            {series.stats.latestValue !== null
              ? formatValueByUnit(series.stats.latestValue, series.unit)
              : "n/a"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-slate-700">
          <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">1M / 3M / 1Y</p>
          <p className="mt-1 text-sm font-semibold">
            {formatPctDelta(series.stats.change1mPct)} / {formatPctDelta(series.stats.change3mPct)} /{" "}
            {formatPctDelta(series.stats.change1yPct)}
          </p>
        </div>
      </div>

      <div className="h-52 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbe3ee" />
              <XAxis
                dataKey="dateLabel"
                minTickGap={28}
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                width={56}
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => {
                  if (Math.abs(value) >= 1000) {
                    return `${Math.round(value / 1000)}k`;
                  }
                  return `${Math.round(value)}`;
                }}
              />
              <Tooltip
                formatter={(value: number | string | undefined) =>
                  typeof value === "number" ? formatValueByUnit(value, series.unit) : "n/a"
                }
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: "1px solid #e2e8f0",
                  background: "rgba(255,255,255,0.95)",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={series.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
            Keine Daten verfügbar
          </div>
        )}
      </div>
    </article>
  );
}
