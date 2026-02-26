import { describe, expect, it } from "vitest";
import { computeSeriesStats } from "../stats";

function point(date: string, value: number) {
  return { date, value };
}

describe("computeSeriesStats", () => {
  it("returns null stats for empty series", () => {
    expect(computeSeriesStats([])).toEqual({
      latestValue: null,
      change1mPct: null,
      change3mPct: null,
      change1yPct: null,
    });
  });

  it("computes trailing percentage changes from nearest prior points", () => {
    const points = [
      point("2024-01-01", 100),
      point("2024-12-01", 120),
      point("2025-09-30", 150),
      point("2025-11-29", 180),
      point("2025-12-29", 200),
    ];

    const stats = computeSeriesStats(points);

    expect(stats.latestValue).toBe(200);
    expect(stats.change1mPct).toBeCloseTo(11.111, 3);
    expect(stats.change3mPct).toBeCloseTo(33.333, 3);
    expect(stats.change1yPct).toBeCloseTo(66.667, 3);
  });

  it("returns null for invalid reference percentages (e.g. zero baseline)", () => {
    const points = [point("2025-01-01", 0), point("2026-01-02", 100)];
    const stats = computeSeriesStats(points);

    expect(stats.change1yPct).toBeNull();
  });
});
