"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api-client";
import { MatchCard } from "../../components/match-card";
import { LeagueTabs } from "../../components/league-tabs";

export default function FixturesPage() {
  const [league, setLeague] = useState("");
  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ["fixtures", league],
    queryFn: () => api.fixtures(league || undefined),
  });

  return (
    <main className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">Fixtures</h1>
      <LeagueTabs value={league} onChange={setLeague} />
      {isLoading ? (
        <p className="text-white/40">Loading…</p>
      ) : (
        <div className="flex flex-col gap-2">
          {fixtures.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
          {fixtures.length === 0 && (
            <p className="text-sm text-white/40">No upcoming fixtures.</p>
          )}
        </div>
      )}
    </main>
  );
}
