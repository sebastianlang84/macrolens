import { format, parseISO, subMonths, subYears } from "date-fns";
import { buildOverlayData, findCorrelationExtremes } from "@/lib/series-analysis";
import { formatNumber } from "@/lib/formatters";
import type { WorkbenchAxisMode, WorkbenchSlotDescriptor } from "@/lib/series-workbench-engine";
import type { XRangePreset } from "@/lib/use-series-workbench-session";
import type { MacroSeries } from "@/types/macro";

export type OverlayRow = {
  date: string;
  dateTs: number;
  dateLabel: string;
} & Record<string, number | string>;

export interface ChartMarker {
  color: string;
  dateTs: number;
  indicatorKey: string;
  key: string;
  startDateTs: number;
  startValue: number;
  value: number;
}

const FALLBACK_DATE_DOMAIN: [number, number] = [
  Date.UTC(2025, 0, 1),
  Date.UTC(2026, 0, 1),
];

export function buildDisplayRows(series: MacroSeries[]): OverlayRow[] {
  return buildOverlayData(series, "raw").map((row) => ({
    ...row,
    dateTs: parseISO(row.date).getTime(),
    dateLabel: format(parseISO(row.date), "MMM yy"),
  }));
}

export function formatChartAxisValue(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }
  return formatNumber(value, 1);
}

export function formatDateTick(value: unknown): string {
  return typeof value === "number" ? format(value, "MMM yy") : "";
}

function getSharedDateDomain(rows: OverlayRow[][]): [number, number] | null {
  const timestamps = rows
    .flatMap((entry) => entry.map((row) => row.dateTs))
    .filter(Number.isFinite);

  if (timestamps.length === 0) {
    return null;
  }

  return [Math.min(...timestamps), Math.max(...timestamps)];
}

function getVisibleDateDomain(
  domain: [number, number],
  preset: XRangePreset
): [number, number] {
  const [minTs, maxTs] = domain;

  if (preset === "max") {
    return domain;
  }

  const maxDate = new Date(maxTs);
  let startDate = subYears(maxDate, 2);
  if (preset === "3m") {
    startDate = subMonths(maxDate, 3);
  } else if (preset === "6m") {
    startDate = subMonths(maxDate, 6);
  } else if (preset === "1y") {
    startDate = subYears(maxDate, 1);
  }
  const startTs = Math.max(minTs, startDate.getTime());

  return [startTs, maxTs];
}

export function getPositiveMinForKey(
  rows: OverlayRow[],
  key: string
): number | null {
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

export function filterRowsToDomain(
  rows: OverlayRow[],
  domain: [number, number]
): OverlayRow[] {
  return rows.filter(
    (row) => row.dateTs >= domain[0] && row.dateTs <= domain[1]
  );
}

export function filterMarkersToDomain(
  markers: ChartMarker[],
  domain: [number, number]
): ChartMarker[] {
  return markers.filter(
    (marker) => marker.dateTs >= domain[0] && marker.dateTs <= domain[1]
  );
}

export interface SeriesWorkbenchProjectionInput {
  companionSeriesKeysByIndicatorKey: Map<string, string[]>;
  indicatorMarkers: Array<{
    color: string;
    date: string;
    indicatorKey: string;
    key: string;
    startDate: string;
    startValue: number;
    value: number;
  }>;
  indicatorSeries: MacroSeries[];
  overlaySeries: MacroSeries[];
  slotDescriptors: WorkbenchSlotDescriptor[];
  slotStateById: Map<
    string,
    {
      indicatorAxisMode: WorkbenchAxisMode;
      indicatorSeparateYAxis: boolean;
      overlayAxisMode: WorkbenchAxisMode;
      overlaySeparateYAxis: boolean;
    }
  >;
  xRangePreset: XRangePreset;
}

export interface SeriesWorkbenchProjection {
  chartMarkers: ChartMarker[];
  extremes: ReturnType<typeof findCorrelationExtremes>;
  indicatorAxisModeByKey: Map<string, WorkbenchAxisMode>;
  indicatorRows: OverlayRow[];
  indicatorSeparateYAxisKeys: Set<string>;
  overlayAxisModeByKey: Map<string, WorkbenchAxisMode>;
  overlayRows: OverlayRow[];
  overlaySeparateYAxisKeys: Set<string>;
  visibleDateDomain: [number, number];
}

export function buildSeriesWorkbenchProjection({
  companionSeriesKeysByIndicatorKey,
  indicatorMarkers,
  indicatorSeries,
  overlaySeries,
  slotDescriptors,
  slotStateById,
  xRangePreset,
}: SeriesWorkbenchProjectionInput): SeriesWorkbenchProjection {
  const overlayAxisModeByKey = new Map(
    slotDescriptors
      .map((slot) => {
        const slotState = slotStateById.get(slot.id);
        return slot.selectedSeries
          ? ([
              slot.selectedSeries.key,
              slotState?.overlayAxisMode ?? "linear",
            ] as const)
          : null;
      })
      .filter(
        (entry): entry is readonly [string, WorkbenchAxisMode] => entry !== null
      )
  );
  const indicatorAxisModeByKey = new Map(
    slotDescriptors.flatMap((slot) => {
      const slotState = slotStateById.get(slot.id);
      if (!(slot.selectedSeries && slot.selectedIndicator)) {
        return [];
      }

      const axisMode = slotState?.indicatorAxisMode ?? "linear";
      return [
        [slot.selectedIndicator.key, axisMode] as const,
        ...(companionSeriesKeysByIndicatorKey.get(slot.selectedIndicator.key) ??
          []
        ).map((seriesKey) => [seriesKey, axisMode] as const),
      ];
    })
  );
  const overlaySeparateYAxisKeys = new Set(
    slotDescriptors
      .filter(
        (slot) =>
          slot.selectedSeries &&
          ((slotStateById.get(slot.id)?.overlaySeparateYAxis ?? false) ||
            (slotStateById.get(slot.id)?.overlayAxisMode ?? "linear") === "log")
      )
      .map((slot) => slot.selectedSeries?.key)
      .filter((key): key is string => !!key)
  );
  const indicatorSeparateYAxisKeys = new Set(
    slotDescriptors.flatMap((slot) => {
      if (!(slot.selectedSeries && slot.selectedIndicator)) {
        return [];
      }

      const slotState = slotStateById.get(slot.id);
      const shouldSeparate =
        (slotState?.indicatorSeparateYAxis ?? true) ||
        (slotState?.indicatorAxisMode ?? "linear") === "log";

      if (!shouldSeparate) {
        return [];
      }

      return [
        slot.selectedIndicator.key,
        ...(companionSeriesKeysByIndicatorKey.get(slot.selectedIndicator.key) ??
          []),
      ];
    })
  );
  const overlayRows = buildDisplayRows(overlaySeries);
  const indicatorRows = buildDisplayRows(indicatorSeries);
  const sharedDateDomain =
    getSharedDateDomain([overlayRows, indicatorRows]) ?? FALLBACK_DATE_DOMAIN;
  const visibleDateDomain = getVisibleDateDomain(
    sharedDateDomain,
    xRangePreset
  );
  const chartMarkers = indicatorMarkers.map((marker) => ({
    key: marker.key,
    startDateTs: parseISO(marker.startDate).getTime(),
    startValue: marker.startValue,
    dateTs: parseISO(marker.date).getTime(),
    value: marker.value,
    color: marker.color,
    indicatorKey: marker.indicatorKey,
  }));

  return {
    chartMarkers,
    extremes: findCorrelationExtremes(overlaySeries),
    indicatorAxisModeByKey,
    indicatorRows,
    indicatorSeparateYAxisKeys,
    overlayAxisModeByKey,
    overlayRows,
    overlaySeparateYAxisKeys,
    visibleDateDomain,
  };
}
