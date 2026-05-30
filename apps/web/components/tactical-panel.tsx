"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api-client";
import type { TacticalProfile } from "../lib/types";
import { RadarChart } from "./charts/radar-chart";

const HOME_COLOR = "#22c55e";
const AWAY_COLOR = "#3b82f6";

const RADAR_AXES = ["Possession", "Press", "High line", "Directness"];

const LINE_SCORE: Record<string, number> = { High: 1, Medium: 0.55, Low: 0.2 };
const TRANSITION_SCORE: Record<string, number> = {
  "Possession build-up": 0.2,
  Direct: 0.6,
  "Fast counter": 1,
};

/** Map a tactical profile to four normalised radar axes (0..1). */
function radarValues(p: TacticalProfile): number[] {
  return [
    p.possession / 100,
    p.pressingIntensity / 100,
    LINE_SCORE[p.defensiveLine] ?? 0.5,
    TRANSITION_SCORE[p.transitionStyle] ?? 0.5,
  ];
}

function ProfileCard({ p, align }: { p: TacticalProfile; align: "left" | "right" }) {
  return (
    <div className={`flex flex-col gap-1 text-sm ${align === "right" ? "text-right" : ""}`}>
      <span className="font-semibold">{p.name}</span>
      <span className="text-white/50">{p.formation}</span>
      <span className="text-white/50">Possession {p.possession}%</span>
      <span className="text-white/50">Press {p.pressingIntensity}</span>
      <span className="text-white/50">{p.defensiveLine} line</span>
      <span className="text-white/50">{p.transitionStyle}</span>
    </div>
  );
}

export function TacticalPanel({ matchId }: { matchId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tactical", matchId],
    queryFn: () => api.tactical(matchId),
    retry: 0,
  });

  if (isLoading || isError || !data) return null;

  // tacticalEdge: -100 (away) .. +100 (home); convert to a 0..100 home share.
  const homeShare = Math.round((data.tacticalEdge + 100) / 2);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Tactical Matchup</h2>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <ProfileCard p={data.home} align="left" />
          <RadarChart
            size={220}
            axes={RADAR_AXES}
            series={[
              { label: data.home.name, color: HOME_COLOR, values: radarValues(data.home) },
              { label: data.away.name, color: AWAY_COLOR, values: radarValues(data.away) },
            ]}
          />
          <ProfileCard p={data.away} align="right" />
        </div>

        {/* radar legend */}
        <div className="mt-2 flex justify-center gap-6 text-xs text-white/60">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: HOME_COLOR }} />
            {data.home.name}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: AWAY_COLOR }} />
            {data.away.name}
          </span>
        </div>

        <div className="mt-5">
          <div className="mb-1 text-[11px] uppercase tracking-wide text-white/40">
            Tactical edge
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
            <div className="bg-signal/70" style={{ width: `${homeShare}%` }} />
            <div className="bg-insight/70" style={{ width: `${100 - homeShare}%` }} />
          </div>
        </div>

        <ul className="mt-4 flex flex-col gap-1 text-sm text-white/60">
          {data.insights.map((insight, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-insight">›</span>
              {insight}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
