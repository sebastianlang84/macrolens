"use client";

import { format, parseISO } from "date-fns";
import { SeriesChart } from "@/components/series-chart";
import type { DashboardData } from "@/types/macro";

type Props = {
  data: DashboardData;
};

function signalToneClasses(tone: "positive" | "neutral" | "negative"): string {
  if (tone === "positive") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }
  if (tone === "negative") {
    return "border-rose-200 bg-rose-50 text-rose-900";
  }
  return "border-amber-200 bg-amber-50 text-amber-900";
}

export function DashboardClient({ data }: Props) {
  const generatedLabel = format(parseISO(data.generatedAt), "dd.MM.yyyy HH:mm");

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <section className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-slate-950 p-6 text-white shadow-xl md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.22),transparent_36%),radial-gradient(circle_at_90%_20%,rgba(16,185,129,0.18),transparent_32%),radial-gradient(circle_at_50%_120%,rgba(251,191,36,0.15),transparent_40%)]" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.22em] text-sky-200">MacroLens</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
              Makro-Dashboard mit FRED + Yahoo Finance und erklärbaren Ableitungen
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
              Lernorientierter MVP: Server-seitiges Daten-Fetching, Chart-Visualisierung und einfache
              Interpretationen (Trend, Breite, Volatilität, Öl, Zinsregime, Payrolls).
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                Next.js App Router
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                TypeScript
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                Recharts
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                Route Handler API
              </span>
            </div>
            <p className="mt-4 text-xs text-slate-400">Letztes Update (Server): {generatedLabel}</p>
          </div>
        </div>
      </section>

      {data.warnings.length > 0 ? (
        <section className="mx-auto mt-5 max-w-7xl">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Hinweise</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {data.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="mx-auto mt-6 max-w-7xl">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Makro-Ableitungen</h2>
            <p className="text-sm text-slate-600">
              Keine Handelsberatung, sondern nachvollziehbare Heuristiken aus den geladenen Zeitreihen.
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.signals.map((signal) => (
            <article
              key={signal.id}
              className={`rounded-2xl border p-4 shadow-sm ${signalToneClasses(signal.tone)}`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">{signal.label}</h3>
                <span className="rounded-full border border-current/20 bg-white/60 px-2 py-0.5 text-xs font-semibold">
                  {signal.value}
                </span>
              </div>
              <p className="mt-2 text-sm leading-5 opacity-90">{signal.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-7xl">
        <div className="mb-3">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Charts</h2>
          <p className="text-sm text-slate-600">
            Jede Karte zeigt Quelle, aktuelle Werte und einfache Veränderungsraten (1M/3M/1Y).
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {data.series.map((series) => (
            <SeriesChart key={series.key} series={series} />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-7xl">
        <div className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Wie entsteht diese Website?</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
              <li>Server lädt Rohdaten von FRED/Yahoo.</li>
              <li>TypeScript normalisiert die Daten in ein gemeinsames Format.</li>
              <li>Makro-Regeln erzeugen interpretierbare Signale.</li>
              <li>React rendert UI-Komponenten; Recharts zeichnet Liniencharts.</li>
            </ol>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Wichtige Begriffe</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>
                <strong>Server Component:</strong> Lädt Daten sicher auf dem Server (API Keys bleiben dort).
              </li>
              <li>
                <strong>Client Component:</strong> Interaktive UI im Browser (z. B. Charts).
              </li>
              <li>
                <strong>Route Handler:</strong> Eigene API unter <code>/api/dashboard</code>.
              </li>
              <li>
                <strong>Normalisierung:</strong> Unterschiedliche APIs in ein gemeinsames Datenformat.
              </li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Datenbank (später)</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Für den MVP speichern wir nichts dauerhaft. Eine Datenbank kommt ins Spiel, wenn du Caching,
              Historisierung eigener Berechnungen, Nutzerkonten oder schnellere Ladezeiten brauchst.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Typischer nächster Schritt: PostgreSQL + Prisma (optional TimescaleDB für Zeitreihen).
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
