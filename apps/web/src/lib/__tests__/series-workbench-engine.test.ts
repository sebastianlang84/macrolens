import { addDays, formatISO } from "date-fns";
import { describe, expect, it } from "vitest";
import {
  buildSeriesWorkbenchEngine,
  type WorkbenchSelectionSlot,
} from "@/lib/series-workbench-engine";
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
      formatISO(addDays(new Date("2026-01-01T00:00:00Z"), idx), {
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

describe("series-workbench-engine", () => {
  it("deduplicates overlay and indicator series while keeping companion keys", () => {
    const candles = makeDailyCandles(
      "2025-01-06",
      Array.from({ length: 360 }, (_, idx) => ({
        close: 100 + idx * 0.3 + (idx % 7) - 3,
      }))
    );
    const base = makeSeries(
      "bitcoin",
      candles.map((candle) => candle.close),
      candles
    );
    const indicatorKey = "rsi-score:bitcoin";

    const result = buildSeriesWorkbenchEngine(
      [base],
      [makeSlot("slot-1", "bitcoin", indicatorKey), makeSlot("slot-2", "bitcoin", indicatorKey)]
    );

    expect(result.slotDescriptors).toHaveLength(2);
    expect(result.overlaySeries.map((series) => series.key)).toEqual(["bitcoin"]);
    expect(result.indicatorSeries.map((series) => series.key)).toEqual([
      "rsi-score:bitcoin",
      "rsi-internal:14:bitcoin",
    ]);
    expect(result.companionSeriesKeysByIndicatorKey.get(indicatorKey)).toEqual([
      "rsi-internal:14:bitcoin",
    ]);
  });

  it("drops stale indicator selections that are no longer available", () => {
    const base = makeSeries("sp500", [100, 101, 102, 103, 104, 105, 106, 107]);

    const result = buildSeriesWorkbenchEngine(
      [base],
      [makeSlot("slot-1", "sp500", "missing-indicator")]
    );

    expect(result.slotDescriptors[0]?.effectiveIndicatorKey).toBe("");
    expect(result.slotDescriptors[0]?.selectedIndicator).toBeNull();
    expect(result.indicatorSeries).toEqual([]);
  });

  it("keeps weekly companion keys stable across duplicate slot selections", () => {
    const candles = makeDailyCandles(
      "2025-01-06",
      Array.from({ length: 360 }, (_, idx) => ({
        close: 100 + idx * 0.2 + (idx % 9) - 4,
      }))
    );
    const base = makeSeries(
      "bitcoin",
      candles.map((candle) => candle.close),
      candles
    );
    const indicatorKey = "rsi-scorew:bitcoin";

    const result = buildSeriesWorkbenchEngine(
      [base],
      [
        makeSlot("slot-1", "bitcoin", indicatorKey),
        makeSlot("slot-2", "bitcoin", indicatorKey),
      ]
    );

    expect(result.indicatorSeries.map((series) => series.key)).toEqual([
      "rsi-scorew:bitcoin",
      "rsi-internal:14:bitcoin:week",
    ]);
    expect(result.companionSeriesKeysByIndicatorKey.get(indicatorKey)).toEqual([
      "rsi-internal:14:bitcoin:week",
    ]);
  });
});
