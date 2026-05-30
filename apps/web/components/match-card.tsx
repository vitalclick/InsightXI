import Link from "next/link";
import type { MatchView } from "../lib/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function MatchCard({ match }: { match: MatchView }) {
  const finished = match.status === "FINISHED";
  return (
    <Link
      href={`/matches/${match.id}`}
      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-insight/60 hover:bg-white/10"
    >
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-sm font-medium">{match.homeTeamName}</span>
        <span className="text-sm font-medium">{match.awayTeamName}</span>
      </div>
      <div className="px-4 text-center">
        {finished ? (
          <div className="flex flex-col text-lg font-bold tabular-nums">
            <span>{match.homeGoals}</span>
            <span>{match.awayGoals}</span>
          </div>
        ) : (
          <span className="text-xs text-white/50">{formatDate(match.utcDate)}</span>
        )}
      </div>
      <div className="w-20 text-right text-[11px] uppercase tracking-wide text-white/40">
        {finished ? "FT" : "Upcoming"} · MD{match.matchday}
      </div>
    </Link>
  );
}
