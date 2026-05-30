"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api-client";
import { PredictionPanel } from "../../../components/prediction-panel";

export default function MatchPage({ params }: { params: { id: string } }) {
  const { data: match, isLoading } = useQuery({
    queryKey: ["match", params.id],
    queryFn: () => api.match(params.id),
  });

  if (isLoading) return <p className="text-white/40">Loading…</p>;
  if (!match) return <p className="text-white/40">Match not found.</p>;

  const finished = match.status === "FINISHED";

  return (
    <main className="flex flex-col gap-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-2 text-xs uppercase tracking-wide text-white/40">
          {match.season} · Matchday {match.matchday} ·{" "}
          {new Date(match.utcDate).toLocaleString()}
        </div>
        <div className="flex items-center justify-between">
          <span className="flex-1 text-xl font-semibold">{match.homeTeamName}</span>
          <span className="px-6 text-3xl font-bold tabular-nums">
            {finished ? `${match.homeGoals} – ${match.awayGoals}` : "vs"}
          </span>
          <span className="flex-1 text-right text-xl font-semibold">
            {match.awayTeamName}
          </span>
        </div>
        {match.homeXg !== null && (
          <div className="mt-3 flex justify-between text-xs text-white/50">
            <span>xG {match.homeXg}</span>
            <span>xG {match.awayXg}</span>
          </div>
        )}
      </section>

      <PredictionPanel matchId={match.id} />
    </main>
  );
}
