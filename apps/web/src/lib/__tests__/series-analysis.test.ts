import { addDays, formatISO } from "date-fns";
import { describe, expect, it } from "vitest";
import {
  buildRsiDivergenceMarkers,
  buildOverlayData,
  buildRsiSeries,
  buildRsiSweepSeries,
  buildWeeklyRsiSeries,
  computePairCorrelation,
  findCorrelationExtremes,
} from "@/lib/series-analysis";
import type { MacroSeries } from "@/types/macro";

function makeSeries(key: string, values: number[]): MacroSeries {
  return {
    key,
    label: key,
    shortLabel: key,
    source: "yahoo",
    unit: "index",
    description: `${key} series`,
    color: "#000000",
    points: values.map((value, idx) => ({
      date: formatISO(addDays(new Date("2026-01-01T00:00:00Z"), idx), { representation: "date" }),
      value,
    })),
    stats: {
      latestValue: values.at(-1) ?? null,
      change1mPct: null,
      change3mPct: null,
      change1yPct: null,
    },
  };
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

  it("builds a bounded 14-period RSI series", () => {
    const base = makeSeries("sp500", [
      100, 101, 102, 101, 103, 104, 106, 105, 107, 109, 108, 110, 112, 111, 113, 115, 114, 116,
    ]);

    const rsi = buildRsiSeries(base);

    expect(rsi).not.toBeNull();
    expect(rsi?.key).toBe("rsi14:sp500");
    expect(rsi?.points).toHaveLength(base.points.length - 14);
    expect((rsi?.points[0].value ?? -1) >= 0).toBe(true);
    expect((rsi?.points[0].value ?? 101) <= 100).toBe(true);
    expect((rsi?.stats.latestValue ?? -1) >= 0).toBe(true);
    expect((rsi?.stats.latestValue ?? 101) <= 100).toBe(true);
  });

  it("builds sweep indicators for a long enough asset series", () => {
    const values = Array.from({ length: 360 }, (_, idx) => 100 + idx * 0.2 + (idx % 9) - 4);
    const base = makeSeries("bitcoin", values);

    const sweep = buildRsiSweepSeries(base);
    const keys = sweep.map((series) => series.key);

    expect(keys).toContain("rsi14:bitcoin");
    expect(keys).toContain("rsi-consensus:bitcoin");
    expect(keys).toContain("rsi-breadth50:bitcoin");
    expect(keys).toContain("rsi-dispersion:bitcoin");
    expect(keys).toContain("rsi-shortlong:bitcoin");
  });

  it("builds a weekly 14-period RSI series from resampled closes", () => {
    const values = Array.from({ length: 220 }, (_, idx) => 100 + idx * 0.5 + (idx % 5));
    const base = makeSeries("sp500", values);

    const weeklyRsi = buildWeeklyRsiSeries(base, 14);

    expect(weeklyRsi).not.toBeNull();
    expect(weeklyRsi?.key).toBe("rsi14w:sp500");
    expect((weeklyRsi?.points.length ?? 0) > 0).toBe(true);
  });

  it("marks bullish RSI divergence when price makes a lower low and RSI a higher low", () => {
    const asset = makeSeries("sp500", [100, 98, 95, 97, 96, 94, 92, 95, 99]);
    const indicator = makeSeries("rsi14:sp500", [45, 38, 30, 36, 35, 34, 33, 42, 50]);

    const markers = buildRsiDivergenceMarkers(asset, indicator);

    expect(markers.some((marker) => marker.direction === "bullish")).toBe(true);
  });
});
