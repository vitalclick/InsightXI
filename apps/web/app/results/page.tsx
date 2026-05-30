"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api-client";
import { MatchCard } from "../../components/match-card";
import { LeagueTabs } from "../../components/league-tabs";

export default function ResultsPage() {
  const [league, setLeague] = useState("");
  const { data: results = [], isLoading } = useQuery({
    queryKey: ["results", league],
    queryFn: () => api.results(league || undefined),
  });

  return (
    <main className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">Results</h1>
      <LeagueTabs value={league} onChange={setLeague} />
      {isLoading ? (
        <p className="text-white/40">Loading…</p>
      ) : (
        <div className="flex flex-col gap-2">
          {results.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </main>
  );
}
