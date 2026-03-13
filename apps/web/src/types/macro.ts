export type DataSource = "fred" | "yahoo";

export type SeriesUnit = "index" | "usd" | "percent" | "thousand_persons";

export type TimePoint = {
  date: string;
  value: number;
};

export type CandlePoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type SeriesStats = {
  latestValue: number | null;
  change1mPct: number | null;
  change3mPct: number | null;
  change1yPct: number | null;
};

export type MacroSeries = {
  key: string;
  label: string;
  shortLabel: string;
  source: DataSource;
  unit: SeriesUnit;
  description: string;
  proxyNote?: string;
  points: TimePoint[];
  candles?: CandlePoint[];
  color: string;
  stats: SeriesStats;
  error?: string;
};

export type SignalTone = "positive" | "neutral" | "negative";

export type MacroSignal = {
  id: string;
  label: string;
  tone: SignalTone;
  value: string;
  summary: string;
};

export type DashboardData = {
  generatedAt: string;
  series: MacroSeries[];
  signals: MacroSignal[];
  warnings: string[];
};
