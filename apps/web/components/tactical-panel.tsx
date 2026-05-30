"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api-client";
import type { TacticalProfile } from "../lib/types";

function ProfileCard({
  p,
  align,
}: {
  p: TacticalProfile;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex flex-col gap-1 text-sm ${align === "right" ? "text-right" : ""}`}
    >
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
        <div className="flex justify-between">
          <ProfileCard p={data.home} align="left" />
          <ProfileCard p={data.away} align="right" />
        </div>

        <div className="mt-5">
          <div className="mb-1 text-[11px] uppercase tracking-wide text-white/40">
            Tactical edge
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
            <div className="bg-signal/70" style={{ width: `${homeShare}%` }} />
            <div
              className="bg-insight/70"
              style={{ width: `${100 - homeShare}%` }}
            />
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
