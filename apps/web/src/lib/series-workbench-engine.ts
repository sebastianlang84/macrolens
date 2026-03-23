import {
  buildCompanionIndicatorSeries,
  buildRsiDivergenceMarkers,
  buildRsiScoreIndicators,
  type DivergenceMarker,
} from "@/lib/series-analysis";
import type { MacroSeries } from "@/types/macro";

export type WorkbenchAxisMode = "linear" | "log";

export interface WorkbenchSelectionSlot {
  id: string;
  indicatorAxisMode: WorkbenchAxisMode;
  indicatorKey: string;
  indicatorSeparateYAxis: boolean;
  overlayAxisMode: WorkbenchAxisMode;
  overlaySeparateYAxis: boolean;
  seriesKey: string;
}

export interface WorkbenchSlotDescriptor {
  effectiveIndicatorKey: string;
  id: string;
  indicatorOptions: MacroSeries[];
  selectedIndicator: MacroSeries | null;
  selectedSeries: MacroSeries | null;
}

export interface WorkbenchEngineResult {
  companionSeriesKeysByIndicatorKey: Map<string, string[]>;
  indicatorMarkers: DivergenceMarker[];
  indicatorSeries: MacroSeries[];
  overlaySeries: MacroSeries[];
  slotDescriptors: WorkbenchSlotDescriptor[];
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

export function buildSeriesWorkbenchEngine(
  selectableSeries: MacroSeries[],
  slots: WorkbenchSelectionSlot[]
): WorkbenchEngineResult {
  const companionSeriesKeysByIndicatorKey = new Map<string, string[]>();
  const slotDescriptors: WorkbenchSlotDescriptor[] = slots.map((slot) => {
    const selectedSeries =
      selectableSeries.find((item) => item.key === slot.seriesKey) ?? null;
    const indicatorOptions = selectedSeries
      ? buildRsiScoreIndicators(selectedSeries)
      : [];
    const effectiveIndicatorKey =
      slot.indicatorKey !== "" &&
      indicatorOptions.some((item) => item.key === slot.indicatorKey)
        ? slot.indicatorKey
        : "";
    const selectedIndicator =
      indicatorOptions.find((item) => item.key === effectiveIndicatorKey) ??
      null;

    if (selectedSeries && selectedIndicator) {
      companionSeriesKeysByIndicatorKey.set(
        selectedIndicator.key,
        buildCompanionIndicatorSeries(selectedSeries, selectedIndicator).map(
          (series) => series.key
        )
      );
    }

    return {
      id: slot.id,
      selectedSeries,
      indicatorOptions,
      effectiveIndicatorKey,
      selectedIndicator,
    };
  });

  const overlaySeries = dedupeSeriesByKey(
    slotDescriptors.flatMap((slot) =>
      slot.selectedSeries ? [slot.selectedSeries] : []
    )
  );
  const indicatorSeries = dedupeSeriesByKey(
    slotDescriptors.flatMap((slot) => {
      if (!(slot.selectedSeries && slot.selectedIndicator)) {
        return [];
      }

      return [
        slot.selectedIndicator,
        ...buildCompanionIndicatorSeries(
          slot.selectedSeries,
          slot.selectedIndicator
        ),
      ];
    })
  );
  const indicatorMarkers = slotDescriptors
    .flatMap((slot) => {
      if (!(slot.selectedSeries && slot.selectedIndicator)) {
        return [];
      }

      return buildRsiDivergenceMarkers(
        slot.selectedSeries,
        slot.selectedIndicator
      );
    })
    .filter(
      (marker, index, list) =>
        list.findIndex((item) => item.key === marker.key) === index
    );

  return {
    slotDescriptors,
    overlaySeries,
    indicatorSeries,
    indicatorMarkers,
    companionSeriesKeysByIndicatorKey,
  };
}
