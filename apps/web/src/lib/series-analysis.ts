import { format, parseISO, startOfWeek } from "date-fns";
import { computeSeriesStats } from "@/lib/stats";
import type { CandlePoint, MacroSeries, TimePoint } from "@/types/macro";

export type ChartScaleMode = "index1" | "raw";
export type YScaleMode = "shared" | "separate";

export interface PairCorrelation {
  leftKey: string;
  rightKey: string;
  sampleSize: number;
  value: number;
}

export interface DivergenceMarker {
  assetKey: string;
  color: string;
  date: string;
  direction: "bullish" | "bearish";
  indicatorKey: string;
  key: string;
  label: string;
  startDate: string;
  startValue: number;
  value: number;
}

export const ASSET_SERIES_KEYS = new Set([
  "sp500",
  "nasdaq100",
  "sp500_equal_weight",
  "gold",
  "bitcoin",
  "oil",
]);

const RSI_PERIOD = 14;
const RSI_SCORE_WINDOW = 14;
const RSI_SCORE_SMOOTHING = 5;
const RSI_SCORE_PRICE_WEIGHT = 1;
const RSI_SCORE_SCALE = 1.5;
const SCORE_CENTER = 50;
const SCORE_MULTIPLIER = 0.35;
const BULLISH_SCORE_THRESHOLD = SCORE_CENTER + 20 * SCORE_MULTIPLIER;
const BEARISH_SCORE_THRESHOLD = SCORE_CENTER - 20 * SCORE_MULTIPLIER;
const MIN_SCORE_IMPROVEMENT = 1.5;
const STRONG_SCORE_IMPROVEMENT = MIN_SCORE_IMPROVEMENT * 2;
const DAILY_DIVERGENCE_PIVOT = { left: 3, right: 5 } as const;
const WEEKLY_DIVERGENCE_PIVOT = { left: 3, right: 3 } as const;
const DAILY_DIVERGENCE_GAP = { min: 5, max: 60 } as const;
const WEEKLY_DIVERGENCE_GAP = { min: 2, max: 26 } as const;

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
  points: TimePoint[]
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

function toWeekStart(date: string): string {
  return format(startOfWeek(parseISO(date), { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function buildWeeklySeries(series: MacroSeries): MacroSeries | null {
  if (series.points.length === 0) {
    return null;
  }

  const candleBuckets = new Map<string, CandlePoint>();
  if ((series.candles?.length ?? 0) > 0) {
    for (const candle of series.candles ?? []) {
      const bucketKey = toWeekStart(candle.date);
      const existing = candleBuckets.get(bucketKey);
      if (!existing) {
        candleBuckets.set(bucketKey, {
          date: bucketKey,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        });
        continue;
      }

      existing.high = Math.max(existing.high, candle.high);
      existing.low = Math.min(existing.low, candle.low);
      existing.close = candle.close;
    }
  }

  const pointBuckets = new Map<string, TimePoint>();
  for (const point of series.points) {
    pointBuckets.set(toWeekStart(point.date), {
      date: toWeekStart(point.date),
      value: point.value,
    });
  }

  const weeklyCandles = [...candleBuckets.values()].sort((left, right) =>
    left.date.localeCompare(right.date)
  );
  const weeklyPoints = [...pointBuckets.values()].sort((left, right) =>
    left.date.localeCompare(right.date)
  );

  if (weeklyPoints.length === 0) {
    return null;
  }

  return {
    ...series,
    key: `${series.key}:week`,
    label: `${series.label} Weekly`,
    shortLabel: `${series.shortLabel} W`,
    points: weeklyPoints,
    candles: weeklyCandles.length > 0 ? weeklyCandles : undefined,
    stats: computeSeriesStats(weeklyPoints),
  };
}

export function isAssetSeries(series: MacroSeries): boolean {
  return ASSET_SERIES_KEYS.has(series.key);
}

function computeBaseRsiSeries(
  series: MacroSeries,
  period = RSI_PERIOD
): MacroSeries | null {
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
    `rsi-internal:${period}:${series.key}`,
    `RSI ${period} (${series.label})`,
    `RSI ${period} (${series.shortLabel})`,
    `${period}-Perioden RSI, abgeleitet aus ${series.shortLabel}.`,
    series.color,
    rsiPoints
  );
}

function computeAtrSeries(series: MacroSeries, period: number): TimePoint[] {
  const candles = series.candles ?? [];
  if (candles.length <= period) {
    return [];
  }

  const trueRanges: Array<{ date: string; value: number }> = [];
  for (let index = 1; index < candles.length; index += 1) {
    const current = candles[index];
    const previous = candles[index - 1];
    const trueRange = Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close)
    );
    trueRanges.push({ date: current.date, value: trueRange });
  }

  if (trueRanges.length < period) {
    return [];
  }

  let atr =
    trueRanges.slice(0, period).reduce((sum, entry) => sum + entry.value, 0) /
    period;
  const atrPoints: TimePoint[] = [
    { date: trueRanges[period - 1].date, value: atr },
  ];

  for (let index = period; index < trueRanges.length; index += 1) {
    atr = (atr * (period - 1) + trueRanges[index].value) / period;
    atrPoints.push({
      date: trueRanges[index].date,
      value: atr,
    });
  }

  return atrPoints;
}

function tanh(value: number): number {
  const exp = Math.exp(value);
  const negExp = Math.exp(-value);
  return (exp - negExp) / (exp + negExp);
}

function computeRegressionEndpoint(values: number[]): number | null {
  if (values.length < 2) {
    return null;
  }

  const n = values.length;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((sum, value) => sum + value, 0) / n;
  let numerator = 0;
  let denominator = 0;

  for (let index = 0; index < n; index += 1) {
    const deltaX = index - meanX;
    numerator += deltaX * (values[index] - meanY);
    denominator += deltaX * deltaX;
  }

  if (denominator === 0) {
    return null;
  }

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;
  return intercept + slope * (n - 1);
}

function computeEma(values: number[], period: number): number[] {
  if (values.length === 0) {
    return [];
  }

  const multiplier = 2 / (period + 1);
  const result = [values[0]];

  for (let index = 1; index < values.length; index += 1) {
    result.push(
      values[index] * multiplier + result[index - 1] * (1 - multiplier)
    );
  }

  return result;
}

function computeDema(values: number[], period: number): number[] {
  if (values.length === 0) {
    return [];
  }

  if (period <= 1) {
    return [...values];
  }

  const ema = computeEma(values, period);
  const emaOfEma = computeEma(ema, period);
  return values.map((_, index) => 2 * ema[index] - emaOfEma[index]);
}

interface RsiScoreSeriesResult {
  rsiSeries: MacroSeries;
  scoreSeries: MacroSeries;
}

function buildRsiScoreSeriesForInput(
  inputSeries: MacroSeries,
  outputBaseSeries: MacroSeries,
  keyPrefix: "rsi-score" | "rsi-scorew",
  labelSuffix: string,
  shortLabelSuffix: string,
  color: string
): RsiScoreSeriesResult | null {
  const rsiSeries = computeBaseRsiSeries(inputSeries, RSI_PERIOD);
  if (!rsiSeries) {
    return null;
  }

  const atrMap = new Map(
    computeAtrSeries(inputSeries, RSI_PERIOD).map((point) => [
      point.date,
      point.value,
    ])
  );
  const scoreInputs: Array<{ date: string; value: number }> = [];

  for (
    let index = RSI_SCORE_WINDOW;
    index < rsiSeries.points.length;
    index += 1
  ) {
    const currentWindow = rsiSeries.points.slice(
      index - RSI_SCORE_WINDOW + 1,
      index + 1
    );
    const previousWindow = rsiSeries.points.slice(
      index - RSI_SCORE_WINDOW,
      index
    );
    const currentRsiReg = computeRegressionEndpoint(
      currentWindow.map((point) => point.value)
    );
    const previousRsiReg = computeRegressionEndpoint(
      previousWindow.map((point) => point.value)
    );
    if (currentRsiReg === null || previousRsiReg === null) {
      continue;
    }

    const windowDates = currentWindow.map((point) => point.date);
    const inputWindowValues = windowDates.map(
      (date) => inputSeries.points.find((point) => point.date === date)?.value
    );
    if (inputWindowValues.some((value) => value === undefined)) {
      continue;
    }

    const currentPriceReg = computeRegressionEndpoint(
      inputWindowValues as number[]
    );
    const previousPriceReg = computeRegressionEndpoint(
      previousWindow.map(
        (point) =>
          inputSeries.points.find((entry) => entry.date === point.date)
            ?.value as number
      )
    );
    if (currentPriceReg === null || previousPriceReg === null) {
      continue;
    }

    const rsiStd = stdev(currentWindow.map((point) => point.value));
    const atr = atrMap.get(currentWindow.at(-1)?.date ?? "");
    if (atr === undefined || rsiStd === null) {
      continue;
    }

    const safeAtr = Math.max(atr, Number.EPSILON);
    const safeRsiStd = Math.max(rsiStd, 0.0001);
    const priceSlopeNorm = (currentPriceReg - previousPriceReg) / safeAtr;
    const rsiSlopeNorm = (currentRsiReg - previousRsiReg) / safeRsiStd;
    const rawScore = rsiSlopeNorm - RSI_SCORE_PRICE_WEIGHT * priceSlopeNorm;
    const score = 100 * tanh(rawScore / RSI_SCORE_SCALE);

    scoreInputs.push({
      date: currentWindow.at(-1)?.date ?? "",
      value: score,
    });
  }

  const smoothedValues = computeDema(
    scoreInputs.map((point) => point.value),
    RSI_SCORE_SMOOTHING
  );
  const scorePoints = scoreInputs.map((point, index) => ({
    date: point.date,
    value: SCORE_CENTER + smoothedValues[index] * SCORE_MULTIPLIER,
  }));

  return {
    scoreSeries: createDerivedSeries(
      outputBaseSeries,
      `${keyPrefix}:${outputBaseSeries.key}`,
      `RSI Divergence Score${labelSuffix} (${outputBaseSeries.label})`,
      `RSI Score${shortLabelSuffix} (${outputBaseSeries.shortLabel})`,
      "Um 50 zentrierter, trendgewichteter Momentum-Divergenz-Score mit low-lag Glaettung; oberhalb von 50 heisst Momentum staerker als die Preisaktion.",
      color,
      scorePoints
    ),
    rsiSeries,
  };
}

export function buildRsiScoreSeries(series: MacroSeries): MacroSeries | null {
  return (
    buildRsiScoreSeriesForInput(series, series, "rsi-score", "", "", "#2563eb")
      ?.scoreSeries ?? null
  );
}

export function buildWeeklyRsiScoreSeries(
  series: MacroSeries
): MacroSeries | null {
  const weeklySeries = buildWeeklySeries(series);
  if (!weeklySeries) {
    return null;
  }

  return (
    buildRsiScoreSeriesForInput(
      weeklySeries,
      series,
      "rsi-scorew",
      " W",
      " W",
      "#0f766e"
    )?.scoreSeries ?? null
  );
}

export function buildRsiScoreIndicators(series: MacroSeries): MacroSeries[] {
  return [
    buildRsiScoreSeries(series),
    buildWeeklyRsiScoreSeries(series),
  ].filter(
    (entry): entry is MacroSeries => entry !== null && entry.points.length > 0
  );
}

export function buildCompanionIndicatorSeries(
  assetSeries: MacroSeries,
  indicatorSeries: MacroSeries
): MacroSeries[] {
  const isWeeklyScore = indicatorSeries.key.startsWith("rsi-scorew:");
  const isDailyScore = indicatorSeries.key.startsWith("rsi-score:");

  if (!(isDailyScore || isWeeklyScore)) {
    return [];
  }

  const bundle = isWeeklyScore
    ? (() => {
        const weeklySeries = buildWeeklySeries(assetSeries);
        if (!weeklySeries) {
          return null;
        }

        return buildRsiScoreSeriesForInput(
          weeklySeries,
          assetSeries,
          "rsi-scorew",
          " W",
          " W",
          "#0f766e"
        );
      })()
    : buildRsiScoreSeriesForInput(
        assetSeries,
        assetSeries,
        "rsi-score",
        "",
        "",
        "#2563eb"
      );

  if (!bundle || bundle.scoreSeries.key !== indicatorSeries.key) {
    return [];
  }

  return bundle.rsiSeries.points.length > 0 ? [bundle.rsiSeries] : [];
}

function alignSeriesByDate(
  assetSeries: MacroSeries,
  rsiSeries: MacroSeries,
  indicatorSeries: MacroSeries
): Array<{
  date: string;
  priceLow: number;
  priceHigh: number;
  rsiValue?: number;
  scoreValue: number;
}> {
  const rsiValues = new Map(
    rsiSeries.points.map((point) => [point.date, point.value])
  );
  const scoreValues = new Map(
    indicatorSeries.points.map((point) => [point.date, point.value])
  );
  const candleValues = new Map(
    (assetSeries.candles ?? []).map((candle) => [
      candle.date,
      { low: candle.low, high: candle.high },
    ])
  );

  return assetSeries.points
    .filter((point) => scoreValues.has(point.date))
    .map((point) => ({
      date: point.date,
      priceLow: candleValues.get(point.date)?.low ?? point.value,
      priceHigh: candleValues.get(point.date)?.high ?? point.value,
      rsiValue: rsiValues.get(point.date),
      scoreValue: scoreValues.get(point.date) as number,
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

function isPivotLow(
  points: Array<{ pivotValue: number }>,
  index: number,
  leftRadius: number,
  rightRadius: number
): boolean {
  const target = points[index]?.pivotValue;
  if (target === undefined) {
    return false;
  }

  for (let offset = 1; offset <= leftRadius; offset += 1) {
    const left = points[index - offset]?.pivotValue;
    if (left === undefined || target >= left) {
      return false;
    }
  }

  for (let offset = 1; offset <= rightRadius; offset += 1) {
    const right = points[index + offset]?.pivotValue;
    if (right === undefined || target > right) {
      return false;
    }
  }

  return true;
}

function isPivotHigh(
  points: Array<{ pivotValue: number }>,
  index: number,
  leftRadius: number,
  rightRadius: number
): boolean {
  const target = points[index]?.pivotValue;
  if (target === undefined) {
    return false;
  }

  for (let offset = 1; offset <= leftRadius; offset += 1) {
    const left = points[index - offset]?.pivotValue;
    if (left === undefined || target <= left) {
      return false;
    }
  }

  for (let offset = 1; offset <= rightRadius; offset += 1) {
    const right = points[index + offset]?.pivotValue;
    if (right === undefined || target < right) {
      return false;
    }
  }

  return true;
}

export function buildRsiDivergenceMarkers(
  assetSeries: MacroSeries,
  indicatorSeries: MacroSeries
): DivergenceMarker[] {
  const isSupportedIndicator =
    indicatorSeries.key.startsWith("rsi-score:") ||
    indicatorSeries.key.startsWith("rsi-scorew:");

  if (!isSupportedIndicator) {
    return [];
  }

  const isWeekly = indicatorSeries.key.startsWith("rsi-scorew:");
  const priceSeries = isWeekly ? buildWeeklySeries(assetSeries) : assetSeries;
  if (!priceSeries) {
    return [];
  }

  const rsiSeries = computeBaseRsiSeries(priceSeries, RSI_PERIOD);
  if (!rsiSeries) {
    return [];
  }

  const aligned = alignSeriesByDate(
    priceSeries,
    rsiSeries,
    indicatorSeries
  ).map((point, index) => ({
    ...point,
    index,
    pivotValue: point.scoreValue,
  }));

  if (aligned.length < 7) {
    return [];
  }

  const pivotConfig = isWeekly
    ? WEEKLY_DIVERGENCE_PIVOT
    : DAILY_DIVERGENCE_PIVOT;
  const gapConfig = isWeekly ? WEEKLY_DIVERGENCE_GAP : DAILY_DIVERGENCE_GAP;
  const lowPivots = aligned.filter((_, index) =>
    isPivotLow(aligned, index, pivotConfig.left, pivotConfig.right)
  );
  const highPivots = aligned.filter((_, index) =>
    isPivotHigh(aligned, index, pivotConfig.left, pivotConfig.right)
  );
  const markers: DivergenceMarker[] = [];

  for (let idx = 1; idx < lowPivots.length; idx += 1) {
    const previous = lowPivots[idx - 1];
    const current = lowPivots[idx];
    const gap = current.index - previous.index;

    if (
      gap >= gapConfig.min &&
      gap <= gapConfig.max &&
      current.priceLow < previous.priceLow &&
      (previous.rsiValue === undefined ||
        current.rsiValue === undefined ||
        current.rsiValue > previous.rsiValue ||
        current.scoreValue >= previous.scoreValue + STRONG_SCORE_IMPROVEMENT) &&
      current.scoreValue >= BULLISH_SCORE_THRESHOLD &&
      current.scoreValue >= previous.scoreValue + MIN_SCORE_IMPROVEMENT
    ) {
      markers.push({
        key: `bull-div:${indicatorSeries.key}:${current.date}`,
        date: current.date,
        value: current.scoreValue,
        startDate: previous.date,
        startValue: previous.scoreValue,
        direction: "bullish",
        label: "Bull Score",
        indicatorKey: indicatorSeries.key,
        assetKey: assetSeries.key,
        color: "#16a34a",
      });
    }
  }

  for (let idx = 1; idx < highPivots.length; idx += 1) {
    const previous = highPivots[idx - 1];
    const current = highPivots[idx];
    const gap = current.index - previous.index;

    if (
      gap >= gapConfig.min &&
      gap <= gapConfig.max &&
      current.priceHigh > previous.priceHigh &&
      (previous.rsiValue === undefined ||
        current.rsiValue === undefined ||
        current.rsiValue < previous.rsiValue ||
        current.scoreValue <= previous.scoreValue - STRONG_SCORE_IMPROVEMENT) &&
      current.scoreValue <= BEARISH_SCORE_THRESHOLD &&
      current.scoreValue <= previous.scoreValue - MIN_SCORE_IMPROVEMENT
    ) {
      markers.push({
        key: `bear-div:${indicatorSeries.key}:${current.date}`,
        date: current.date,
        value: current.scoreValue,
        startDate: previous.date,
        startValue: previous.scoreValue,
        direction: "bearish",
        label: "Bear Score",
        indicatorKey: indicatorSeries.key,
        assetKey: assetSeries.key,
        color: "#dc2626",
      });
    }
  }

  return markers;
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
  right: MacroSeries
): Pick<PairCorrelation, "value" | "sampleSize"> | null {
  if (left.points.length < 3 || right.points.length < 3) {
    return null;
  }

  const rightValues = new Map(
    right.points.map((point) => [point.date, point.value])
  );
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
    if (!(Number.isFinite(leftRet) && Number.isFinite(rightRet))) {
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

      if (
        pair.value > 0 &&
        (!mostPositive || pair.value > mostPositive.value)
      ) {
        mostPositive = pair;
      }

      if (
        pair.value < 0 &&
        (!mostNegative || pair.value < mostNegative.value)
      ) {
        mostNegative = pair;
      }
    }
  }

  return { mostPositive, mostNegative };
}

export function buildOverlayData(
  series: MacroSeries[],
  scaleMode: ChartScaleMode
): Array<{ date: string } & Record<string, number | string>> {
  const rowsByDate = new Map<
    string,
    { date: string } & Record<string, number | string>
  >();
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
    const startIndex = item.points.findIndex(
      (point) => point.date >= commonStartDate
    );
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
