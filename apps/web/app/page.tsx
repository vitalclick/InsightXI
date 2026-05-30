export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-24">
      <span className="text-sm font-medium uppercase tracking-widest text-insight">
        InsightXI
      </span>
      <h1 className="text-4xl font-bold sm:text-5xl">
        True Football Intelligence Platform
      </h1>
      <p className="text-lg text-white/70">
        Transparent, explainable football analytics powered by modern AI.
        Predictions are presented as statistical probabilities — never as
        guaranteed outcomes.
      </p>
      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
        Web scaffold is live. Next: wire up the Match Intelligence module
        against the API (<code>NEXT_PUBLIC_API_URL</code>).
      </div>
    </main>
  );
}
