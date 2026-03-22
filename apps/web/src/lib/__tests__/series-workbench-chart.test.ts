import { addDays, formatISO } from "date-fns";
import { describe, expect, it } from "vitest";
import {
  buildSeriesWorkbenchProjection,
  formatChartAxisValue,
} from "@/lib/series-workbench-chart";
import type { WorkbenchSelectionSlot, WorkbenchSlotDescriptor } from "@/lib/series-workbench-engine";
import type { CandlePoint, MacroSeries } from "@/types/macro";

function makeSeries(
  key: string,
  values: number[],
  candles?: CandlePoint[],
  dates?: string[]
): MacroSeries {
  const pointDates =
    dates ??
    candles?.map((candle) => candle.date) ??
    values.map((_, idx) =>
      formatISO(addDays(new Date("2026-01-05T00:00:00Z"), idx), {
        representation: "date",
      })
    );

  return {
    key,
    label: key,
    shortLabel: key,
    source: "yahoo",
    unit: "index",
    description: `${key} series`,
    color: "#000000",
    points: values.map((value, idx) => ({
      date: pointDates[idx],
      value,
    })),
    stats: {
      latestValue: values.at(-1) ?? null,
      change1mPct: null,
      change3mPct: null,
      change1yPct: null,
    },
    candles,
  };
}

function makeDailyCandles(
  startDate: string,
  entries: Array<{ close: number; high?: number; low?: number }>
): CandlePoint[] {
  return entries.map((entry, idx) => {
    const close = entry.close;
    return {
      date: formatISO(addDays(new Date(`${startDate}T00:00:00Z`), idx), {
        representation: "date",
      }),
      open: close,
      high: entry.high ?? close,
      low: entry.low ?? close,
      close,
    };
  });
}

function makeSlot(
  id: string,
  seriesKey: string,
  indicatorKey = ""
): WorkbenchSelectionSlot {
  return {
    id,
    seriesKey,
    indicatorKey,
    overlaySeparateYAxis: false,
    indicatorSeparateYAxis: true,
    overlayAxisMode: "linear",
    indicatorAxisMode: "linear",
  };
}

function makeDescriptor(
  slot: WorkbenchSelectionSlot,
  selectedSeries: MacroSeries | null,
  selectedIndicator: MacroSeries | null = null
): WorkbenchSlotDescriptor {
  return {
    id: slot.id,
    effectiveIndicatorKey: selectedIndicator?.key ?? "",
    indicatorOptions: selectedIndicator ? [selectedIndicator] : [],
    selectedIndicator,
    selectedSeries,
  };
}

describe("series-workbench-chart", () => {
  it("formats four-digit axis ticks without collapsing distinct values to the same label", () => {
    expect(formatChartAxisValue(6900)).toBe("6,9k");
    expect(formatChartAxisValue(7000)).toBe("7k");
    expect(formatChartAxisValue(7100)).toBe("7,1k");
  });

  it("aggregates candle-backed overlay series to weekly rows while preserving keys", () => {
    const candles = makeDailyCandles("2026-01-05", [
      { close: 100, high: 101, low: 99 },
      { close: 102, high: 103, low: 100 },
      { close: 101, high: 104, low: 98 },
      { close: 103, high: 105, low: 101 },
      { close: 104, high: 106, low: 102 },
      { close: 105, high: 108, low: 104 },
      { close: 107, high: 109, low: 103 },
      { close: 108, high: 110, low: 107 },
    ]);
    const base = makeSeries(
      "sp500",
      candles.map((candle) => candle.close),
      candles
    );
    const slot = makeSlot("slot-1", "sp500");

    const projection = buildSeriesWorkbenchProjection({
      chartInterval: "weekly",
      companionSeriesKeysByIndicatorKey: new Map(),
      indicatorMarkers: [],
      indicatorSeries: [],
      overlaySeries: [base],
      slotDescriptors: [makeDescriptor(slot, base)],
      slotStateById: new Map([[slot.id, slot]]),
      xRangePreset: "max",
    });

    expect(projection.overlayRows).toHaveLength(2);
    expect(projection.overlayRows[0]?.date).toBe("2026-01-05");
    expect(projection.overlayRows[0]?.sp500).toBe(107);
    expect(projection.overlayRows[1]?.date).toBe("2026-01-12");
    expect(projection.overlayRows[1]?.sp500).toBe(108);
    expect(projection.overlayAxisModeByKey.get("sp500")).toBe("linear");
  });

  it("keeps non-candle macro overlay rows untouched in weekly mode", () => {
    const macro = makeSeries(
      "core_pce_mom",
      [2.4, 2.5],
      undefined,
      ["2026-01-31", "2026-02-28"]
    );
    const slot = makeSlot("slot-1", "core_pce_mom");

    const projection = buildSeriesWorkbenchProjection({
      chartInterval: "weekly",
      companionSeriesKeysByIndicatorKey: new Map(),
      indicatorMarkers: [],
      indicatorSeries: [],
      overlaySeries: [macro],
      slotDescriptors: [makeDescriptor(slot, macro)],
      slotStateById: new Map([[slot.id, slot]]),
      xRangePreset: "max",
    });

    expect(projection.overlayRows.map((row) => row.date)).toEqual([
      "2026-01-31",
      "2026-02-28",
    ]);
  });
});
