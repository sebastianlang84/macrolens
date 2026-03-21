import { describe, expect, it } from "vitest";
import type { MacroSeries, SeriesUnit, TimePoint } from "@/types/macro";
import { deriveMacroSignals } from "../macro-derivations";
import { computeSeriesStats } from "../stats";

function dailySeries(startDate: string, values: number[]): TimePoint[] {
  const start = new Date(startDate);

  return values.map((value, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      date: date.toISOString().slice(0, 10),
      value,
    };
  });
}

function makeSeries(
  key: string,
  unit: SeriesUnit,
  points: TimePoint[]
): MacroSeries {
  return {
    key,
    label: key,
    shortLabel: key,
    source: key === "fedfunds" || key === "payrolls" ? "fred" : "yahoo",
    unit,
    description: `${key} test series`,
    color: "#000000",
    points,
    stats: computeSeriesStats(points),
  };
}

function toneOf(signals: ReturnType<typeof deriveMacroSignals>, id: string) {
  return signals.find((signal) => signal.id === id)?.tone;
}

describe("deriveMacroSignals", () => {
  it("derives expected tones for a mixed macro regime", () => {
    const oilTrend = Array.from(
      { length: 120 },
      (_, index) => 50 + index * 0.5
    );

    const signals = deriveMacroSignals([
      makeSeries(
        "sp500",
        "index",
        dailySeries(
          "2025-01-01",
          Array.from({ length: 220 }, (_, index) => 100 + index)
        )
      ),
      makeSeries(
        "sp500_equal_weight",
        "usd",
        dailySeries(
          "2025-01-01",
          Array.from({ length: 220 }, (_, index) =>
            index < 130 ? 100 + index : 230
          )
        )
      ),
      makeSeries(
        "vix",
        "index",
        dailySeries(
          "2025-07-01",
          Array.from({ length: 10 }, () => 28)
        )
      ),
      makeSeries("oil", "usd", dailySeries("2025-07-01", oilTrend)),
      makeSeries("fedfunds", "percent", [
        { date: "2024-01-01", value: 1.5 },
        { date: "2025-01-01", value: 5.0 },
      ]),
      makeSeries("payrolls", "thousand_persons", [
        { date: "2025-11-01", value: 150_000 },
        { date: "2025-12-01", value: 150_120 },
      ]),
    ]);

    expect(toneOf(signals, "equity-trend")).toBe("positive");
    expect(toneOf(signals, "breadth")).toBe("negative");
    expect(toneOf(signals, "volatility")).toBe("negative");
    expect(toneOf(signals, "oil")).toBe("negative");
    expect(toneOf(signals, "payrolls")).toBe("positive");
    expect(toneOf(signals, "policy")).toBe("negative");
  });

  it("emits only signals supported by available series", () => {
    const signals = deriveMacroSignals([
      makeSeries("vix", "index", [{ date: "2025-01-01", value: 15 }]),
    ]);

    expect(signals.map((signal) => signal.id)).toEqual(["volatility"]);
    expect(toneOf(signals, "volatility")).toBe("positive");
  });

  it("derives yield curve, inflation, unemployment and credit signals when FRED macro series are present", () => {
    const signals = deriveMacroSignals([
      makeSeries("dgs10", "percent", [{ date: "2025-12-01", value: 4.2 }]),
      makeSeries("dgs2", "percent", [{ date: "2025-12-01", value: 4.7 }]),
      makeSeries("ig_oas", "percent", [
        { date: "2025-09-01", value: 1.2 },
        { date: "2025-12-01", value: 1.6 },
      ]),
      makeSeries("hy_oas", "percent", [
        { date: "2025-09-01", value: 4.8 },
        { date: "2025-12-01", value: 6.1 },
      ]),
      makeSeries("cpi", "index", [
        { date: "2024-11-01", value: 300 },
        { date: "2025-11-01", value: 312 },
      ]),
      makeSeries("unrate", "percent", [
        { date: "2025-09-01", value: 4.0 },
        { date: "2025-12-01", value: 4.6 },
      ]),
    ]);

    expect(toneOf(signals, "yield-curve")).toBe("negative");
    expect(toneOf(signals, "credit")).toBe("negative");
    expect(toneOf(signals, "inflation")).toBe("negative");
    expect(toneOf(signals, "unemployment")).toBe("negative");
  });
});
