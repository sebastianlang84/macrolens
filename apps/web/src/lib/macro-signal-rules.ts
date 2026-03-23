import { formatNumber } from "@/lib/formatters";
import type {
  MacroSeries,
  MacroSignal,
  SignalTone,
  TimePoint,
} from "@/types/macro";

export type MacroSignalRule = (series: MacroSeries[]) => MacroSignal | null;

interface RuleCase<TMetric> {
  summary: string;
  tone: SignalTone;
  when: (metric: TMetric) => boolean;
}

interface RuleDefinition<TMetric> {
  cases: RuleCase<TMetric>[];
  defaultSummary: string;
  defaultTone?: SignalTone;
  formatValue: (metric: TMetric) => string;
  id: string;
  label: string;
  selectMetric: (series: MacroSeries[]) => TMetric | null;
}

interface BreadthMetric {
  spread: number;
}

interface CreditMetric {
  hy3mDelta: number | null;
  hyIgGap: number;
  hyLatest: number;
  ig3mDelta: number | null;
  igLatest: number;
}

interface PolicyMetric {
  change1y: number | null;
  latest: number;
}

interface TrendMetric {
  distancePct: number;
}

interface UnemploymentMetric {
  change3m: number;
  latest: number;
}

interface YieldCurveMetric {
  slope: number;
}

function getSeries(
  series: MacroSeries[],
  key: string
): MacroSeries | undefined {
  return series.find((item) => item.key === key);
}

function lastPoint(points: TimePoint[]): TimePoint | null {
  return points.at(-1) ?? null;
}

function movingAverage(points: TimePoint[], window: number): number | null {
  if (points.length < window) {
    return null;
  }

  const slice = points.slice(-window);
  const sum = slice.reduce((acc, point) => acc + point.value, 0);
  return sum / slice.length;
}

function pickPointNearEnd(
  points: TimePoint[],
  daysBack: number
): TimePoint | null {
  if (points.length === 0) {
    return null;
  }

  const latestPoint = points.at(-1);
  if (!latestPoint) {
    return null;
  }

  const latestTs = new Date(latestPoint.date).getTime();
  const targetTs = latestTs - daysBack * 24 * 60 * 60 * 1000;
  let selected: TimePoint | null = null;

  for (const point of points) {
    const ts = new Date(point.date).getTime();
    if (ts <= targetTs) {
      selected = point;
    } else {
      break;
    }
  }

  return selected;
}

function trailingReturn(points: TimePoint[], daysBack: number): number | null {
  const end = lastPoint(points);
  const start = pickPointNearEnd(points, daysBack);
  if (!(end && start) || start.value === 0) {
    return null;
  }

  return ((end.value - start.value) / start.value) * 100;
}

function monthlyLevelChange(points: TimePoint[]): number | null {
  if (points.length < 2) {
    return null;
  }

  const end = points.at(-1);
  const prev = points.at(-2);
  if (!(end && prev)) {
    return null;
  }

  return end.value - prev.value;
}

function levelChangeOverDays(
  points: TimePoint[],
  daysBack: number
): number | null {
  const end = lastPoint(points);
  const start = pickPointNearEnd(points, daysBack);
  if (!(end && start)) {
    return null;
  }

  return end.value - start.value;
}

function createMacroSignalRule<TMetric>(
  definition: RuleDefinition<TMetric>
): MacroSignalRule {
  return (series) => {
    const metric = definition.selectMetric(series);
    if (metric === null) {
      return null;
    }

    const matchingCase = definition.cases.find((candidate) =>
      candidate.when(metric)
    );

    return {
      id: definition.id,
      label: definition.label,
      tone: matchingCase?.tone ?? definition.defaultTone ?? "neutral",
      value: definition.formatValue(metric),
      summary: matchingCase?.summary ?? definition.defaultSummary,
    };
  };
}

const RULE_DEFINITIONS: Array<RuleDefinition<unknown>> = [
  {
    id: "equity-trend",
    label: "Aktien-Trend (S&P vs. 200d)",
    selectMetric(series): TrendMetric | null {
      const spx = getSeries(series, "sp500");
      if (!spx || spx.points.length < 200) {
        return null;
      }

      const latest = lastPoint(spx.points);
      const ma200 = movingAverage(spx.points, 200);
      if (!latest || ma200 === null) {
        return null;
      }

      return {
        distancePct: ((latest.value - ma200) / ma200) * 100,
      };
    },
    formatValue(metric) {
      const { distancePct } = metric as TrendMetric;
      return `${distancePct >= 0 ? "+" : ""}${formatNumber(distancePct, 1)} %`;
    },
    defaultTone: "negative",
    defaultSummary:
      "Index unter 200-Tage-Durchschnitt: Trendstruktur ist angeschlagen.",
    cases: [
      {
        tone: "positive",
        when: (metric) => (metric as TrendMetric).distancePct >= 0,
        summary:
          "Index über 200-Tage-Durchschnitt: Trendstruktur ist konstruktiv.",
      },
    ],
  },
  {
    id: "breadth",
    label: "Marktbreite (Equal Weight vs. S&P)",
    selectMetric(series): BreadthMetric | null {
      const spx = getSeries(series, "sp500");
      const ew = getSeries(series, "sp500_equal_weight");
      if (!(spx && ew)) {
        return null;
      }

      const spx3m = trailingReturn(spx.points, 90);
      const ew3m = trailingReturn(ew.points, 90);
      if (spx3m === null || ew3m === null) {
        return null;
      }

      return { spread: ew3m - spx3m };
    },
    formatValue(metric) {
      const { spread } = metric as BreadthMetric;
      return `${spread >= 0 ? "+" : ""}${formatNumber(spread, 1)} pp`;
    },
    defaultSummary: "Breitenbild ist gemischt; keine klare Divergenz.",
    cases: [
      {
        tone: "positive",
        when: (metric) => (metric as BreadthMetric).spread > 1,
        summary:
          "Equal Weight schlägt den Index: Aufwärtsphase wirkt breiter abgestützt.",
      },
      {
        tone: "negative",
        when: (metric) => (metric as BreadthMetric).spread < -1,
        summary:
          "Equal Weight hinkt hinterher: Führung ist enger (Mega-Caps dominieren).",
      },
    ],
  },
  {
    id: "yield-curve",
    label: "Yield Curve (10Y-2Y)",
    selectMetric(series): YieldCurveMetric | null {
      const y10 = getSeries(series, "dgs10")?.stats.latestValue ?? null;
      const y2 = getSeries(series, "dgs2")?.stats.latestValue ?? null;
      if (y10 === null || y2 === null) {
        return null;
      }

      return { slope: y10 - y2 };
    },
    formatValue(metric) {
      const { slope } = metric as YieldCurveMetric;
      return `${slope >= 0 ? "+" : ""}${formatNumber(slope, 2)} pp`;
    },
    defaultSummary:
      "Flache Kurve: Übergangsphase, Richtung bleibt datenabhängig.",
    cases: [
      {
        tone: "positive",
        when: (metric) => (metric as YieldCurveMetric).slope > 0.5,
        summary:
          "Normale/steilere Kurve: Rezessionssignal aus der Zinskurve aktuell schwächer.",
      },
      {
        tone: "negative",
        when: (metric) => (metric as YieldCurveMetric).slope < 0,
        summary:
          "Inverse Kurve: klassisches Warnsignal für Wachstums-/Rezessionsrisiken.",
      },
    ],
  },
  {
    id: "credit",
    label: "Credit-Regime (HY/IG Spreads)",
    selectMetric(series): CreditMetric | null {
      const hy = getSeries(series, "hy_oas");
      const ig = getSeries(series, "ig_oas");
      const hyLatest = hy?.stats.latestValue ?? null;
      const igLatest = ig?.stats.latestValue ?? null;
      if (hyLatest === null || igLatest === null) {
        return null;
      }

      return {
        hyLatest,
        igLatest,
        hyIgGap: hyLatest - igLatest,
        hy3mDelta: hy ? levelChangeOverDays(hy.points, 90) : null,
        ig3mDelta: ig ? levelChangeOverDays(ig.points, 90) : null,
      };
    },
    formatValue(metric) {
      const { hyLatest, igLatest } = metric as CreditMetric;
      return `HY ${formatNumber(hyLatest, 2)} / IG ${formatNumber(igLatest, 2)} %`;
    },
    defaultSummary:
      "Credit-Spreads senden ein gemischtes Signal; weder klarer Stress noch klare Entspannung.",
    cases: [
      {
        tone: "negative",
        when: (metric) => {
          const creditMetric = metric as CreditMetric;
          return (
            creditMetric.hyLatest > 5.5 ||
            creditMetric.hyIgGap > 4.0 ||
            (creditMetric.hy3mDelta !== null && creditMetric.hy3mDelta > 0.8)
          );
        },
        summary:
          "Breitere Credit-Spreads deuten auf steigende Risikoaversion und straffere Finanzierungsbedingungen hin.",
      },
      {
        tone: "positive",
        when: (metric) => {
          const creditMetric = metric as CreditMetric;
          return (
            creditMetric.hyLatest < 4.0 &&
            creditMetric.hyIgGap < 3.0 &&
            (creditMetric.hy3mDelta === null || creditMetric.hy3mDelta < 0.3) &&
            (creditMetric.ig3mDelta === null || creditMetric.ig3mDelta < 0.15)
          );
        },
        summary:
          "Enge Credit-Spreads sprechen für entspanntes Risikosentiment und leichtere Finanzierung.",
      },
    ],
  },
  {
    id: "volatility",
    label: "Volatilitätsregime",
    selectMetric(series): number | null {
      return getSeries(series, "vix")?.stats.latestValue ?? null;
    },
    formatValue(metric) {
      return `${formatNumber(metric as number, 1)} VIX`;
    },
    defaultSummary:
      "Mittlere Unsicherheit; kein klares Stress- oder Sorglosigkeits-Signal.",
    cases: [
      {
        tone: "negative",
        when: (metric) => (metric as number) >= 25,
        summary:
          "Erhöhte Risikoaversion; Markt reagiert sensibler auf Makro-News.",
      },
      {
        tone: "positive",
        when: (metric) => (metric as number) <= 18,
        summary:
          "Ruhiges Marktumfeld; Risikoappetit ist tendenziell höher.",
      },
    ],
  },
  {
    id: "oil",
    label: "Ölpreis-Impuls (3M)",
    selectMetric(series): number | null {
      return getSeries(series, "oil")?.stats.change3mPct ?? null;
    },
    formatValue(metric) {
      const value = metric as number;
      return `${value >= 0 ? "+" : ""}${formatNumber(value, 1)} %`;
    },
    defaultSummary:
      "Öl bewegt sich ohne klaren makroökonomischen Schockimpuls.",
    cases: [
      {
        tone: "negative",
        when: (metric) => (metric as number) > 15,
        summary:
          "Starker Ölpreisanstieg kann Inflations- und Margendruck erhöhen.",
      },
      {
        tone: "positive",
        when: (metric) => (metric as number) < -10,
        summary:
          "Fallende Energiepreise entlasten tendenziell Inflation und Kosten.",
      },
    ],
  },
  {
    id: "inflation",
    label: "Inflationsimpuls (CPI YoY, Proxy)",
    selectMetric(series): number | null {
      return getSeries(series, "cpi")?.stats.change1yPct ?? null;
    },
    formatValue(metric) {
      const value = metric as number;
      return `${value >= 0 ? "+" : ""}${formatNumber(value, 1)} %`;
    },
    defaultSummary:
      "Inflation liegt in einer Zwischenzone; zusätzliche Daten bleiben wichtig.",
    cases: [
      {
        tone: "negative",
        when: (metric) => (metric as number) > 3.5,
        summary:
          "Höhere Inflation kann Zinsdruck und Bewertungsrisiken erhöhen.",
      },
      {
        tone: "positive",
        when: (metric) => (metric as number) < 2.5,
        summary:
          "Moderater Preisauftrieb entlastet tendenziell das Zins-/Bewertungsumfeld.",
      },
    ],
  },
  {
    id: "payrolls",
    label: "Arbeitsmarkt-Momentum",
    selectMetric(series): number | null {
      const payrolls = getSeries(series, "payrolls");
      if (!payrolls) {
        return null;
      }

      return monthlyLevelChange(payrolls.points);
    },
    formatValue(metric) {
      return `${formatNumber(metric as number, 0)} Tsd`;
    },
    defaultSummary:
      "Arbeitsmarkt wächst, aber ohne klaren Beschleunigungsimpuls.",
    cases: [
      {
        tone: "positive",
        when: (metric) => (metric as number) > 80,
        summary:
          "Beschäftigung wächst weiter solide; Rezessionssignal aktuell schwächer.",
      },
      {
        tone: "negative",
        when: (metric) => (metric as number) < 20,
        summary:
          "Schwaches Beschäftigungswachstum; Konjunkturabkühlung wahrscheinlicher.",
      },
    ],
  },
  {
    id: "unemployment",
    label: "Arbeitslosenquote (3M Delta)",
    selectMetric(series): UnemploymentMetric | null {
      const unrate = getSeries(series, "unrate");
      const latest = unrate?.stats.latestValue ?? null;
      const change3m = unrate ? levelChangeOverDays(unrate.points, 90) : null;
      if (latest === null || change3m === null) {
        return null;
      }

      return { latest, change3m };
    },
    formatValue(metric) {
      const { latest, change3m } = metric as UnemploymentMetric;
      return `${formatNumber(latest, 1)} % (${change3m >= 0 ? "+" : ""}${formatNumber(change3m, 1)} pp)`;
    },
    defaultSummary:
      "Arbeitslosenquote relativ stabil; kein starkes Konjunktursignal aus diesem Indikator.",
    cases: [
      {
        tone: "negative",
        when: (metric) => (metric as UnemploymentMetric).change3m > 0.4,
        summary:
          "Arbeitslosenquote steigt spürbar: Wachstumsbild schwächt sich tendenziell ab.",
      },
      {
        tone: "positive",
        when: (metric) => (metric as UnemploymentMetric).change3m < -0.2,
        summary:
          "Arbeitsmarkt verbessert sich über 3 Monate; Konjunkturbild stabiler.",
      },
    ],
  },
  {
    id: "policy",
    label: "Zinsregime (Fed Funds)",
    selectMetric(series): PolicyMetric | null {
      const fed = getSeries(series, "fedfunds");
      const latest = fed?.stats.latestValue ?? null;
      if (latest === null) {
        return null;
      }

      return {
        latest,
        change1y: fed?.stats.change1yPct ?? null,
      };
    },
    formatValue(metric) {
      return `${formatNumber((metric as PolicyMetric).latest, 2)} %`;
    },
    defaultSummary:
      "Zinsniveau ist ein Kern-Treiber für Bewertungen, Kreditkosten und Risikoappetit.",
    cases: [
      {
        tone: "negative",
        when: (metric) => (metric as PolicyMetric).latest >= 4.5,
        summary:
          "Zinsniveau wirkt makroprägend; prüfe immer Richtung und Geschwindigkeit der Änderungen.",
      },
      {
        tone: "positive",
        when: (metric) => (metric as PolicyMetric).latest <= 2,
        summary:
          "Zinsniveau wirkt makroprägend; prüfe immer Richtung und Geschwindigkeit der Änderungen.",
      },
      {
        tone: "neutral",
        when: (metric) => {
          const policyMetric = metric as PolicyMetric;
          return (
            policyMetric.change1y !== null &&
            Math.abs(policyMetric.change1y) > 5
          );
        },
        summary:
          "Zinsniveau wirkt makroprägend; prüfe immer Richtung und Geschwindigkeit der Änderungen.",
      },
    ],
  },
];

export const MACRO_SIGNAL_RULES: MacroSignalRule[] = RULE_DEFINITIONS.map(
  (definition) => createMacroSignalRule(definition)
);
