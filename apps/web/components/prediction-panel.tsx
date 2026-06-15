"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api-client";
import { ProbabilityRing } from "./charts/probability-ring";
import { MarketBar } from "./charts/market-bar";
import { XgCompare } from "./charts/xg-compare";

const HOME_COLOR = "#22c55e"; // signal
const DRAW_COLOR = "rgba(255,255,255,0.35)";
const AWAY_COLOR = "#3b82f6"; // insight

function LegendDot({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-white/60">{label}</span>
      <span className="ml-auto font-semibold tabular-nums">{Math.round(value * 100)}%</span>
    </div>
  );
}

export function PredictionPanel({
  matchId,
  homeName = "Home",
  awayName = "Away",
}: {
  matchId: string;
  homeName?: string;
  awayName?: string;
}) {
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
  const top = Math.max(outcome.homeWin, outcome.draw, outcome.awayWin);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Match Intelligence</h2>
        <span className="rounded-full border border-insight/40 bg-insight/10 px-3 py-1 text-xs font-medium text-insight">
          {data.confidenceLevel}
        </span>
      </div>

      {/* Headline: probability ring + 1X2 legend */}
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-white/5 p-5 sm:flex-row sm:gap-8">
        <ProbabilityRing
          size={150}
          data={[
            { label: "Home win", value: outcome.homeWin, color: HOME_COLOR },
            { label: "Draw", value: outcome.draw, color: DRAW_COLOR },
            { label: "Away win", value: outcome.awayWin, color: AWAY_COLOR },
          ]}
          centerValue={`${Math.round(top * 100)}%`}
          centerLabel={data.topSelection.label.toUpperCase()}
        />
        <div className="flex w-full max-w-xs flex-col gap-2">
          <LegendDot color={HOME_COLOR} label={`${homeName} win`} value={outcome.homeWin} />
          <LegendDot color={DRAW_COLOR} label="Draw" value={outcome.draw} />
          <LegendDot color={AWAY_COLOR} label={`${awayName} win`} value={outcome.awayWin} />
        </div>
      </div>

      {/* xG comparison */}
      <XgCompare
        homeLabel={homeName}
        awayLabel={awayName}
        home={data.expectedGoals.home}
        away={data.expectedGoals.away}
      />

      {/* Markets as proportional bars */}
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {data.markets.map((m) => (
          <MarketBar key={m.market} label={m.label} value={m.probability} />
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
        The model&apos;s read on this match — every call backed by its reasoning.
        18+, bet responsibly.
      </p>
    </section>
  );
}
