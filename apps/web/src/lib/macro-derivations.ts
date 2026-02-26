import type { DashboardData, MacroSeries, MacroSignal, TimePoint } from "@/types/macro";
import { formatNumber } from "@/lib/formatters";

function getSeries(series: MacroSeries[], key: string): MacroSeries | undefined {
  return series.find((item) => item.key === key);
}

function lastPoint(points: TimePoint[]): TimePoint | null {
  return points.length > 0 ? points[points.length - 1] : null;
}

function movingAverage(points: TimePoint[], window: number): number | null {
  if (points.length < window) {
    return null;
  }

  const slice = points.slice(-window);
  const sum = slice.reduce((acc, point) => acc + point.value, 0);
  return sum / slice.length;
}

function pickPointNearEnd(points: TimePoint[], daysBack: number): TimePoint | null {
  if (points.length === 0) {
    return null;
  }

  const latestTs = new Date(points[points.length - 1].date).getTime();
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
  if (!end || !start || start.value === 0) {
    return null;
  }
  return ((end.value - start.value) / start.value) * 100;
}

function monthlyLevelChange(points: TimePoint[]): number | null {
  if (points.length < 2) {
    return null;
  }
  const end = points[points.length - 1];
  const prev = points[points.length - 2];
  return end.value - prev.value;
}

function levelChangeOverDays(points: TimePoint[], daysBack: number): number | null {
  const end = lastPoint(points);
  const start = pickPointNearEnd(points, daysBack);
  if (!end || !start) {
    return null;
  }
  return end.value - start.value;
}

function addSignal(
  signals: MacroSignal[],
  signal: MacroSignal | null,
): void {
  if (signal) {
    signals.push(signal);
  }
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
      summary: "Erhöhte Risikoaversion; Markt reagiert sensibler auf Makro-News.",
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
    summary: "Mittlere Unsicherheit; kein klares Stress- oder Sorglosigkeits-Signal.",
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
  if (!spx || !ew) {
    return null;
  }

  const spx3m = trailingReturn(spx.points, 90);
  const ew3m = trailingReturn(ew.points, 90);
  if (spx3m === null || ew3m === null) {
    return null;
  }

  const spread = ew3m - spx3m;

  return {
    id: "breadth",
    label: "Marktbreite (Equal Weight vs. S&P)",
    tone: spread > 1 ? "positive" : spread < -1 ? "negative" : "neutral",
    value: `${spread >= 0 ? "+" : ""}${formatNumber(spread, 1)} pp`,
    summary:
      spread > 1
        ? "Equal Weight schlägt den Index: Aufwärtsphase wirkt breiter abgestützt."
        : spread < -1
          ? "Equal Weight hinkt hinterher: Führung ist enger (Mega-Caps dominieren)."
          : "Breitenbild ist gemischt; keine klare Divergenz.",
  };
}

function oilSignal(series: MacroSeries[]): MacroSignal | null {
  const oil = getSeries(series, "oil");
  const oil3m = oil?.stats.change3mPct ?? null;
  if (oil3m === null) {
    return null;
  }

  return {
    id: "oil",
    label: "Ölpreis-Impuls (3M)",
    tone: oil3m > 15 ? "negative" : oil3m < -10 ? "positive" : "neutral",
    value: `${oil3m >= 0 ? "+" : ""}${formatNumber(oil3m, 1)} %`,
    summary:
      oil3m > 15
        ? "Starker Ölpreisanstieg kann Inflations- und Margendruck erhöhen."
        : oil3m < -10
          ? "Fallende Energiepreise entlasten tendenziell Inflation und Kosten."
          : "Öl bewegt sich ohne klaren makroökonomischen Schockimpuls.",
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

  return {
    id: "payrolls",
    label: "Arbeitsmarkt-Momentum",
    tone: delta > 80 ? "positive" : delta < 20 ? "negative" : "neutral",
    value: `${formatNumber(delta, 0)} Tsd`,
    summary:
      delta > 80
        ? "Beschäftigung wächst weiter solide; Rezessionssignal aktuell schwächer."
        : delta < 20
          ? "Schwaches Beschäftigungswachstum; Konjunkturabkühlung wahrscheinlicher."
          : "Arbeitsmarkt wächst, aber ohne klaren Beschleunigungsimpuls.",
  };
}

function policySignal(series: MacroSeries[]): MacroSignal | null {
  const fed = getSeries(series, "fedfunds");
  const latest = fed?.stats.latestValue ?? null;
  const change1y = fed?.stats.change1yPct ?? null;
  if (latest === null) {
    return null;
  }

  return {
    id: "policy",
    label: "Zinsregime (Fed Funds)",
    tone: latest >= 4.5 ? "negative" : latest <= 2 ? "positive" : "neutral",
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

  return {
    id: "yield-curve",
    label: "Yield Curve (10Y-2Y)",
    tone: slope > 0.5 ? "positive" : slope < 0 ? "negative" : "neutral",
    value: `${slope >= 0 ? "+" : ""}${formatNumber(slope, 2)} pp`,
    summary:
      slope > 0.5
        ? "Normale/steilere Kurve: Rezessionssignal aus der Zinskurve aktuell schwächer."
        : slope < 0
          ? "Inverse Kurve: klassisches Warnsignal für Wachstums-/Rezessionsrisiken."
          : "Flache Kurve: Übergangsphase, Richtung bleibt datenabhängig.",
  };
}

function inflationSignal(series: MacroSeries[]): MacroSignal | null {
  const cpi = getSeries(series, "cpi");
  const yoy = cpi?.stats.change1yPct ?? null;
  if (yoy === null) {
    return null;
  }

  return {
    id: "inflation",
    label: "Inflationsimpuls (CPI YoY, Proxy)",
    tone: yoy > 3.5 ? "negative" : yoy < 2.5 ? "positive" : "neutral",
    value: `${yoy >= 0 ? "+" : ""}${formatNumber(yoy, 1)} %`,
    summary:
      yoy > 3.5
        ? "Höhere Inflation kann Zinsdruck und Bewertungsrisiken erhöhen."
        : yoy < 2.5
          ? "Moderater Preisauftrieb entlastet tendenziell das Zins-/Bewertungsumfeld."
          : "Inflation liegt in einer Zwischenzone; zusätzliche Daten bleiben wichtig.",
  };
}

function unemploymentSignal(series: MacroSeries[]): MacroSignal | null {
  const unrate = getSeries(series, "unrate");
  const latest = unrate?.stats.latestValue ?? null;
  const change3m = unrate ? levelChangeOverDays(unrate.points, 90) : null;
  if (latest === null || change3m === null) {
    return null;
  }

  return {
    id: "unemployment",
    label: "Arbeitslosenquote (3M Delta)",
    tone: change3m > 0.4 ? "negative" : change3m < -0.2 ? "positive" : "neutral",
    value: `${formatNumber(latest, 1)} % (${change3m >= 0 ? "+" : ""}${formatNumber(change3m, 1)} pp)`,
    summary:
      change3m > 0.4
        ? "Arbeitslosenquote steigt spürbar: Wachstumsbild schwächt sich tendenziell ab."
        : change3m < -0.2
          ? "Arbeitsmarkt verbessert sich über 3 Monate; Konjunkturbild stabiler."
          : "Arbeitslosenquote relativ stabil; kein starkes Konjunktursignal aus diesem Indikator.",
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

  return {
    id: "credit",
    label: "Credit-Regime (HY/IG Spreads)",
    tone: stress ? "negative" : easy ? "positive" : "neutral",
    value: `HY ${formatNumber(hyLatest, 2)} / IG ${formatNumber(igLatest, 2)} %`,
    summary: stress
      ? "Breitere Credit-Spreads deuten auf steigende Risikoaversion und straffere Finanzierungsbedingungen hin."
      : easy
        ? "Enge Credit-Spreads sprechen für entspanntes Risikosentiment und leichtere Finanzierung."
        : "Credit-Spreads senden ein gemischtes Signal; weder klarer Stress noch klare Entspannung.",
  };
}

export function deriveMacroSignals(series: MacroSeries[]): MacroSignal[] {
  const signals: MacroSignal[] = [];

  addSignal(signals, trendSignal(series));
  addSignal(signals, breadthSignal(series));
  addSignal(signals, yieldCurveSignal(series));
  addSignal(signals, creditSignal(series));
  addSignal(signals, volatilitySignal(series));
  addSignal(signals, oilSignal(series));
  addSignal(signals, inflationSignal(series));
  addSignal(signals, payrollSignal(series));
  addSignal(signals, unemploymentSignal(series));
  addSignal(signals, policySignal(series));

  return signals;
}

export function attachWarnings(baseWarnings: string[], data: DashboardData): string[] {
  const warnings = [...baseWarnings];

  const missing = data.series.filter((series) => series.error).map((series) => series.label);
  if (missing.length > 0) {
    warnings.push(`Einige Serien konnten nicht geladen werden: ${missing.join(", ")}.`);
  }

  const proxies = data.series
    .filter((series) => series.proxyNote)
    .map((series) => `${series.shortLabel}: ${series.proxyNote}`);

  warnings.push(...proxies);

  return warnings;
}
