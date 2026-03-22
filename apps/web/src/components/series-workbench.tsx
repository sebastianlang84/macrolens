"use client";

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
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
  buildSeriesWorkbenchProjection,
  filterMarkersToDomain,
  filterRowsToDomain,
  formatChartAxisValue,
  formatDateTick,
  getPositiveMinForKey,
  type ChartMarker,
  type OverlayRow,
} from "@/lib/series-workbench-chart";
import {
  buildSeriesWorkbenchEngine,
  type WorkbenchAxisMode,
  type WorkbenchSelectionSlot,
  type WorkbenchSlotDescriptor,
} from "@/lib/series-workbench-engine";
import {
  SERIES_WORKBENCH_SLOT_COUNT,
  useSeriesWorkbenchSession,
  type ChartInterval,
  type XRangePreset,
} from "@/lib/use-series-workbench-session";
import { isAssetSeries } from "@/lib/series-analysis";
import type { MacroSeries } from "@/types/macro";

interface Props {
  className?: string;
  series: MacroSeries[];
}

interface ChartPanelProps {
  axisModeByKey: Map<string, AxisMode>;
  emptyMessage: string;
  isReady: boolean;
  markers?: ChartMarker[];
  rows: OverlayRow[];
  separateYAxisKeys: Set<string>;
  series: MacroSeries[];
  subtitle: string;
  title: string;
  xDomain: [number, number];
}

interface HoverSnapshot {
  dateLabel: string;
  items: Array<{
    key: string;
    label: string;
    value: number;
    color: string;
  }>;
}

interface SelectionSlotRowProps {
  assetOptions: MacroSeries[];
  deferredSelectableSeries: MacroSeries[];
  macroOptions: MacroSeries[];
  setSlots: Dispatch<SetStateAction<WorkbenchSelectionSlot[]>>;
  slot: WorkbenchSlotDescriptor;
  slotStateById: Map<string, WorkbenchSelectionSlot>;
}

type AxisMode = WorkbenchAxisMode;
const CHART_SYNC_ID = "macrolens-workbench-sync";
const X_RANGE_OPTIONS: Array<{ value: XRangePreset; label: string }> = [
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "2y", label: "2Y" },
  { value: "max", label: "Max" },
];
const CHART_INTERVAL_OPTIONS: Array<{
  value: ChartInterval;
  label: string;
}> = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

function canUseLogScale(series: MacroSeries[]): boolean {
  if (series.length === 0) {
    return false;
  }

  return series.every(
    (item) =>
      item.points.length > 0 &&
      item.points.every(
        (point) => Number.isFinite(point.value) && point.value > 0
      )
  );
}

function updateSlot(
  setSlots: Dispatch<SetStateAction<WorkbenchSelectionSlot[]>>,
  slotId: string,
  updater: (entry: WorkbenchSelectionSlot) => WorkbenchSelectionSlot
): void {
  setSlots((current) =>
    current.map((entry) => (entry.id === slotId ? updater(entry) : entry))
  );
}

function buildAxisButtonClass(isActive: boolean, isEnabled: boolean): string {
  return `rounded-md border px-2 py-1.5 font-medium text-[11px] ${
    isActive
      ? "border-slate-900 bg-slate-900 text-white"
      : "border-slate-300 bg-white text-slate-700"
  } ${isEnabled ? "" : "cursor-not-allowed opacity-50"}`;
}

function renderChartPlaceholder(message: string) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-slate-300 border-dashed bg-white text-slate-500 text-sm">
      {message}
    </div>
  );
}

function renderSeparateYAxis(
  item: MacroSeries,
  idx: number,
  title: string,
  sharedSeriesLength: number,
  visibleRows: OverlayRow[],
  axisModeByKey: Map<string, AxisMode>
) {
  const axisMode = axisModeByKey.get(item.key) ?? "linear";
  const axisScale = axisMode === "log" ? "log" : "linear";
  const axisDomain =
    axisScale === "log"
      ? ([getPositiveMinForKey(visibleRows, item.key) ?? 1, "auto"] as const)
      : (["auto", "auto"] as const);
  const showTicks = sharedSeriesLength === 0 && idx === 0;

  return (
    <YAxis
      allowDataOverflow={axisScale === "log"}
      axisLine={false}
      domain={axisDomain}
      key={`y-${title}-${item.key}`}
      scale={axisScale}
      tick={showTicks ? { fontSize: 11, fill: "#64748b" } : false}
      tickFormatter={(value: number) => formatChartAxisValue(value)}
      tickLine={false}
      width={showTicks ? 58 : 0}
      yAxisId={item.key}
    />
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
      key:
        typeof entry.dataKey === "string"
          ? entry.dataKey
          : String(entry.name ?? "series"),
      label:
        typeof entry.name === "string"
          ? entry.name
          : String(entry.dataKey ?? "Serie"),
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
  isReady,
  axisModeByKey,
  separateYAxisKeys,
  emptyMessage,
}: ChartPanelProps) {
  const [hoverSnapshot, setHoverSnapshot] = useState<HoverSnapshot | null>(
    null
  );
  const visibleRows = filterRowsToDomain(rows, xDomain);
  const visibleMarkers = filterMarkersToDomain(markers, xDomain);
  const sharedSeries = series.filter((item) => {
    const axisMode = axisModeByKey.get(item.key) ?? "linear";
    return axisMode === "linear" && !separateYAxisKeys.has(item.key);
  });
  const separateSeries = series.filter(
    (item) => !sharedSeries.some((shared) => shared.key === item.key)
  );
  let chartContent = renderChartPlaceholder("Chart wird initialisiert...");

  if (isReady) {
    if (visibleRows.length > 0 && series.length > 0) {
      chartContent = (
        <div className="flex h-full min-h-0 flex-col">
          <div className="min-h-0 flex-1">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart
                data={visibleRows}
                margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
                onMouseLeave={() => {
                  setHoverSnapshot(null);
                }}
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
                    })
                  );
                }}
                syncId={CHART_SYNC_ID}
                syncMethod="value"
              >
                <CartesianGrid stroke="#dbe3ee" strokeDasharray="3 3" />
                <XAxis
                  axisLine={false}
                  dataKey="dateTs"
                  domain={xDomain}
                  minTickGap={20}
                  scale="time"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(value) => formatDateTick(value)}
                  tickLine={false}
                  type="number"
                />
                <YAxis
                  axisLine={false}
                  domain={["auto", "auto"]}
                  hide={sharedSeries.length === 0}
                  scale="linear"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(value: number) => formatChartAxisValue(value)}
                  tickLine={false}
                  width={58}
                  yAxisId="shared"
                />
                {separateSeries.map((item, idx) =>
                  renderSeparateYAxis(
                    item,
                    idx,
                    title,
                    sharedSeries.length,
                    visibleRows,
                    axisModeByKey
                  )
                )}
                <Tooltip
                  content={() => null}
                  cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                {series.map((item) => (
                  <Line
                    connectNulls
                    dataKey={item.key}
                    dot={false}
                    isAnimationActive={false}
                    key={`${title}-${item.key}`}
                    name={item.shortLabel}
                    stroke={item.color}
                    strokeDasharray={
                      item.key.startsWith("rsi-scorew:") ? "6 4" : undefined
                    }
                    strokeWidth={2}
                    type="monotone"
                    yAxisId={
                      separateYAxisKeys.has(item.key) ? item.key : "shared"
                    }
                  />
                ))}
                {visibleMarkers.map((marker) => (
                  <ReferenceLine
                    ifOverflow="extendDomain"
                    key={`segment-${marker.key}`}
                    segment={[
                      { x: marker.startDateTs, y: marker.startValue },
                      { x: marker.dateTs, y: marker.value },
                    ]}
                    stroke={marker.color}
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    yAxisId={
                      separateYAxisKeys.has(marker.indicatorKey)
                        ? marker.indicatorKey
                        : "shared"
                    }
                  />
                ))}
                {visibleMarkers.map((marker) => (
                  <ReferenceDot
                    fill="#ffffff"
                    ifOverflow="extendDomain"
                    key={marker.key}
                    r={4}
                    stroke={marker.color}
                    strokeWidth={2}
                    x={marker.dateTs}
                    y={marker.value}
                    yAxisId={
                      separateYAxisKeys.has(marker.indicatorKey)
                        ? marker.indicatorKey
                        : "shared"
                    }
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-1 flex min-h-[2.75rem] items-end justify-end">
            {hoverSnapshot ? (
              <div className="max-w-full rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-right shadow-sm">
                <p className="font-semibold text-slate-500 text-xs">
                  {hoverSnapshot.dateLabel}
                </p>
                {hoverSnapshot.items.map((item) => (
                  <p className="mt-0.5 text-xs" key={item.key}>
                    <span className="font-medium" style={{ color: item.color }}>
                      {item.label}
                    </span>
                    <span className="text-slate-600">
                      {" "}
                      : {formatNumber(item.value, 2)}
                    </span>
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      );
    } else {
      chartContent = renderChartPlaceholder(
        series.length > 0 ? "Keine Daten im aktuellen X-Fenster." : emptyMessage
      );
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-[11px] text-slate-500 uppercase tracking-[0.12em]">
              {title}
            </p>
            <p className="mt-1 text-slate-600 text-xs">{subtitle}</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600">
            {series.length} Serien
          </span>
        </div>
      </div>

      <div
        aria-label={`${title}: ${subtitle}`}
        className="mt-2 min-h-0 flex-1"
        role="img"
      >
        {chartContent}
      </div>
    </section>
  );
}

function SelectionSlotRow({
  assetOptions,
  deferredSelectableSeries,
  macroOptions,
  setSlots,
  slot,
  slotStateById,
}: SelectionSlotRowProps) {
  const slotIsActive = Boolean(slot.selectedSeries || slot.selectedIndicator);
  const slotState = slotStateById.get(slot.id);
  const overlayLogActive = (slotState?.overlayAxisMode ?? "linear") === "log";
  const indicatorLogActive =
    (slotState?.indicatorAxisMode ?? "linear") === "log";
  const overlaySeparateChecked =
    (slotState?.overlaySeparateYAxis ?? false) || overlayLogActive;
  const indicatorSeparateChecked =
    (slotState?.indicatorSeparateYAxis ?? true) || indicatorLogActive;
  const overlayLogAllowed = Boolean(
    slot.selectedSeries && canUseLogScale([slot.selectedSeries])
  );
  const indicatorLogAllowed = Boolean(
    slot.selectedIndicator && canUseLogScale([slot.selectedIndicator])
  );
  const slotLabel = slot.id.replace("slot-", "Slot ");
  const seriesLabel = slot.selectedSeries?.shortLabel ?? "keine Reihe";
  const indicatorLabel = slot.selectedIndicator?.shortLabel ?? "kein Indikator";
  const overlayYAxisLabel = `${slotLabel}: Eigene Y-Achse fuer obere Reihe ${seriesLabel}`;
  const overlayLogLabel = `${slotLabel}: Logarithmische Skala fuer obere Reihe ${seriesLabel}`;
  const indicatorYAxisLabel = `${slotLabel}: Eigene Y-Achse fuer Indikator ${indicatorLabel}`;
  const indicatorLogLabel = `${slotLabel}: Logarithmische Skala fuer Indikator ${indicatorLabel}`;

  return (
    <div
      className={`rounded-lg border p-2 shadow-sm transition ${
        slotIsActive
          ? "border-slate-200 bg-white"
          : "border-slate-100 bg-slate-50/70"
      }`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_minmax(0,1fr)_auto_auto] items-center gap-2">
        <label className="grid min-w-0 gap-1">
          <select
            className={`w-full rounded-md border px-2 py-1.5 text-xs ${
              slotIsActive
                ? "border-slate-300 bg-white text-slate-800"
                : "border-slate-200 bg-white/80 text-slate-600"
            }`}
            onChange={(event) => {
              const nextSeriesKey = event.target.value;
              const nextSeries =
                deferredSelectableSeries.find(
                  (item) => item.key === nextSeriesKey
                ) ?? null;

              updateSlot(setSlots, slot.id, (entry) => ({
                ...entry,
                seriesKey: nextSeriesKey,
                indicatorKey: "",
                overlayAxisMode:
                  nextSeries && canUseLogScale([nextSeries])
                    ? entry.overlayAxisMode
                    : "linear",
                indicatorAxisMode: "linear",
              }));
            }}
            value={slot.selectedSeries?.key ?? ""}
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
          className={`inline-flex items-center justify-center rounded-md border px-2 py-1.5 text-[11px] ${
            slotIsActive
              ? "border-slate-300 bg-slate-50 text-slate-600"
              : "border-slate-200 bg-white/70 text-slate-400"
          }`}
          title={
            overlayLogActive
              ? "Aktiv, weil Log-Skala fuer diese Reihe eine eigene Y-Achse erzwingt"
              : "Eigene Y-Achse fuer diese obere Reihe"
          }
        >
          <input
            checked={overlaySeparateChecked}
            className="h-3.5 w-3.5 accent-slate-900"
            disabled={overlayLogActive}
            aria-label={overlayYAxisLabel}
            onChange={(event) => {
              updateSlot(setSlots, slot.id, (entry) => ({
                ...entry,
                overlaySeparateYAxis: event.target.checked,
              }));
            }}
            type="checkbox"
          />
        </label>
        <button
          className={buildAxisButtonClass(overlayLogActive, overlayLogAllowed)}
          disabled={!overlayLogAllowed}
          onClick={() => {
            updateSlot(setSlots, slot.id, (entry) => ({
              ...entry,
              overlayAxisMode:
                entry.overlayAxisMode === "linear" ? "log" : "linear",
            }));
          }}
          aria-label={overlayLogLabel}
          title="Logarithmische Skala fuer diese obere Reihe"
          type="button"
        >
          L
        </button>

        <label className="grid min-w-0 gap-1">
          <select
            className={`w-full rounded-md border px-2 py-1.5 text-xs disabled:text-slate-400 ${
              slotIsActive
                ? "border-slate-300 bg-white text-slate-800 disabled:bg-slate-100"
                : "border-slate-200 bg-white/80 text-slate-500 disabled:bg-white/60"
            }`}
            disabled={
              !slot.selectedSeries || slot.indicatorOptions.length === 0
            }
            onChange={(event) => {
              const nextIndicatorKey = event.target.value;
              const nextIndicator =
                slot.indicatorOptions.find(
                  (item) => item.key === nextIndicatorKey
                ) ?? null;

              updateSlot(setSlots, slot.id, (entry) => ({
                ...entry,
                indicatorKey: nextIndicatorKey,
                indicatorAxisMode:
                  nextIndicator && canUseLogScale([nextIndicator])
                    ? entry.indicatorAxisMode
                    : "linear",
              }));
            }}
            value={slot.effectiveIndicatorKey}
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
          className={`inline-flex items-center justify-center rounded-md border px-2 py-1.5 text-[11px] ${
            slotIsActive
              ? "border-slate-300 bg-slate-50 text-slate-600"
              : "border-slate-200 bg-white/70 text-slate-400"
          }`}
          title={
            indicatorLogActive
              ? "Aktiv, weil Log-Skala fuer diesen Indikator eine eigene Y-Achse erzwingt"
              : "Eigene Y-Achse fuer diesen Indikator"
          }
        >
          <input
            checked={indicatorSeparateChecked}
            className="h-3.5 w-3.5 accent-slate-900"
            disabled={indicatorLogActive}
            aria-label={indicatorYAxisLabel}
            onChange={(event) => {
              updateSlot(setSlots, slot.id, (entry) => ({
                ...entry,
                indicatorSeparateYAxis: event.target.checked,
              }));
            }}
            type="checkbox"
          />
        </label>
        <button
          className={buildAxisButtonClass(
            indicatorLogActive,
            indicatorLogAllowed
          )}
          disabled={!indicatorLogAllowed}
          onClick={() => {
            updateSlot(setSlots, slot.id, (entry) => ({
              ...entry,
              indicatorAxisMode:
                entry.indicatorAxisMode === "linear" ? "log" : "linear",
            }));
          }}
          aria-label={indicatorLogLabel}
          title="Logarithmische Skala fuer diesen Indikator"
          type="button"
        >
          L
        </button>
      </div>
    </div>
  );
}

export function SeriesWorkbench({ series, className }: Props) {
  const selectableSeries = series.filter((item) => item.points.length > 2);
  const {
    beginResize,
    chartInterval,
    chartSplit,
    chartStackRef,
    chartsReady,
    deferredSelectableSeries,
    deferredSlots,
    isResizing,
    nudgeChartSplit,
    setSlots,
    setChartInterval,
    setXRangePreset,
    xRangePreset,
  } = useSeriesWorkbenchSession(selectableSeries);

  const assetOptions = deferredSelectableSeries.filter((item) =>
    isAssetSeries(item)
  );
  const macroOptions = deferredSelectableSeries.filter(
    (item) => !isAssetSeries(item)
  );
  const slotStateById = new Map(
    deferredSlots.map((slot) => [slot.id, slot] as const)
  );
  const {
    companionSeriesKeysByIndicatorKey,
    slotDescriptors,
    overlaySeries,
    indicatorSeries,
    indicatorMarkers,
  } = buildSeriesWorkbenchEngine(deferredSelectableSeries, deferredSlots);
  const {
    chartMarkers,
    extremes,
    indicatorAxisModeByKey,
    indicatorRows,
    indicatorSeparateYAxisKeys,
    overlayAxisModeByKey,
    overlayRows,
    overlaySeparateYAxisKeys,
    visibleDateDomain,
  } = buildSeriesWorkbenchProjection({
    chartInterval,
    companionSeriesKeysByIndicatorKey,
    indicatorMarkers,
    indicatorSeries,
    overlaySeries,
    slotDescriptors,
    slotStateById,
    xRangePreset,
  });
  const activeSlotDescriptors = slotDescriptors.filter(
    (slot) => slot.selectedSeries || slot.selectedIndicator
  );
  const nextEmptySlot = slotDescriptors.find(
    (slot) => !(slot.selectedSeries || slot.selectedIndicator)
  );
  const visibleSlotDescriptors =
    activeSlotDescriptors.length > 0
      ? nextEmptySlot
        ? [...activeSlotDescriptors, nextEmptySlot]
        : activeSlotDescriptors
      : nextEmptySlot
        ? [nextEmptySlot]
        : [];
  const hiddenSlotCount = Math.max(
    0,
    SERIES_WORKBENCH_SLOT_COUNT - visibleSlotDescriptors.length
  );
  const topChartShare = Math.round(chartSplit * 100);
  const rootClassName = ["mx-auto w-full max-w-7xl min-h-0", className ?? ""]
    .join(" ")
    .trim();

  return (
    <section className={rootClassName}>
      <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid shrink-0 gap-2">
          <p className="font-semibold text-slate-600 text-xs uppercase tracking-[0.12em]">
            Overlay Slots & RSI Score
          </p>
        </div>

        <div className="mt-2 grid shrink-0 gap-2 text-xs lg:grid-cols-3">
          <article className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-slate-700">
            <p className="font-medium text-slate-600">Konfiguration</p>
            <p className="mt-1">
              {overlaySeries.length} Reihen oben, {indicatorSeries.length}{" "}
              Indikatoren unten,{" "}
              {slotDescriptors.filter((slot) => slot.selectedSeries).length} von{" "}
              {SERIES_WORKBENCH_SLOT_COUNT} Slots aktiv.
            </p>
          </article>

          <article className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-emerald-900">
            <p className="font-medium">Stärkste positive Overlay-Korrelation</p>
            <p className="mt-1">
              {extremes.mostPositive
                ? `${extremes.mostPositive.leftKey} vs ${extremes.mostPositive.rightKey} (${formatNumber(
                    extremes.mostPositive.value,
                    3
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
                    3
                  )})`
                : "Keine robuste inverse Korrelation"}
            </p>
          </article>
        </div>

        <div className="mt-2 flex min-h-0 flex-1 flex-col gap-2">
          <aside className="w-full shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-2">
            <div className="border-slate-200 border-b px-1 pb-2">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_minmax(0,1fr)_auto_auto] items-center gap-2">
                <p className="font-semibold text-[11px] text-slate-500 uppercase tracking-[0.12em]">
                  Chart
                </p>
                <span className="font-semibold text-[11px] text-slate-400 uppercase tracking-[0.12em]">
                  Y
                </span>
                <span className="font-semibold text-[11px] text-slate-400 uppercase tracking-[0.12em]">
                  L
                </span>
                <p className="font-semibold text-[11px] text-slate-500 uppercase tracking-[0.12em]">
                  Indicator
                </p>
                <span className="font-semibold text-[11px] text-slate-400 uppercase tracking-[0.12em]">
                  Y
                </span>
                <span className="font-semibold text-[11px] text-slate-400 uppercase tracking-[0.12em]">
                  L
                </span>
              </div>
            </div>

            <div className="mt-2 flex max-h-[24rem] flex-col gap-1.5 overflow-y-auto pr-1">
              {visibleSlotDescriptors.map((slot) => (
                <SelectionSlotRow
                  assetOptions={assetOptions}
                  deferredSelectableSeries={deferredSelectableSeries}
                  key={slot.id}
                  macroOptions={macroOptions}
                  setSlots={setSlots}
                  slot={slot}
                  slotStateById={slotStateById}
                />
              ))}

              {hiddenSlotCount > 0 ? (
                <p className="px-1 pt-1 text-[11px] text-slate-400">
                  {hiddenSlotCount} leere Slots ausgeblendet.
                </p>
              ) : null}
            </div>
          </aside>

          <div className="min-h-0 min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div>
                <p className="font-semibold text-[11px] text-slate-500 uppercase tracking-[0.12em]">
                  Chart Ansicht
                </p>
                <p className="mt-1 text-slate-600 text-xs">
                  Zeitraum und Intervall gelten fuer beide Charts.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="inline-flex rounded-full border border-slate-200 bg-white p-0.5">
                  {CHART_INTERVAL_OPTIONS.map((option) => (
                    <button
                      aria-pressed={option.value === chartInterval}
                      className={`rounded-full px-2.5 py-1 font-medium text-[11px] transition ${
                        option.value === chartInterval
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                      key={`chart-interval-${option.value}`}
                      onClick={() => setChartInterval(option.value)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="inline-flex rounded-full border border-slate-200 bg-white p-0.5">
                  {X_RANGE_OPTIONS.map((option) => (
                    <button
                      aria-pressed={option.value === xRangePreset}
                      className={`rounded-full px-2.5 py-1 font-medium text-[11px] transition ${
                        option.value === xRangePreset
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                      key={`chart-range-${option.value}`}
                      onClick={() => setXRangePreset(option.value)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="grid min-h-[44rem] gap-2 lg:h-full lg:min-h-0 lg:gap-0"
              ref={chartStackRef}
              style={{
                gridTemplateRows: `minmax(220px, ${chartSplit.toFixed(3)}fr) auto minmax(180px, ${(1 - chartSplit).toFixed(3)}fr)`,
              }}
            >
              <div className="min-h-0">
                <ChartPanel
                  axisModeByKey={overlayAxisModeByKey}
                  emptyMessage="Mindestens eine Reihe in einem linken Dropdown waehlen."
                  isReady={chartsReady}
                  markers={[]}
                  rows={overlayRows}
                  separateYAxisKeys={overlaySeparateYAxisKeys}
                  series={overlaySeries}
                  subtitle="Hier werden die linken Dropdown-Auswahlen geplottet."
                  title="Oberer Chart"
                  xDomain={visibleDateDomain}
                />
              </div>

              <button
                aria-label="Hohe zwischen oberem und unterem Chart anpassen"
                className={`group my-2 hidden shrink-0 touch-none items-center outline-none lg:flex ${
                  isResizing ? "cursor-row-resize" : "cursor-ns-resize"
                }`}
                onKeyDown={(event) => {
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    nudgeChartSplit(-0.03);
                  }
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    nudgeChartSplit(0.03);
                  }
                }}
                onPointerDown={(event) => {
                  event.preventDefault();
                  beginResize(event.clientY);
                }}
                type="button"
              >
                <div className="h-px flex-1 bg-slate-200" />
                <div className="mx-3 rounded-full border border-slate-300 bg-white px-3 py-1 font-medium text-[11px] text-slate-600 shadow-sm transition group-focus-visible:border-slate-900 group-focus-visible:text-slate-900">
                  Split {topChartShare}% / {100 - topChartShare}%
                </div>
                <div className="h-px flex-1 bg-slate-200" />
              </button>

              <div className="min-h-0 min-w-0">
                <ChartPanel
                  axisModeByKey={indicatorAxisModeByKey}
                  emptyMessage="Mindestens einen Indikator in einem rechten Dropdown waehlen."
                  isReady={chartsReady}
                  markers={chartMarkers}
                  rows={indicatorRows}
                  separateYAxisKeys={indicatorSeparateYAxisKeys}
                  series={indicatorSeries}
                  subtitle="Hier werden nur die rechten Indikator-Dropdowns geplottet."
                  title="Unterer Chart"
                  xDomain={visibleDateDomain}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
