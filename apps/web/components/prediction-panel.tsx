"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api-client";

function Pct({ value }: { value: number }) {
  return <span className="tabular-nums">{(value * 100).toFixed(0)}%</span>;
}

export function PredictionPanel({ matchId }: { matchId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["prediction", matchId],
    queryFn: () => api.prediction(matchId),
    retry: 0,
  });

  if (isLoading) return <p className="text-white/40">Computing intelligence…</p>;
  if (isError || !data)
    return (
      <p className="text-sm text-white/40">
        Match intelligence unavailable (AI service offline).
      </p>
    );

  const { outcome } = data;
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Match Intelligence</h2>
        <span className="rounded-full border border-insight/40 bg-insight/10 px-3 py-1 text-xs font-medium text-insight">
          {data.confidenceLevel}
        </span>
      </div>

      {/* 1X2 probability bar */}
      <div className="flex overflow-hidden rounded-lg text-center text-xs font-medium">
        <div className="bg-signal/70 py-2 text-black" style={{ width: `${outcome.homeWin * 100}%` }}>
          <Pct value={outcome.homeWin} />
        </div>
        <div className="bg-white/20 py-2" style={{ width: `${outcome.draw * 100}%` }}>
          <Pct value={outcome.draw} />
        </div>
        <div className="bg-insight/70 py-2" style={{ width: `${outcome.awayWin * 100}%` }}>
          <Pct value={outcome.awayWin} />
        </div>
      </div>
      <div className="flex justify-between text-xs text-white/50">
        <span>Home win</span>
        <span>Draw</span>
        <span>Away win</span>
      </div>

      <div className="text-sm text-white/60">
        Expected goals: {data.expectedGoals.home} – {data.expectedGoals.away}
      </div>

      {/* Markets */}
      <div className="grid gap-2 sm:grid-cols-2">
        {data.markets.map((m) => (
          <div
            key={m.market}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
          >
            <span className="text-white/70">{m.label}</span>
            <span className="font-semibold">
              <Pct value={m.probability} />
            </span>
          </div>
        ))}
      </div>

      {/* Explanations */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 className="mb-2 text-sm font-semibold text-white/80">Why this prediction</h3>
        <ul className="flex flex-col gap-1 text-sm text-white/60">
          {data.explanations.map((e, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-insight">›</span>
              {e}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-white/30">
        Probabilistic intelligence for analytical purposes — not betting advice
        or a guaranteed outcome.
      </p>
    </section>
  );
}
