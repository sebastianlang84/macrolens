import { format, parseISO } from "date-fns";
import { computeSeriesStats } from "@/lib/stats";
import type { MacroSeries, TimePoint } from "@/types/macro";

export type ChartScaleMode = "index1" | "raw";
export type YScaleMode = "shared" | "separate";

export type PairCorrelation = {
  leftKey: string;
  rightKey: string;
  value: number;
  sampleSize: number;
};

export type DivergenceMarker = {
  key: string;
  date: string;
  value: number;
  startDate: string;
  startValue: number;
  direction: "bullish" | "bearish";
  label: string;
  indicatorKey: string;
  assetKey: string;
  color: string;
};

export const ASSET_SERIES_KEYS = new Set([
  "sp500",
  "nasdaq100",
  "sp500_equal_weight",
  "gold",
  "bitcoin",
  "oil",
]);

export const RSI_SWEEP_WINDOWS = [5, 7, 10, 14, 20, 30, 45, 70, 100, 150, 200, 300] as const;

const RSI_SWEEP_SHORT_WINDOWS = [5, 7, 10, 14, 20];
const RSI_SWEEP_LONG_WINDOWS = [70, 100, 150, 200, 300];

function mean(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdev(values: number[]): number | null {
  const avg = mean(values);
  if (avg === null || values.length < 2) {
    return null;
  }

  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function computeRsiValue(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0 && avgGain === 0) {
    return 50;
  }
  if (avgLoss === 0) {
    return 100;
  }
  if (avgGain === 0) {
    return 0;
  }

  const relativeStrength = avgGain / avgLoss;
  return 100 - 100 / (1 + relativeStrength);
}

function createDerivedSeries(
  baseSeries: MacroSeries,
  key: string,
  label: string,
  shortLabel: string,
  description: string,
  color: string,
  points: TimePoint[],
): MacroSeries {
  return {
    key,
    label,
    shortLabel,
    source: baseSeries.source,
    unit: "index",
    description,
    color,
    points,
    stats: computeSeriesStats(points),
  };
}

function buildResampledCloseSeries(series: MacroSeries, timeframe: "week"): MacroSeries | null {
  if (series.points.length === 0) {
    return null;
  }

  const buckets = new Map<string, TimePoint>();

  for (const point of series.points) {
    const bucketKey =
      timeframe === "week" ? format(parseISO(point.date), "RRRR-'W'II") : point.date;
    buckets.set(bucketKey, point);
  }

  const resampledPoints = [...buckets.values()];
  if (resampledPoints.length === 0) {
    return null;
  }

  return {
    ...series,
    key: `${series.key}:${timeframe}`,
    label: `${series.label} ${timeframe === "week" ? "Weekly" : timeframe}`,
    shortLabel: `${series.shortLabel} ${timeframe === "week" ? "W" : timeframe}`,
    points: resampledPoints,
    stats: computeSeriesStats(resampledPoints),
  };
}

export function isAssetSeries(series: MacroSeries): boolean {
  return ASSET_SERIES_KEYS.has(series.key);
}

export function buildRsiSeries(series: MacroSeries, period = 14): MacroSeries | null {
  if (series.points.length <= period) {
    return null;
  }

  let gainSum = 0;
  let lossSum = 0;

  for (let idx = 1; idx <= period; idx += 1) {
    const change = series.points[idx].value - series.points[idx - 1].value;
    gainSum += Math.max(change, 0);
    lossSum += Math.max(-change, 0);
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  const rsiPoints: TimePoint[] = [
    {
      date: series.points[period].date,
      value: computeRsiValue(avgGain, avgLoss),
    },
  ];

  for (let idx = period + 1; idx < series.points.length; idx += 1) {
    const change = series.points[idx].value - series.points[idx - 1].value;
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rsiPoints.push({
      date: series.points[idx].date,
      value: computeRsiValue(avgGain, avgLoss),
    });
  }

  return createDerivedSeries(
    series,
    `rsi${period}:${series.key}`,
    `RSI ${period} (${series.label})`,
    `RSI ${period} (${series.shortLabel})`,
    `${period}-Perioden RSI, abgeleitet aus ${series.shortLabel}.`,
    series.color,
    rsiPoints,
  );
}

export function buildWeeklyRsiSeries(series: MacroSeries, period = 14): MacroSeries | null {
  const weeklySeries = buildResampledCloseSeries(series, "week");
  if (!weeklySeries) {
    return null;
  }

  const weeklyRsi = buildRsiSeries(weeklySeries, period);
  if (!weeklyRsi) {
    return null;
  }

  return createDerivedSeries(
    series,
    `rsi${period}w:${series.key}`,
    `RSI ${period}W (${series.label})`,
    `RSI ${period}W (${series.shortLabel})`,
    `${period}-Wochen RSI, aus resampleten Wochen-Schlusskursen von ${series.shortLabel}.`,
    "#0f766e",
    weeklyRsi.points,
  );
}

function alignSeriesByDate(
  assetSeries: MacroSeries,
  indicatorSeries: MacroSeries,
): Array<{ date: string; assetValue: number; indicatorValue: number }> {
  const indicatorValues = new Map(indicatorSeries.points.map((point) => [point.date, point.value]));

  return assetSeries.points
    .filter((point) => indicatorValues.has(point.date))
    .map((point) => ({
      date: point.date,
      assetValue: point.value,
      indicatorValue: indicatorValues.get(point.date) as number,
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

function isPivotLow(
  points: Array<{ assetValue: number }>,
  index: number,
  radius = 2,
): boolean {
  const target = points[index]?.assetValue;
  if (target === undefined) {
    return false;
  }

  for (let offset = 1; offset <= radius; offset += 1) {
    const left = points[index - offset]?.assetValue;
    const right = points[index + offset]?.assetValue;
    if (left === undefined || right === undefined || target > left || target > right) {
      return false;
    }
  }

  return true;
}

function isPivotHigh(
  points: Array<{ assetValue: number }>,
  index: number,
  radius = 2,
): boolean {
  const target = points[index]?.assetValue;
  if (target === undefined) {
    return false;
  }

  for (let offset = 1; offset <= radius; offset += 1) {
    const left = points[index - offset]?.assetValue;
    const right = points[index + offset]?.assetValue;
    if (left === undefined || right === undefined || target < left || target < right) {
      return false;
    }
  }

  return true;
}

export function buildRsiDivergenceMarkers(
  assetSeries: MacroSeries,
  indicatorSeries: MacroSeries,
): DivergenceMarker[] {
  const isSupportedIndicator =
    indicatorSeries.key.startsWith("rsi14:") || indicatorSeries.key.startsWith("rsi14w:");

  if (!isSupportedIndicator) {
    return [];
  }

  const weeklyAssetSeries = indicatorSeries.key.startsWith("rsi14w:")
    ? buildResampledCloseSeries(assetSeries, "week")
    : null;
  const priceSeries = weeklyAssetSeries ?? assetSeries;
  const aligned = alignSeriesByDate(priceSeries, indicatorSeries);

  if (aligned.length < 7) {
    return [];
  }

  const lowPivots = aligned.filter((_, index) => isPivotLow(aligned, index));
  const highPivots = aligned.filter((_, index) => isPivotHigh(aligned, index));
  const markers: DivergenceMarker[] = [];

  for (let idx = 1; idx < lowPivots.length; idx += 1) {
    const previous = lowPivots[idx - 1];
    const current = lowPivots[idx];

    if (current.assetValue < previous.assetValue && current.indicatorValue > previous.indicatorValue) {
      markers.push({
        key: `bull-div:${indicatorSeries.key}:${current.date}`,
        date: current.date,
        value: current.indicatorValue,
        startDate: previous.date,
        startValue: previous.indicatorValue,
        direction: "bullish",
        label: "Bull Div",
        indicatorKey: indicatorSeries.key,
        assetKey: assetSeries.key,
        color: "#16a34a",
      });
    }
  }

  for (let idx = 1; idx < highPivots.length; idx += 1) {
    const previous = highPivots[idx - 1];
    const current = highPivots[idx];

    if (current.assetValue > previous.assetValue && current.indicatorValue < previous.indicatorValue) {
      markers.push({
        key: `bear-div:${indicatorSeries.key}:${current.date}`,
        date: current.date,
        value: current.indicatorValue,
        startDate: previous.date,
        startValue: previous.indicatorValue,
        direction: "bearish",
        label: "Bear Div",
        indicatorKey: indicatorSeries.key,
        assetKey: assetSeries.key,
        color: "#dc2626",
      });
    }
  }

  return markers;
}

export function buildRsiSweepSeries(series: MacroSeries): MacroSeries[] {
  const rsiByWindow = RSI_SWEEP_WINDOWS.map((period) => {
    const derivedSeries = buildRsiSeries(series, period);
    if (!derivedSeries) {
      return null;
    }

    return {
      period,
      series: derivedSeries,
    };
  }).filter(
    (
      entry,
    ): entry is {
      period: (typeof RSI_SWEEP_WINDOWS)[number];
      series: MacroSeries;
    } => entry !== null,
  );

  if (rsiByWindow.length === 0) {
    return [];
  }

  const maxPeriod = Math.max(...rsiByWindow.map((entry) => entry.period));
  const rsiMaps = new Map(
    rsiByWindow.map((entry) => [
      entry.period,
      new Map(entry.series.points.map((point) => [point.date, point.value])),
    ]),
  );

  const consensusPoints: TimePoint[] = [];
  const breadthPoints: TimePoint[] = [];
  const overheatPoints: TimePoint[] = [];
  const dispersionPoints: TimePoint[] = [];
  const shortLongPoints: TimePoint[] = [];

  for (const point of series.points.slice(maxPeriod)) {
    const windowValues = rsiByWindow
      .map((entry) => ({
        period: entry.period,
        value: rsiMaps.get(entry.period)?.get(point.date),
      }))
      .filter(
        (
          entry,
        ): entry is {
          period: (typeof RSI_SWEEP_WINDOWS)[number];
          value: number;
        } => entry.value !== undefined && Number.isFinite(entry.value),
      );

    if (windowValues.length !== rsiByWindow.length) {
      continue;
    }

    const values = windowValues.map((entry) => entry.value);
    const consensus = mean(values);
    const dispersion = stdev(values);
    const breadth50 = (values.filter((value) => value > 50).length / values.length) * 100;
    const overheat70 = (values.filter((value) => value > 70).length / values.length) * 100;

    const shortValues = windowValues
      .filter((entry) => RSI_SWEEP_SHORT_WINDOWS.includes(entry.period))
      .map((entry) => entry.value);
    const longValues = windowValues
      .filter((entry) => RSI_SWEEP_LONG_WINDOWS.includes(entry.period))
      .map((entry) => entry.value);
    const shortLongSpread =
      shortValues.length > 0 && longValues.length > 0
        ? (mean(shortValues) as number) - (mean(longValues) as number)
        : null;

    if (consensus !== null) {
      consensusPoints.push({ date: point.date, value: consensus });
    }
    if (dispersion !== null) {
      dispersionPoints.push({ date: point.date, value: dispersion });
    }
    breadthPoints.push({ date: point.date, value: breadth50 });
    overheatPoints.push({ date: point.date, value: overheat70 });
    if (shortLongSpread !== null) {
      shortLongPoints.push({ date: point.date, value: shortLongSpread });
    }
  }

  const classicRsi = buildRsiSeries(series, 14);
  const weeklyRsi = buildWeeklyRsiSeries(series, 14);
  const sweepSeries: MacroSeries[] = [];

  if (classicRsi) {
    sweepSeries.push(classicRsi);
  }
  if (weeklyRsi) {
    sweepSeries.push(weeklyRsi);
  }

  const derived: Array<{
    key: string;
    label: string;
    shortLabel: string;
    description: string;
    color: string;
    points: TimePoint[];
  }> = [
    {
      key: `rsi-consensus:${series.key}`,
      label: `RSI Sweep Consensus (${series.label})`,
      shortLabel: `RSI Consensus (${series.shortLabel})`,
      description:
        "Durchschnittlicher RSI ueber kurze bis lange Lookbacks; zeigt das breite Momentum ueber viele Horizonte.",
      color: "#0f172a",
      points: consensusPoints,
    },
    {
      key: `rsi-breadth50:${series.key}`,
      label: `RSI Sweep Breadth > 50 (${series.label})`,
      shortLabel: `RSI Breadth 50 (${series.shortLabel})`,
      description:
        "Anteil der RSI-Lookbacks ueber 50 in Prozent; misst, wie breit bullisches Momentum abgestuetzt ist.",
      color: "#059669",
      points: breadthPoints,
    },
    {
      key: `rsi-overheat70:${series.key}`,
      label: `RSI Sweep Overheat > 70 (${series.label})`,
      shortLabel: `RSI Overheat 70 (${series.shortLabel})`,
      description:
        "Anteil der RSI-Lookbacks ueber 70 in Prozent; zeigt, wie gross die ueberdehnte Sweep-Zone ist.",
      color: "#dc2626",
      points: overheatPoints,
    },
    {
      key: `rsi-dispersion:${series.key}`,
      label: `RSI Sweep Dispersion (${series.label})`,
      shortLabel: `RSI Dispersion (${series.shortLabel})`,
      description:
        "Standardabweichung der RSI-Lookbacks; hohe Werte signalisieren Uneinigkeit zwischen kurzen und langen Horizonten.",
      color: "#7c3aed",
      points: dispersionPoints,
    },
    {
      key: `rsi-shortlong:${series.key}`,
      label: `RSI Short-Long Spread (${series.label})`,
      shortLabel: `RSI Short-Long (${series.shortLabel})`,
      description:
        "Differenz zwischen kurzen und langen RSI-Lookbacks; positiv heisst kurzfristig heisser als langfristig.",
      color: "#ea580c",
      points: shortLongPoints,
    },
  ];

  for (const entry of derived) {
    if (entry.points.length === 0) {
      continue;
    }

    sweepSeries.push(
      createDerivedSeries(
        series,
        entry.key,
        entry.label,
        entry.shortLabel,
        entry.description,
        entry.color,
        entry.points,
      ),
    );
  }

  return sweepSeries;
}

function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 3) {
    return null;
  }

  const n = xs.length;
  const meanX = xs.reduce((sum, x) => sum + x, 0) / n;
  const meanY = ys.reduce((sum, y) => sum + y, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  if (denomX === 0 || denomY === 0) {
    return null;
  }

  return numerator / Math.sqrt(denomX * denomY);
}

export function computePairCorrelation(
  left: MacroSeries,
  right: MacroSeries,
): Pick<PairCorrelation, "value" | "sampleSize"> | null {
  if (left.points.length < 3 || right.points.length < 3) {
    return null;
  }

  const rightValues = new Map(right.points.map((point) => [point.date, point.value]));
  const overlapping = left.points
    .filter((point) => rightValues.has(point.date))
    .map((point) => ({
      date: point.date,
      leftValue: point.value,
      rightValue: rightValues.get(point.date) as number,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (overlapping.length < 4) {
    return null;
  }

  const leftReturns: number[] = [];
  const rightReturns: number[] = [];

  for (let i = 1; i < overlapping.length; i += 1) {
    const prev = overlapping[i - 1];
    const curr = overlapping[i];
    if (
      prev.leftValue === 0 ||
      prev.rightValue === 0 ||
      !Number.isFinite(prev.leftValue) ||
      !Number.isFinite(prev.rightValue) ||
      !Number.isFinite(curr.leftValue) ||
      !Number.isFinite(curr.rightValue)
    ) {
      continue;
    }

    const leftRet = (curr.leftValue - prev.leftValue) / prev.leftValue;
    const rightRet = (curr.rightValue - prev.rightValue) / prev.rightValue;
    if (!Number.isFinite(leftRet) || !Number.isFinite(rightRet)) {
      continue;
    }

    leftReturns.push(leftRet);
    rightReturns.push(rightRet);
  }

  const corr = pearson(leftReturns, rightReturns);
  if (corr === null) {
    return null;
  }

  return {
    value: corr,
    sampleSize: leftReturns.length,
  };
}

export function findCorrelationExtremes(series: MacroSeries[]): {
  mostPositive: PairCorrelation | null;
  mostNegative: PairCorrelation | null;
} {
  let mostPositive: PairCorrelation | null = null;
  let mostNegative: PairCorrelation | null = null;

  for (let i = 0; i < series.length; i += 1) {
    for (let j = i + 1; j < series.length; j += 1) {
      const left = series[i];
      const right = series[j];
      const result = computePairCorrelation(left, right);
      if (!result) {
        continue;
      }

      const pair: PairCorrelation = {
        leftKey: left.key,
        rightKey: right.key,
        value: result.value,
        sampleSize: result.sampleSize,
      };

      if (pair.value > 0 && (!mostPositive || pair.value > mostPositive.value)) {
        mostPositive = pair;
      }

      if (pair.value < 0 && (!mostNegative || pair.value < mostNegative.value)) {
        mostNegative = pair;
      }
    }
  }

  return { mostPositive, mostNegative };
}

export function buildOverlayData(
  series: MacroSeries[],
  scaleMode: ChartScaleMode,
): Array<{ date: string } & Record<string, number | string>> {
  const rowsByDate = new Map<string, { date: string } & Record<string, number | string>>();
  const nonEmptySeries = series.filter((item) => item.points.length > 0);
  if (nonEmptySeries.length === 0) {
    return [];
  }

  const firstDates = nonEmptySeries
    .map((item) => item.points[0]?.date)
    .filter((date): date is string => !!date);
  const commonStartDate = firstDates.sort().at(-1);
  if (!commonStartDate) {
    return [];
  }

  for (const item of nonEmptySeries) {
    const startIndex = item.points.findIndex((point) => point.date >= commonStartDate);
    if (startIndex < 0) {
      continue;
    }

    const baseValue = item.points[startIndex]?.value;
    const canScaleToOne =
      scaleMode === "index1" &&
      baseValue !== undefined &&
      Number.isFinite(baseValue) &&
      baseValue !== 0;

    for (let idx = startIndex; idx < item.points.length; idx += 1) {
      const point = item.points[idx];
      let value = point.value;
      if (canScaleToOne) {
        value = point.value / (baseValue as number);
      }

      if (!Number.isFinite(value)) {
        continue;
      }

      const existing = rowsByDate.get(point.date) ?? { date: point.date };
      existing[item.key] = value;
      rowsByDate.set(point.date, existing);
    }
  }

  return [...rowsByDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
