"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api-client";

export function H2HPanel({
  homeId,
  awayId,
}: {
  homeId: string;
  awayId: string;
}) {
  const { data, isError } = useQuery({
    queryKey: ["h2h", homeId, awayId],
    queryFn: () => api.h2h(homeId, awayId),
    retry: 0,
  });

  if (isError || !data || data.played === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Head to Head</h2>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between text-center">
          <Stat value={data.teamAWins} label={data.teamA} />
          <Stat value={data.draws} label="Draws" />
          <Stat value={data.teamBWins} label={data.teamB} />
        </div>
        <div className="mt-4 flex justify-between text-xs text-white/50">
          <span>{data.played} meetings</span>
          <span>{data.avgGoalsPerGame} goals/game</span>
          <span>BTTS {Math.round(data.bttsRate * 100)}%</span>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-1 flex-col">
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      <span className="truncate text-xs text-white/50">{label}</span>
    </div>
  );
}
