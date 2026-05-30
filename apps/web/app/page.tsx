"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "../services/api-client";
import { MatchCard } from "../components/match-card";

export default function Dashboard() {
  const { data: fixtures = [] } = useQuery({
    queryKey: ["fixtures", ""],
    queryFn: () => api.fixtures(),
  });
  const { data: results = [] } = useQuery({
    queryKey: ["results", ""],
    queryFn: () => api.results(),
  });

  return (
    <main className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <span className="text-sm font-medium uppercase tracking-widest text-insight">
          True Football Intelligence
        </span>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Explainable football analytics, not guesswork
        </h1>
        <p className="max-w-2xl text-white/60">
          Probabilistic match intelligence, league data and historical trends.
          Every prediction ships with the reasoning behind it.
        </p>
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Upcoming fixtures</h2>
            <Link href="/fixtures" className="text-sm text-insight hover:underline">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {fixtures.slice(0, 5).map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
            {fixtures.length === 0 && (
              <p className="text-sm text-white/40">No upcoming fixtures.</p>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Latest results</h2>
            <Link href="/results" className="text-sm text-insight hover:underline">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {results.slice(0, 5).map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
