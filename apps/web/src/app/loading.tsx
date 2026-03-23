export default function Loading() {
  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <section className="mx-auto max-w-7xl animate-pulse">
        <div className="rounded-3xl border border-white/20 bg-slate-900 p-6 md:p-8">
          <div className="h-3 w-24 rounded bg-slate-700" />
          <div className="mt-4 h-8 w-2/3 rounded bg-slate-700" />
          <div className="mt-3 h-4 w-5/6 rounded bg-slate-800" />
          <div className="mt-2 h-4 w-1/2 rounded bg-slate-800" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 6 }, (_, slot) => slot).map((slot) => (
            <div
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              key={`skeleton-${slot}`}
            >
              <div className="h-4 w-40 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-3/4 rounded bg-slate-100" />
              <div className="mt-4 h-40 rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
