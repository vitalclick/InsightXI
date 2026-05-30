"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api-client";
import { LeagueTabs } from "../../components/league-tabs";
import { FormBadges } from "../../components/form-badges";

export default function StandingsPage() {
  const [league, setLeague] = useState("epl");
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["standings", league],
    queryFn: () => api.standings(league),
    enabled: Boolean(league),
  });

  return (
    <main className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">Standings</h1>
      <LeagueTabs value={league} onChange={setLeague} includeAll={false} />
      {isLoading ? (
        <p className="text-white/40">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase text-white/50">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Team</th>
                <th className="px-2 py-2 text-center">P</th>
                <th className="px-2 py-2 text-center">W</th>
                <th className="px-2 py-2 text-center">D</th>
                <th className="px-2 py-2 text-center">L</th>
                <th className="px-2 py-2 text-center">GD</th>
                <th className="px-2 py-2 text-center">Pts</th>
                <th className="px-3 py-2">Form</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.teamId} className="border-t border-white/5">
                  <td className="px-3 py-2 text-white/50">{r.position}</td>
                  <td className="px-3 py-2 font-medium">{r.teamName}</td>
                  <td className="px-2 py-2 text-center">{r.played}</td>
                  <td className="px-2 py-2 text-center">{r.won}</td>
                  <td className="px-2 py-2 text-center">{r.drawn}</td>
                  <td className="px-2 py-2 text-center">{r.lost}</td>
                  <td className="px-2 py-2 text-center tabular-nums">
                    {r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}
                  </td>
                  <td className="px-2 py-2 text-center font-bold">{r.points}</td>
                  <td className="px-3 py-2">
                    <FormBadges form={r.form} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
