"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="min-h-screen px-4 py-10 md:px-8">
      <section className="mx-auto max-w-2xl rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <p className="text-rose-700 text-xs uppercase tracking-[0.2em]">
          Fehlerzustand
        </p>
        <h1 className="mt-3 font-semibold text-2xl text-slate-900 tracking-tight">
          Das Dashboard konnte nicht geladen werden
        </h1>
        <p className="mt-3 text-slate-700 text-sm leading-6">
          Eine Datenquelle war möglicherweise nicht erreichbar oder hat ein
          unerwartetes Format geliefert. Das ist der Grund, warum wir
          Fehlerseiten und Runtime-Validierung eingebaut haben.
        </p>
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-slate-600 text-xs">
          Technischer Hinweis: {error.message || "Unbekannter Fehler"}
        </p>
        <button
          className="mt-4 rounded-xl bg-slate-900 px-4 py-2 font-medium text-sm text-white transition hover:bg-slate-700"
          onClick={reset}
          type="button"
        >
          Erneut versuchen
        </button>
      </section>
    </main>
  );
}
