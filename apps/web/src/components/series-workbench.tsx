"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import { format, parseISO, subMonths, subYears } from "date-fns";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "@/lib/formatters";
import {
  buildOverlayData,
  buildRsiDivergenceMarkers,
  buildRsiScoreIndicators,
  findCorrelationExtremes,
  isAssetSeries,
} from "@/lib/series-analysis";
import type { MacroSeries } from "@/types/macro";

type Props = {
  series: MacroSeries[];
  className?: string;
};

type OverlayRow = {
  date: string;
  dateTs: number;
  dateLabel: string;
} & Record<string, number | string>;

type ChartPanelProps = {
  title: string;
  subtitle: string;
  series: MacroSeries[];
  rows: OverlayRow[];
  markers?: ChartMarker[];
  xDomain: [number, number];
  xRangePreset: XRangePreset;
  onXRangeChange: (preset: XRangePreset) => void;
  isReady: boolean;
  axisModeByKey: Map<string, AxisMode>;
  separateYAxisKeys: Set<string>;
  emptyMessage: string;
};

type HoverSnapshot = {
  dateLabel: string;
  items: Array<{
    key: string;
    label: string;
    value: number;
    color: string;
  }>;
};

type ChartMarker = {
  key: string;
  startDateTs: number;
  startValue: number;
  dateTs: number;
  value: number;
  color: string;
  indicatorKey: string;
};

type SelectionSlot = {
  id: string;
  seriesKey: string;
  indicatorKey: string;
  overlaySeparateYAxis: boolean;
  indicatorSeparateYAxis: boolean;
  overlayAxisMode: AxisMode;
  indicatorAxisMode: AxisMode;
};

type SlotDescriptor = {
  id: string;
  selectedSeries: MacroSeries | null;
  indicatorOptions: MacroSeries[];
  effectiveIndicatorKey: string;
  selectedIndicator: MacroSeries | null;
};

type AxisMode = "linear" | "log";
type XRangePreset = "3m" | "6m" | "1y" | "2y" | "max";

const SLOT_COUNT = 6;
const CHART_SPLIT_STORAGE_KEY = "macrolens:workbench-chart-split";
const CHART_X_RANGE_STORAGE_KEY = "macrolens:workbench-x-range";
const DEFAULT_CHART_SPLIT = 0.66;
const MIN_CHART_SPLIT = 0.35;
const MAX_CHART_SPLIT = 0.8;
const CHART_SYNC_ID = "macrolens-workbench-sync";
const DEFAULT_X_RANGE_PRESET: XRangePreset = "max";
const FALLBACK_DATE_DOMAIN: [number, number] = [
  Date.UTC(2025, 0, 1),
  Date.UTC(2026, 0, 1),
];
const X_RANGE_OPTIONS: Array<{ value: XRangePreset; label: string }> = [
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "2y", label: "2Y" },
  { value: "max", label: "Max" },
];

function buildInitialSlots(series: MacroSeries[]): SelectionSlot[] {
  const defaultSeriesKey = series.find((item) => item.key === "sp500")?.key ?? "";

  return Array.from({ length: SLOT_COUNT }, (_, idx) => {
    const selectedSeries =
      idx === 0 ? (series.find((item) => item.key === defaultSeriesKey) ?? null) : null;

    return {
      id: `slot-${idx + 1}`,
      seriesKey: selectedSeries?.key ?? "",
      indicatorKey: "",
      overlaySeparateYAxis: false,
      indicatorSeparateYAxis: true,
      overlayAxisMode: "linear",
      indicatorAxisMode: "linear",
    };
  });
}

function dedupeSeriesByKey(series: MacroSeries[]): MacroSeries[] {
  const seen = new Set<string>();

  return series.filter((item) => {
    if (seen.has(item.key)) {
      return false;
    }

    seen.add(item.key);
    return true;
  });
}

function clampChartSplit(value: number): number {
  return Math.min(MAX_CHART_SPLIT, Math.max(MIN_CHART_SPLIT, value));
}

function parseStoredChartSplit(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? clampChartSplit(parsed) : null;
}

function parseStoredXRangePreset(value: string | null): XRangePreset | null {
  if (value === "3m" || value === "6m" || value === "1y" || value === "2y" || value === "max") {
    return value;
  }

  return null;
}

function getChartSplitFromPointer(
  container: HTMLDivElement | null,
  clientY: number,
): number | null {
  const rect = container?.getBoundingClientRect();
  if (!rect || rect.height <= 0) {
    return null;
  }

  return clampChartSplit((clientY - rect.top) / rect.height);
}

function buildDisplayRows(series: MacroSeries[]): OverlayRow[] {
  return buildOverlayData(series, "raw").map((row) => ({
    ...row,
    dateTs: parseISO(row.date).getTime(),
    dateLabel: format(parseISO(row.date), "MMM yy"),
  }));
}

function formatChartAxisValue(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }
  return formatNumber(value, 1);
}

function formatDateTick(value: unknown): string {
  return typeof value === "number" ? format(value, "MMM yy") : "";
}

function getSharedDateDomain(rows: OverlayRow[][]): [number, number] | null {
  const timestamps = rows.flatMap((entry) => entry.map((row) => row.dateTs)).filter(Number.isFinite);

  if (timestamps.length === 0) {
    return null;
  }

  return [Math.min(...timestamps), Math.max(...timestamps)];
}

function getVisibleDateDomain(
  domain: [number, number],
  preset: XRangePreset,
): [number, number] {
  const [minTs, maxTs] = domain;

  if (preset === "max") {
    return domain;
  }

  const maxDate = new Date(maxTs);
  const startDate =
    preset === "3m"
      ? subMonths(maxDate, 3)
      : preset === "6m"
        ? subMonths(maxDate, 6)
        : preset === "1y"
          ? subYears(maxDate, 1)
          : subYears(maxDate, 2);
  const startTs = Math.max(minTs, startDate.getTime());

  return [startTs, maxTs];
}

function getPositiveMinForKey(rows: OverlayRow[], key: string): number | null {
  let minValue: number | null = null;

  for (const row of rows) {
    const value = row[key];
    if (typeof value !== "number" || value <= 0) {
      continue;
    }

    if (minValue === null || value < minValue) {
      minValue = value;
    }
  }

  return minValue;
}

function filterRowsToDomain(rows: OverlayRow[], domain: [number, number]): OverlayRow[] {
  return rows.filter((row) => row.dateTs >= domain[0] && row.dateTs <= domain[1]);
}

function filterMarkersToDomain(markers: ChartMarker[], domain: [number, number]): ChartMarker[] {
  return markers.filter((marker) => marker.dateTs >= domain[0] && marker.dateTs <= domain[1]);
}

function canUseLogScale(series: MacroSeries[]): boolean {
  if (series.length === 0) {
    return false;
  }

  return series.every(
    (item) => item.points.length > 0 && item.points.every((point) => Number.isFinite(point.value) && point.value > 0),
  );
}

function buildHoverSnapshot({
  label,
  payload,
}: {
  payload?: Array<{
    dataKey?: unknown;
    name?: unknown;
    value?: unknown;
    color?: unknown;
  }>;
  label?: unknown;
}): HoverSnapshot | null {
  if (!payload || payload.length === 0) {
    return null;
  }

  const items = payload
    .filter((entry) => typeof entry.value === "number")
    .map((entry) => ({
      key: typeof entry.dataKey === "string" ? entry.dataKey : String(entry.name ?? "series"),
      label: typeof entry.name === "string" ? entry.name : String(entry.dataKey ?? "Serie"),
      value: entry.value as number,
      color: typeof entry.color === "string" ? entry.color : "#0f172a",
    }));

  if (items.length === 0) {
    return null;
  }

  return {
    dateLabel: formatDateTick(label),
    items,
  };
}

function ChartPanel({
  title,
  subtitle,
  series,
  rows,
  markers = [],
  xDomain,
  xRangePreset,
  onXRangeChange,
  isReady,
  axisModeByKey,
  separateYAxisKeys,
  emptyMessage,
}: ChartPanelProps) {
  const [hoverSnapshot, setHoverSnapshot] = useState<HoverSnapshot | null>(null);
  const visibleRows = filterRowsToDomain(rows, xDomain);
  const visibleMarkers = filterMarkersToDomain(markers, xDomain);
  const sharedSeries = series.filter((item) => {
    const axisMode = axisModeByKey.get(item.key) ?? "linear";
    return axisMode === "linear" && !separateYAxisKeys.has(item.key);
  });
  const separateSeries = series.filter((item) => !sharedSeries.some((shared) => shared.key === item.key));

  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {title}
            </p>
            <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-0.5">
              {X_RANGE_OPTIONS.map((option) => (
                <button
                  key={`${title}-${option.value}`}
                  type="button"
                  onClick={() => onXRangeChange(option.value)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                    option.value === xRangePreset
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  aria-pressed={option.value === xRangePreset}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600">
              {series.length} Serien
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 min-h-0 flex-1" role="img" aria-label={`${title}: ${subtitle}`}>
        {!isReady ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
            Chart wird initialisiert...
          </div>
        ) : visibleRows.length > 0 && series.length > 0 ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={visibleRows}
                  syncId={CHART_SYNC_ID}
                  syncMethod="value"
                  margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
                  onMouseMove={(state) => {
                    const hoverState = state as {
                      activeLabel?: unknown;
                      activePayload?: Array<{
                        dataKey?: unknown;
                        name?: unknown;
                        value?: unknown;
                        color?: unknown;
                      }>;
                    };

                    setHoverSnapshot(
                      buildHoverSnapshot({
                        label: hoverState.activeLabel,
                        payload: hoverState.activePayload,
                      }),
                    );
                  }}
                  onMouseLeave={() => {
                    setHoverSnapshot(null);
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe3ee" />
                  <XAxis
                    dataKey="dateTs"
                    type="number"
                    scale="time"
                    domain={xDomain}
                    minTickGap={20}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatDateTick(value)}
                  />
                  <YAxis
                    yAxisId="shared"
                    width={58}
                    domain={["auto", "auto"]}
                    scale="linear"
                    hide={sharedSeries.length === 0}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) => formatChartAxisValue(value)}
                  />
                  {separateSeries.length > 0
                    ? separateSeries.map((item, idx) => (
                        (() => {
                          const axisMode = axisModeByKey.get(item.key) ?? "linear";
                          const axisScale = axisMode === "log" ? "log" : "linear";
                          const axisDomain =
                            axisScale === "log"
                              ? ([getPositiveMinForKey(visibleRows, item.key) ?? 1, "auto"] as const)
                              : (["auto", "auto"] as const);

                          return (
                            <YAxis
                              key={`y-${title}-${item.key}`}
                              yAxisId={item.key}
                              domain={axisDomain}
                              scale={axisScale}
                              width={sharedSeries.length === 0 && idx === 0 ? 58 : 0}
                              tick={
                                sharedSeries.length === 0 && idx === 0
                                  ? { fontSize: 11, fill: "#64748b" }
                                  : false
                              }
                              tickLine={false}
                              axisLine={false}
                              allowDataOverflow={axisScale === "log"}
                              tickFormatter={(value: number) => formatChartAxisValue(value)}
                            />
                          );
                        })()
                      ))
                    : null}
                  <Tooltip
                    cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4" }}
                    content={() => null}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  {series.map((item) => (
                    <Line
                      key={`${title}-${item.key}`}
                      type="monotone"
                      dataKey={item.key}
                      yAxisId={separateYAxisKeys.has(item.key) ? item.key : "shared"}
                      name={item.shortLabel}
                      stroke={item.color}
                      strokeDasharray={item.key.startsWith("rsi-scorew:") ? "6 4" : undefined}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                      connectNulls
                    />
                  ))}
                  {visibleMarkers.map((marker) => (
                    <ReferenceLine
                      key={`segment-${marker.key}`}
                      yAxisId={separateYAxisKeys.has(marker.indicatorKey) ? marker.indicatorKey : "shared"}
                      ifOverflow="extendDomain"
                      stroke={marker.color}
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      segment={[
                        { x: marker.startDateTs, y: marker.startValue },
                        { x: marker.dateTs, y: marker.value },
                      ]}
                    />
                  ))}
                  {visibleMarkers.map((marker) => (
                    <ReferenceDot
                      key={marker.key}
                      x={marker.dateTs}
                      y={marker.value}
                      yAxisId={separateYAxisKeys.has(marker.indicatorKey) ? marker.indicatorKey : "shared"}
                      r={4}
                      fill="#ffffff"
                      stroke={marker.color}
                      strokeWidth={2}
                      ifOverflow="extendDomain"
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-1 flex min-h-[2.75rem] items-end justify-end" aria-live="polite">
              {hoverSnapshot ? (
                <div className="max-w-full rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-right shadow-sm">
                  <p className="text-xs font-semibold text-slate-500">{hoverSnapshot.dateLabel}</p>
                  {hoverSnapshot.items.map((item) => (
                    <p key={item.key} className="mt-0.5 text-xs">
                      <span className="font-medium" style={{ color: item.color }}>
                        {item.label}
                      </span>
                      <span className="text-slate-600"> : {formatNumber(item.value, 2)}</span>
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
            {series.length > 0 ? "Keine Daten im aktuellen X-Fenster." : emptyMessage}
          </div>
        )}
      </div>
    </section>
  );
}

export function SeriesWorkbench({
  series,
  className,
}: Props) {
  const selectableSeries = series.filter((item) => item.points.length > 2);
  const deferredSelectableSeries = useDeferredValue(selectableSeries);
  const [slots, setSlots] = useState<SelectionSlot[]>(() => buildInitialSlots(selectableSeries));
  const deferredSlots = useDeferredValue(slots);
  const [chartSplit, setChartSplit] = useState(DEFAULT_CHART_SPLIT);
  const [xRangePreset, setXRangePreset] = useState<XRangePreset>(DEFAULT_X_RANGE_PRESET);
  const [isResizing, setIsResizing] = useState(false);
  const [chartsReady, setChartsReady] = useState(false);
  const chartStackRef = useRef<HTMLDivElement | null>(null);

  const assetOptions = deferredSelectableSeries.filter((item) => isAssetSeries(item));
  const macroOptions = deferredSelectableSeries.filter((item) => !isAssetSeries(item));
  const slotStateById = new Map(deferredSlots.map((slot) => [slot.id, slot] as const));

  const slotDescriptors: SlotDescriptor[] = deferredSlots.map((slot) => {
    const selectedSeries =
      deferredSelectableSeries.find((item) => item.key === slot.seriesKey) ?? null;
    const indicatorOptions = selectedSeries ? buildRsiScoreIndicators(selectedSeries) : [];
    const effectiveIndicatorKey =
      slot.indicatorKey === ""
        ? ""
        : indicatorOptions.some((item) => item.key === slot.indicatorKey)
          ? slot.indicatorKey
          : "";
    const selectedIndicator =
      indicatorOptions.find((item) => item.key === effectiveIndicatorKey) ?? null;

    return {
      id: slot.id,
      selectedSeries,
      indicatorOptions,
      effectiveIndicatorKey,
      selectedIndicator,
    };
  });

  const overlaySeries = dedupeSeriesByKey(
    slotDescriptors.flatMap((slot) => (slot.selectedSeries ? [slot.selectedSeries] : [])),
  );
  const indicatorSeries = dedupeSeriesByKey(
    slotDescriptors.flatMap((slot) => (slot.selectedIndicator ? [slot.selectedIndicator] : [])),
  );
  const overlayAxisModeByKey = new Map(
    slotDescriptors
      .map((slot) => {
        const slotState = slotStateById.get(slot.id);
        return slot.selectedSeries
          ? ([slot.selectedSeries.key, slotState?.overlayAxisMode ?? "linear"] as const)
          : null;
      })
      .filter((entry): entry is readonly [string, AxisMode] => entry !== null),
  );
  const indicatorAxisModeByKey = new Map(
    slotDescriptors
      .map((slot) => {
        const slotState = slotStateById.get(slot.id);
        return slot.selectedIndicator
          ? ([slot.selectedIndicator.key, slotState?.indicatorAxisMode ?? "linear"] as const)
          : null;
      })
      .filter((entry): entry is readonly [string, AxisMode] => entry !== null),
  );
  const overlaySeparateYAxisKeys = new Set(
    slotDescriptors
      .filter(
        (slot) =>
          slot.selectedSeries &&
          ((slotStateById.get(slot.id)?.overlaySeparateYAxis ?? false) ||
            (slotStateById.get(slot.id)?.overlayAxisMode ?? "linear") ===
              "log"),
      )
      .map((slot) => slot.selectedSeries?.key)
      .filter((key): key is string => !!key),
  );
  const indicatorSeparateYAxisKeys = new Set(
    slotDescriptors
      .filter(
        (slot) =>
          slot.selectedIndicator &&
          ((slotStateById.get(slot.id)?.indicatorSeparateYAxis ?? true) ||
            (slotStateById.get(slot.id)?.indicatorAxisMode ?? "linear") ===
              "log"),
      )
      .map((slot) => slot.selectedIndicator?.key)
      .filter((key): key is string => !!key),
  );

  useEffect(() => {
    const stored = parseStoredChartSplit(window.localStorage.getItem(CHART_SPLIT_STORAGE_KEY));
    if (stored === null) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setChartSplit(stored);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const stored = parseStoredXRangePreset(window.localStorage.getItem(CHART_X_RANGE_STORAGE_KEY));
    if (stored === null) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setXRangePreset(stored);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CHART_SPLIT_STORAGE_KEY, chartSplit.toFixed(3));
  }, [chartSplit]);

  useEffect(() => {
    window.localStorage.setItem(CHART_X_RANGE_STORAGE_KEY, xRangePreset);
  }, [xRangePreset]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setChartsReady(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    const handlePointerMove = (event: PointerEvent) => {
      const nextSplit = getChartSplitFromPointer(chartStackRef.current, event.clientY);
      if (nextSplit !== null) {
        setChartSplit(nextSplit);
      }
    };
    const stopResize = () => setIsResizing(false);

    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
    };
  }, [isResizing]);

  const overlayRows = buildDisplayRows(overlaySeries);
  const indicatorRows = buildDisplayRows(indicatorSeries);
  const sharedDateDomain = getSharedDateDomain([overlayRows, indicatorRows]) ?? FALLBACK_DATE_DOMAIN;
  const visibleDateDomain = getVisibleDateDomain(sharedDateDomain, xRangePreset);
  const indicatorMarkers = slotDescriptors
    .flatMap((slot) => {
      if (!slot.selectedSeries || !slot.selectedIndicator) {
        return [];
      }

      return buildRsiDivergenceMarkers(slot.selectedSeries, slot.selectedIndicator).map((marker) => ({
        key: marker.key,
        startDateTs: parseISO(marker.startDate).getTime(),
        startValue: marker.startValue,
        dateTs: parseISO(marker.date).getTime(),
        value: marker.value,
        color: marker.color,
        indicatorKey: marker.indicatorKey,
      }));
    })
    .filter((marker, index, list) => list.findIndex((item) => item.key === marker.key) === index);
  const topChartShare = Math.round(chartSplit * 100);
  const rootClassName = ["mx-auto w-full max-w-7xl min-h-0", className ?? ""].join(" ").trim();
  const extremes = findCorrelationExtremes(overlaySeries);

  return (
    <section className={rootClassName}>
      <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid shrink-0 gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
            Overlay Slots & RSI Score
          </p>
        </div>

        <div className="mt-2 grid shrink-0 gap-2 text-xs lg:grid-cols-3">
          <article className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-slate-700">
            <p className="font-medium text-slate-600">Konfiguration</p>
            <p className="mt-1">
              {overlaySeries.length} Reihen oben, {indicatorSeries.length} Indikatoren unten,{" "}
              {slotDescriptors.filter((slot) => slot.selectedSeries).length} von {SLOT_COUNT} Slots aktiv.
            </p>
          </article>

          <article className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-emerald-900">
            <p className="font-medium">Stärkste positive Overlay-Korrelation</p>
            <p className="mt-1">
              {extremes.mostPositive
                ? `${extremes.mostPositive.leftKey} vs ${extremes.mostPositive.rightKey} (${formatNumber(
                    extremes.mostPositive.value,
                    3,
                  )})`
                : "Keine robuste Korrelation"}
            </p>
          </article>

          <article className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-rose-900">
            <p className="font-medium">Stärkste inverse Overlay-Korrelation</p>
            <p className="mt-1">
              {extremes.mostNegative
                ? `${extremes.mostNegative.leftKey} vs ${extremes.mostNegative.rightKey} (${formatNumber(
                    extremes.mostNegative.value,
                    3,
                  )})`
                : "Keine robuste inverse Korrelation"}
            </p>
          </article>
        </div>

        <div className="mt-2 min-h-0 flex flex-1 gap-2">
          <aside className="w-[25rem] shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-2">
            <div className="border-b border-slate-200 px-1 pb-2">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_minmax(0,1fr)_auto_auto] items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Chart
                </p>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Y
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  L
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Indicator
                </p>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Y
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  L
                </span>
              </div>
            </div>

            <div className="mt-2 flex h-[calc(100%-3.25rem)] min-h-0 flex-col gap-2 overflow-y-auto pr-1">
              {slotDescriptors.map((slot) => (
                (() => {
                  const slotState = slotStateById.get(slot.id);
                  const overlayLogActive = (slotState?.overlayAxisMode ?? "linear") === "log";
                  const indicatorLogActive = (slotState?.indicatorAxisMode ?? "linear") === "log";
                  const overlaySeparateChecked =
                    (slotState?.overlaySeparateYAxis ?? false) || overlayLogActive;
                  const indicatorSeparateChecked =
                    (slotState?.indicatorSeparateYAxis ?? true) || indicatorLogActive;

                  return (
                    <div
                      key={slot.id}
                      className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
                    >
                      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_minmax(0,1fr)_auto_auto] items-center gap-2">
                    <label className="grid gap-1 min-w-0">
                      <select
                        value={slot.selectedSeries?.key ?? ""}
                        onChange={(event) => {
                          const nextSeriesKey = event.target.value;
                          const nextSeries =
                            deferredSelectableSeries.find((item) => item.key === nextSeriesKey) ??
                            null;

                          setSlots((current) =>
                            current.map((entry) =>
                              entry.id === slot.id
                                ? {
                                    ...entry,
                                    seriesKey: nextSeriesKey,
                                    indicatorKey: "",
                                    overlayAxisMode:
                                      nextSeries && canUseLogScale([nextSeries])
                                        ? entry.overlayAxisMode
                                        : "linear",
                                    indicatorAxisMode: "linear",
                                  }
                                : entry,
                            ),
                          );
                        }}
                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
                      >
                        <option value="">Keine Reihe</option>
                        <optgroup label="Assets">
                          {assetOptions.map((item) => (
                            <option key={item.key} value={item.key}>
                              {item.shortLabel}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Makro">
                          {macroOptions.map((item) => (
                            <option key={item.key} value={item.key}>
                              {item.shortLabel}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </label>
                    <label
                      className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-[11px] text-slate-600"
                      title={
                        overlayLogActive
                          ? "Aktiv, weil Log-Skala fuer diese Reihe eine eigene Y-Achse erzwingt"
                          : "Eigene Y-Achse fuer diese obere Reihe"
                      }
                    >
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 accent-slate-900"
                        checked={overlaySeparateChecked}
                        disabled={overlayLogActive}
                        onChange={(event) => {
                          const nextValue = event.target.checked;

                          setSlots((current) =>
                            current.map((entry) =>
                              entry.id === slot.id
                                ? {
                                    ...entry,
                                    overlaySeparateYAxis: nextValue,
                                  }
                                : entry,
                            ),
                          );
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className={`rounded-md border px-2 py-1.5 text-[11px] font-medium ${
                        overlayLogActive
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-700"
                      } ${
                        slot.selectedSeries && canUseLogScale([slot.selectedSeries])
                          ? ""
                          : "cursor-not-allowed opacity-50"
                      }`}
                      disabled={!slot.selectedSeries || !canUseLogScale([slot.selectedSeries])}
                      title="Logarithmische Skala fuer diese obere Reihe"
                      onClick={() => {
                        setSlots((current) =>
                          current.map((entry) =>
                            entry.id === slot.id
                              ? {
                                  ...entry,
                                  overlayAxisMode:
                                    entry.overlayAxisMode === "linear" ? "log" : "linear",
                                }
                              : entry,
                          ),
                        );
                      }}
                    >
                      L
                    </button>

                    <label className="grid gap-1 min-w-0">
                      <select
                        value={slot.effectiveIndicatorKey}
                        disabled={!slot.selectedSeries || slot.indicatorOptions.length === 0}
                        onChange={(event) => {
                          const nextIndicatorKey = event.target.value;
                          const nextIndicator =
                            slot.indicatorOptions.find((item) => item.key === nextIndicatorKey) ?? null;

                          setSlots((current) =>
                            current.map((entry) =>
                              entry.id === slot.id
                                ? {
                                    ...entry,
                                    indicatorKey: nextIndicatorKey,
                                    indicatorAxisMode:
                                      nextIndicator && canUseLogScale([nextIndicator])
                                        ? entry.indicatorAxisMode
                                        : "linear",
                                  }
                                : entry,
                            ),
                          );
                        }}
                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">Kein Indikator</option>
                        {slot.indicatorOptions.map((item) => (
                          <option key={item.key} value={item.key}>
                            {item.shortLabel}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label
                      className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-[11px] text-slate-600"
                      title={
                        indicatorLogActive
                          ? "Aktiv, weil Log-Skala fuer diesen Indikator eine eigene Y-Achse erzwingt"
                          : "Eigene Y-Achse fuer diesen Indikator"
                      }
                    >
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 accent-slate-900"
                        checked={indicatorSeparateChecked}
                        disabled={indicatorLogActive}
                        onChange={(event) => {
                          const nextValue = event.target.checked;

                          setSlots((current) =>
                            current.map((entry) =>
                              entry.id === slot.id
                                ? {
                                    ...entry,
                                    indicatorSeparateYAxis: nextValue,
                                  }
                                : entry,
                            ),
                          );
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className={`rounded-md border px-2 py-1.5 text-[11px] font-medium ${
                        indicatorLogActive
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-700"
                      } ${
                        slot.selectedIndicator && canUseLogScale([slot.selectedIndicator])
                          ? ""
                          : "cursor-not-allowed opacity-50"
                      }`}
                      disabled={!slot.selectedIndicator || !canUseLogScale([slot.selectedIndicator])}
                      title="Logarithmische Skala fuer diesen Indikator"
                      onClick={() => {
                        setSlots((current) =>
                          current.map((entry) =>
                            entry.id === slot.id
                              ? {
                                  ...entry,
                                  indicatorAxisMode:
                                    entry.indicatorAxisMode === "linear" ? "log" : "linear",
                                }
                              : entry,
                          ),
                        );
                      }}
                    >
                      L
                    </button>
                      </div>
                    </div>
                  );
                })()
              ))}
            </div>
          </aside>

          <div className="min-w-0 min-h-0 flex-1">
            <div
              ref={chartStackRef}
              className="grid h-full min-h-0"
              style={{
                gridTemplateRows: `minmax(220px, ${chartSplit.toFixed(3)}fr) auto minmax(180px, ${(1 - chartSplit).toFixed(3)}fr)`,
              }}
            >
              <div className="min-h-0">
                <ChartPanel
                  title="Oberer Chart"
                  subtitle="Hier werden die linken Dropdown-Auswahlen geplottet."
                  series={overlaySeries}
                  rows={overlayRows}
                  markers={[]}
                  xDomain={visibleDateDomain}
                  xRangePreset={xRangePreset}
                  onXRangeChange={setXRangePreset}
                  isReady={chartsReady}
                  axisModeByKey={overlayAxisModeByKey}
                  separateYAxisKeys={overlaySeparateYAxisKeys}
                  emptyMessage="Mindestens eine Reihe in einem linken Dropdown waehlen."
                />
              </div>

              <div
                role="separator"
                aria-label="Hohe zwischen oberem und unterem Chart anpassen"
                aria-orientation="horizontal"
                aria-valuemin={Math.round(MIN_CHART_SPLIT * 100)}
                aria-valuemax={Math.round(MAX_CHART_SPLIT * 100)}
                aria-valuenow={topChartShare}
                tabIndex={0}
                onPointerDown={(event) => {
                  event.preventDefault();
                  const nextSplit = getChartSplitFromPointer(chartStackRef.current, event.clientY);
                  if (nextSplit !== null) {
                    setChartSplit(nextSplit);
                  }
                  setIsResizing(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setChartSplit((current) => clampChartSplit(current - 0.03));
                  }
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setChartSplit((current) => clampChartSplit(current + 0.03));
                  }
                }}
                className={`group my-2 flex shrink-0 touch-none items-center outline-none ${
                  isResizing ? "cursor-row-resize" : "cursor-ns-resize"
                }`}
              >
                <div className="h-px flex-1 bg-slate-200" />
                <div className="mx-3 rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-600 shadow-sm transition group-focus-visible:border-slate-900 group-focus-visible:text-slate-900">
                  Split {topChartShare}% / {100 - topChartShare}%
                </div>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="min-h-0 min-w-0">
                <ChartPanel
                  title="Unterer Chart"
                  subtitle="Hier werden nur die rechten Indikator-Dropdowns geplottet."
                  series={indicatorSeries}
                  rows={indicatorRows}
                  markers={indicatorMarkers}
                  xDomain={visibleDateDomain}
                  xRangePreset={xRangePreset}
                  onXRangeChange={setXRangePreset}
                  isReady={chartsReady}
                  axisModeByKey={indicatorAxisModeByKey}
                  separateYAxisKeys={indicatorSeparateYAxisKeys}
                  emptyMessage="Mindestens einen Indikator in einem rechten Dropdown waehlen."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
