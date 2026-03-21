import { formatNumber } from "@/lib/formatters";
import type { MacroSeries, MacroSignal, TimePoint } from "@/types/macro";

export type MacroSignalRule = (
  series: MacroSeries[]
) => MacroSignal | null;

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

function volatilitySignal(series: MacroSeries[]): MacroSignal | null {
  const vix = getSeries(series, "vix");
  const value = vix?.stats.latestValue ?? null;
  if (value === null) {
    return null;
  }

  if (value >= 25) {
    return {
      id: "volatility",
      label: "Volatilitätsregime",
      tone: "negative",
      value: `${formatNumber(value, 1)} VIX`,
      summary:
        "Erhöhte Risikoaversion; Markt reagiert sensibler auf Makro-News.",
    };
  }

  if (value <= 18) {
    return {
      id: "volatility",
      label: "Volatilitätsregime",
      tone: "positive",
      value: `${formatNumber(value, 1)} VIX`,
      summary: "Ruhiges Marktumfeld; Risikoappetit ist tendenziell höher.",
    };
  }

  return {
    id: "volatility",
    label: "Volatilitätsregime",
    tone: "neutral",
    value: `${formatNumber(value, 1)} VIX`,
    summary:
      "Mittlere Unsicherheit; kein klares Stress- oder Sorglosigkeits-Signal.",
  };
}

function trendSignal(series: MacroSeries[]): MacroSignal | null {
  const spx = getSeries(series, "sp500");
  if (!spx || spx.points.length < 200) {
    return null;
  }

  const latest = lastPoint(spx.points);
  const ma200 = movingAverage(spx.points, 200);
  if (!latest || ma200 === null) {
    return null;
  }

  const distancePct = ((latest.value - ma200) / ma200) * 100;

  return {
    id: "equity-trend",
    label: "Aktien-Trend (S&P vs. 200d)",
    tone: distancePct >= 0 ? "positive" : "negative",
    value: `${distancePct >= 0 ? "+" : ""}${formatNumber(distancePct, 1)} %`,
    summary:
      distancePct >= 0
        ? "Index über 200-Tage-Durchschnitt: Trendstruktur ist konstruktiv."
        : "Index unter 200-Tage-Durchschnitt: Trendstruktur ist angeschlagen.",
  };
}

function breadthSignal(series: MacroSeries[]): MacroSignal | null {
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

  const spread = ew3m - spx3m;
  let tone: MacroSignal["tone"] = "neutral";
  let summary = "Breitenbild ist gemischt; keine klare Divergenz.";

  if (spread > 1) {
    tone = "positive";
    summary =
      "Equal Weight schlägt den Index: Aufwärtsphase wirkt breiter abgestützt.";
  } else if (spread < -1) {
    tone = "negative";
    summary =
      "Equal Weight hinkt hinterher: Führung ist enger (Mega-Caps dominieren).";
  }

  return {
    id: "breadth",
    label: "Marktbreite (Equal Weight vs. S&P)",
    tone,
    value: `${spread >= 0 ? "+" : ""}${formatNumber(spread, 1)} pp`,
    summary,
  };
}

function oilSignal(series: MacroSeries[]): MacroSignal | null {
  const oil = getSeries(series, "oil");
  const oil3m = oil?.stats.change3mPct ?? null;
  if (oil3m === null) {
    return null;
  }

  let tone: MacroSignal["tone"] = "neutral";
  let summary = "Öl bewegt sich ohne klaren makroökonomischen Schockimpuls.";

  if (oil3m > 15) {
    tone = "negative";
    summary =
      "Starker Ölpreisanstieg kann Inflations- und Margendruck erhöhen.";
  } else if (oil3m < -10) {
    tone = "positive";
    summary =
      "Fallende Energiepreise entlasten tendenziell Inflation und Kosten.";
  }

  return {
    id: "oil",
    label: "Ölpreis-Impuls (3M)",
    tone,
    value: `${oil3m >= 0 ? "+" : ""}${formatNumber(oil3m, 1)} %`,
    summary,
  };
}

function payrollSignal(series: MacroSeries[]): MacroSignal | null {
  const payrolls = getSeries(series, "payrolls");
  if (!payrolls) {
    return null;
  }

  const delta = monthlyLevelChange(payrolls.points);
  if (delta === null) {
    return null;
  }

  let tone: MacroSignal["tone"] = "neutral";
  let summary = "Arbeitsmarkt wächst, aber ohne klaren Beschleunigungsimpuls.";

  if (delta > 80) {
    tone = "positive";
    summary =
      "Beschäftigung wächst weiter solide; Rezessionssignal aktuell schwächer.";
  } else if (delta < 20) {
    tone = "negative";
    summary =
      "Schwaches Beschäftigungswachstum; Konjunkturabkühlung wahrscheinlicher.";
  }

  return {
    id: "payrolls",
    label: "Arbeitsmarkt-Momentum",
    tone,
    value: `${formatNumber(delta, 0)} Tsd`,
    summary,
  };
}

function policySignal(series: MacroSeries[]): MacroSignal | null {
  const fed = getSeries(series, "fedfunds");
  const latest = fed?.stats.latestValue ?? null;
  const change1y = fed?.stats.change1yPct ?? null;
  if (latest === null) {
    return null;
  }

  let tone: MacroSignal["tone"] = "neutral";
  if (latest >= 4.5) {
    tone = "negative";
  } else if (latest <= 2) {
    tone = "positive";
  }

  return {
    id: "policy",
    label: "Zinsregime (Fed Funds)",
    tone,
    value: `${formatNumber(latest, 2)} %`,
    summary:
      change1y !== null && Math.abs(change1y) > 5
        ? "Zinsniveau wirkt makroprägend; prüfe immer Richtung und Geschwindigkeit der Änderungen."
        : "Zinsniveau ist ein Kern-Treiber für Bewertungen, Kreditkosten und Risikoappetit.",
  };
}

function yieldCurveSignal(series: MacroSeries[]): MacroSignal | null {
  const y10 = getSeries(series, "dgs10")?.stats.latestValue ?? null;
  const y2 = getSeries(series, "dgs2")?.stats.latestValue ?? null;
  if (y10 === null || y2 === null) {
    return null;
  }

  const slope = y10 - y2;
  let tone: MacroSignal["tone"] = "neutral";
  let summary = "Flache Kurve: Übergangsphase, Richtung bleibt datenabhängig.";

  if (slope > 0.5) {
    tone = "positive";
    summary =
      "Normale/steilere Kurve: Rezessionssignal aus der Zinskurve aktuell schwächer.";
  } else if (slope < 0) {
    tone = "negative";
    summary =
      "Inverse Kurve: klassisches Warnsignal für Wachstums-/Rezessionsrisiken.";
  }

  return {
    id: "yield-curve",
    label: "Yield Curve (10Y-2Y)",
    tone,
    value: `${slope >= 0 ? "+" : ""}${formatNumber(slope, 2)} pp`,
    summary,
  };
}

function inflationSignal(series: MacroSeries[]): MacroSignal | null {
  const cpi = getSeries(series, "cpi");
  const yoy = cpi?.stats.change1yPct ?? null;
  if (yoy === null) {
    return null;
  }

  let tone: MacroSignal["tone"] = "neutral";
  let summary =
    "Inflation liegt in einer Zwischenzone; zusätzliche Daten bleiben wichtig.";

  if (yoy > 3.5) {
    tone = "negative";
    summary = "Höhere Inflation kann Zinsdruck und Bewertungsrisiken erhöhen.";
  } else if (yoy < 2.5) {
    tone = "positive";
    summary =
      "Moderater Preisauftrieb entlastet tendenziell das Zins-/Bewertungsumfeld.";
  }

  return {
    id: "inflation",
    label: "Inflationsimpuls (CPI YoY, Proxy)",
    tone,
    value: `${yoy >= 0 ? "+" : ""}${formatNumber(yoy, 1)} %`,
    summary,
  };
}

function unemploymentSignal(series: MacroSeries[]): MacroSignal | null {
  const unrate = getSeries(series, "unrate");
  const latest = unrate?.stats.latestValue ?? null;
  const change3m = unrate ? levelChangeOverDays(unrate.points, 90) : null;
  if (latest === null || change3m === null) {
    return null;
  }

  let tone: MacroSignal["tone"] = "neutral";
  let summary =
    "Arbeitslosenquote relativ stabil; kein starkes Konjunktursignal aus diesem Indikator.";

  if (change3m > 0.4) {
    tone = "negative";
    summary =
      "Arbeitslosenquote steigt spürbar: Wachstumsbild schwächt sich tendenziell ab.";
  } else if (change3m < -0.2) {
    tone = "positive";
    summary =
      "Arbeitsmarkt verbessert sich über 3 Monate; Konjunkturbild stabiler.";
  }

  return {
    id: "unemployment",
    label: "Arbeitslosenquote (3M Delta)",
    tone,
    value: `${formatNumber(latest, 1)} % (${change3m >= 0 ? "+" : ""}${formatNumber(change3m, 1)} pp)`,
    summary,
  };
}

function creditSignal(series: MacroSeries[]): MacroSignal | null {
  const hy = getSeries(series, "hy_oas");
  const ig = getSeries(series, "ig_oas");
  const hyLatest = hy?.stats.latestValue ?? null;
  const igLatest = ig?.stats.latestValue ?? null;

  if (hyLatest === null || igLatest === null) {
    return null;
  }

  const hy3mDelta = hy ? levelChangeOverDays(hy.points, 90) : null;
  const ig3mDelta = ig ? levelChangeOverDays(ig.points, 90) : null;
  const hyIgGap = hyLatest - igLatest;

  const stress =
    hyLatest > 5.5 || hyIgGap > 4.0 || (hy3mDelta !== null && hy3mDelta > 0.8);
  const easy =
    hyLatest < 4.0 &&
    hyIgGap < 3.0 &&
    (hy3mDelta === null || hy3mDelta < 0.3) &&
    (ig3mDelta === null || ig3mDelta < 0.15);
  let tone: MacroSignal["tone"] = "neutral";
  let summary =
    "Credit-Spreads senden ein gemischtes Signal; weder klarer Stress noch klare Entspannung.";

  if (stress) {
    tone = "negative";
    summary =
      "Breitere Credit-Spreads deuten auf steigende Risikoaversion und straffere Finanzierungsbedingungen hin.";
  } else if (easy) {
    tone = "positive";
    summary =
      "Enge Credit-Spreads sprechen für entspanntes Risikosentiment und leichtere Finanzierung.";
  }

  return {
    id: "credit",
    label: "Credit-Regime (HY/IG Spreads)",
    tone,
    value: `HY ${formatNumber(hyLatest, 2)} / IG ${formatNumber(igLatest, 2)} %`,
    summary,
  };
}

export const MACRO_SIGNAL_RULES: MacroSignalRule[] = [
  trendSignal,
  breadthSignal,
  yieldCurveSignal,
  creditSignal,
  volatilitySignal,
  oilSignal,
  inflationSignal,
  payrollSignal,
  unemploymentSignal,
  policySignal,
];
