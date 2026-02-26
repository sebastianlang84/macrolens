"use client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="min-h-screen px-4 py-10 md:px-8">
      <section className="mx-auto max-w-2xl rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-rose-700">Fehlerzustand</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          Das Dashboard konnte nicht geladen werden
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Eine Datenquelle war möglicherweise nicht erreichbar oder hat ein unerwartetes Format geliefert.
          Das ist der Grund, warum wir Fehlerseiten und Runtime-Validierung eingebaut haben.
        </p>
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          Technischer Hinweis: {error.message || "Unbekannter Fehler"}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Erneut versuchen
        </button>
      </section>
    </main>
  );
}

