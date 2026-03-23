import { addDays, formatISO } from "date-fns";
import { describe, expect, it } from "vitest";
import {
  buildCompanionIndicatorSeries,
  buildOverlayData,
  buildRsiDivergenceMarkers,
  buildRsiScoreIndicators,
  buildRsiScoreSeries,
  buildWeeklyRsiScoreSeries,
  buildWeeklySeries,
  computePairCorrelation,
  findCorrelationExtremes,
} from "@/lib/series-analysis";
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

describe("series-analysis", () => {
  it("builds overlay data with scale=1 normalization at common start", () => {
    const a = makeSeries("a", [100, 110, 120]);
    const b = makeSeries("b", [50, 55, 60]);

    const rows = buildOverlayData([a, b], "index1");
    expect(rows).toHaveLength(3);
    expect(rows[0].a).toBe(1);
    expect(rows[0].b).toBe(1);
    expect(rows[1].a).toBeCloseTo(1.1, 6);
    expect(rows[1].b).toBeCloseTo(1.1, 6);
  });

  it("detects strong positive and strong inverse return correlation", () => {
    const positiveLeft = makeSeries("x", [100, 101, 103, 104, 106, 108]);
    const positiveRight = makeSeries("y", [50, 50.5, 51.5, 52, 53, 54]);
    const positive = computePairCorrelation(positiveLeft, positiveRight);
    expect(positive).not.toBeNull();
    expect((positive?.value ?? 0) > 0.8).toBe(true);

    const inverseLeft = makeSeries("u", [100, 102, 101, 104, 103, 106]);
    const inverseRight = makeSeries("v", [100, 98, 99, 96, 97, 94]);
    const inverse = computePairCorrelation(inverseLeft, inverseRight);
    expect(inverse).not.toBeNull();
    expect((inverse?.value ?? 0) < -0.8).toBe(true);
  });

  it("reports inverse extreme only when a negative correlation exists", () => {
    const a = makeSeries("a", [100, 101, 102, 103, 104, 105]);
    const b = makeSeries("b", [80, 81, 82, 83, 84, 85]);
    const c = makeSeries("c", [40, 40.5, 41, 41.5, 42, 42.5]);

    const extremes = findCorrelationExtremes([a, b, c]);
    expect(extremes.mostPositive).not.toBeNull();
    expect(extremes.mostNegative).toBeNull();
  });

  it("builds a bounded daily RSI score series", () => {
    const candles = makeDailyCandles(
      "2026-01-01",
      Array.from({ length: 48 }, (_, index) => ({
        close: 100 + index * 0.6 + ((index % 6) - 2),
      }))
    );
    const base = makeSeries(
      "sp500",
      candles.map((candle) => candle.close),
      candles
    );

    const score = buildRsiScoreSeries(base);

    expect(score).not.toBeNull();
    expect(score?.key).toBe("rsi-score:sp500");
    expect((score?.points.length ?? 0) > 0).toBe(true);
    expect(Number.isFinite(score?.points[0]?.value ?? Number.NaN)).toBe(true);
    expect(Number.isFinite(score?.stats.latestValue ?? Number.NaN)).toBe(true);
  });

  it("builds daily and weekly RSI score indicators for a long enough asset series", () => {
    const candles = makeDailyCandles(
      "2025-01-01",
      Array.from({ length: 360 }, (_, idx) => ({
        close: 100 + idx * 0.2 + (idx % 9) - 4,
      }))
    );
    const base = makeSeries(
      "bitcoin",
      candles.map((candle) => candle.close),
      candles
    );

    const indicators = buildRsiScoreIndicators(base);
    const keys = indicators.map((series) => series.key);

    expect(keys).toContain("rsi-score:bitcoin");
    expect(keys).toContain("rsi-scorew:bitcoin");
  });

  it("returns the underlying RSI companion for daily and weekly RSI scores", () => {
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

    const dailyScore = buildRsiScoreSeries(base);
    const weeklyScore = buildWeeklyRsiScoreSeries(base);

    expect(dailyScore).not.toBeNull();
    expect(weeklyScore).not.toBeNull();
    if (!(dailyScore && weeklyScore)) {
      throw new Error("Expected both daily and weekly RSI scores");
    }

    const dailyCompanion = buildCompanionIndicatorSeries(base, dailyScore);
    const weeklyCompanion = buildCompanionIndicatorSeries(base, weeklyScore);

    expect(dailyCompanion).toHaveLength(1);
    expect(dailyCompanion[0]?.key).toBe("rsi-internal:14:bitcoin");
    expect(weeklyCompanion).toHaveLength(1);
    expect(weeklyCompanion[0]?.key).toBe("rsi-internal:14:bitcoin:week");
  });

  it("aggregates daily candles into Monday-aligned weekly candles", () => {
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

    const weekly = buildWeeklySeries(base);

    expect(weekly).not.toBeNull();
    expect(weekly?.points).toHaveLength(2);
    expect(weekly?.points[0]).toEqual({ date: "2026-01-05", value: 107 });
    expect(weekly?.points[1]).toEqual({ date: "2026-01-12", value: 108 });
    expect(weekly?.candles?.[0]).toEqual({
      date: "2026-01-05",
      open: 100,
      high: 109,
      low: 98,
      close: 107,
    });
  });

  it("builds a weekly RSI score series from Monday-aligned weekly closes", () => {
    const candles = makeDailyCandles(
      "2025-01-06",
      Array.from({ length: 220 }, (_, idx) => ({
        close: 100 + idx * 0.5 + (idx % 5),
      }))
    );
    const base = makeSeries(
      "sp500",
      candles.map((candle) => candle.close),
      candles
    );

    const weeklyScore = buildWeeklyRsiScoreSeries(base);

    expect(weeklyScore).not.toBeNull();
    expect(weeklyScore?.key).toBe("rsi-scorew:sp500");
    expect((weeklyScore?.points.length ?? 0) > 0).toBe(true);
  });

  it("marks bullish daily RSI score divergence from RSI pivots and candle lows", () => {
    const candles = makeDailyCandles("2026-02-01", [
      { close: 110 },
      { close: 109 },
      { close: 108 },
      { close: 107 },
      { close: 106 },
      { close: 105 },
      { close: 104 },
      { close: 103 },
      { close: 102 },
      { close: 101 },
      { close: 100 },
      { close: 99, low: 90 },
      { close: 101 },
      { close: 102 },
      { close: 103 },
      { close: 104 },
      { close: 105 },
      { close: 106 },
      { close: 107 },
      { close: 108 },
      { close: 109 },
      { close: 110 },
      { close: 111 },
      { close: 112, low: 85 },
      { close: 113 },
      { close: 114 },
      { close: 115 },
      { close: 116 },
      { close: 117 },
    ]);
    const asset = makeSeries(
      "sp500",
      candles.map((candle) => candle.close),
      candles
    );
    const indicator = makeSeries(
      "rsi-score:sp500",
      [
        90, 88, 86, 84, 82, 80, 78, 76, 74, 72, 70, 60, 71, 73, 75, 77, 79, 81,
        83, 85, 87, 89, 91, 65, 92, 94, 96, 98, 100,
      ],
      undefined,
      candles.map((candle) => candle.date)
    );

    const markers = buildRsiDivergenceMarkers(asset, indicator);

    expect(markers).toContainEqual(
      expect.objectContaining({
        direction: "bullish",
        startDate: "2026-02-12",
        date: "2026-02-24",
      })
    );
  });

  it("ignores bullish daily divergence when the score does not improve enough", () => {
    const candles = makeDailyCandles("2026-02-01", [
      { close: 110 },
      { close: 109 },
      { close: 108 },
      { close: 107 },
      { close: 106 },
      { close: 105 },
      { close: 104 },
      { close: 103 },
      { close: 102 },
      { close: 101 },
      { close: 100 },
      { close: 99, low: 90 },
      { close: 101 },
      { close: 102 },
      { close: 103 },
      { close: 104 },
      { close: 105 },
      { close: 106 },
      { close: 107 },
      { close: 108 },
      { close: 109 },
      { close: 110 },
      { close: 111 },
      { close: 112, low: 85 },
      { close: 113 },
      { close: 114 },
      { close: 115 },
      { close: 116 },
      { close: 117 },
    ]);
    const asset = makeSeries(
      "sp500",
      candles.map((candle) => candle.close),
      candles
    );
    const indicator = makeSeries(
      "rsi-score:sp500",
      [
        90, 88, 86, 84, 82, 80, 78, 76, 74, 72, 70, 60, 71, 73, 75, 77, 79, 81,
        83, 85, 87, 89, 91, 61, 92, 94, 96, 98, 100,
      ],
      undefined,
      candles.map((candle) => candle.date)
    );

    const markers = buildRsiDivergenceMarkers(asset, indicator);

    expect(markers).not.toContainEqual(
      expect.objectContaining({
        direction: "bullish",
        startDate: "2026-02-12",
        date: "2026-02-24",
      })
    );
  });

  it("marks weekly bearish RSI score divergences from Monday-aligned weekly highs", () => {
    const weeklyDates = [
      "2024-10-28",
      "2024-11-04",
      "2024-11-11",
      "2024-11-18",
      "2024-11-25",
      "2024-12-02",
      "2024-12-09",
      "2024-12-16",
      "2024-12-23",
      "2024-12-30",
      "2025-01-06",
      "2025-01-13",
      "2025-01-20",
      "2025-01-27",
      "2025-02-03",
      "2025-02-10",
      "2025-02-17",
      "2025-02-24",
      "2025-03-03",
      "2025-03-10",
      "2025-03-17",
      "2025-03-24",
      "2025-03-31",
      "2025-04-07",
      "2025-04-14",
      "2025-04-21",
      "2025-04-28",
      "2025-05-05",
      "2025-05-12",
      "2025-05-19",
      "2025-05-26",
      "2025-06-02",
      "2025-06-09",
      "2025-06-16",
      "2025-06-23",
      "2025-06-30",
      "2025-07-07",
      "2025-07-14",
      "2025-07-21",
      "2025-07-28",
      "2025-08-04",
      "2025-08-11",
      "2025-08-18",
      "2025-08-25",
      "2025-09-01",
      "2025-09-08",
      "2025-09-15",
      "2025-09-22",
      "2025-09-29",
      "2025-10-06",
      "2025-10-13",
      "2025-10-20",
    ];
    const highsByDate = new Map([
      ["2024-12-09", 100],
      ["2025-01-20", 110],
      ["2025-05-19", 120],
      ["2025-07-07", 118],
      ["2025-09-29", 130],
    ]);
    const indicatorByDate = new Map([
      ["2024-12-09", 45],
      ["2025-01-20", 42],
      ["2025-05-19", 40],
      ["2025-07-07", 44],
      ["2025-09-29", 41],
    ]);
    const candles: CandlePoint[] = weeklyDates.map((date) => {
      const high = highsByDate.get(date) ?? 70;
      return {
        date,
        open: high - 3,
        high,
        low: high - 6,
        close: high - 1,
      };
    });
    const asset = makeSeries(
      "bitcoin",
      candles.map((candle) => candle.close),
      candles
    );
    const indicator = makeSeries(
      "rsi-scorew:bitcoin",
      weeklyDates.map((date) => indicatorByDate.get(date) ?? 35),
      undefined,
      weeklyDates
    );

    const markers = buildRsiDivergenceMarkers(asset, indicator);

    expect(markers).toContainEqual(
      expect.objectContaining({
        direction: "bearish",
        startDate: "2024-12-09",
        date: "2025-01-20",
      })
    );
    expect(markers).toContainEqual(
      expect.objectContaining({
        direction: "bearish",
        startDate: "2025-01-20",
        date: "2025-05-19",
      })
    );
    expect(markers).toContainEqual(
      expect.objectContaining({
        direction: "bearish",
        startDate: "2025-07-07",
        date: "2025-09-29",
      })
    );
  });
});
