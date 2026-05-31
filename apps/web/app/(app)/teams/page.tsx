"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api-client";
import { PageHead } from "../../../components/ui/page-head";
import { LeagueChips } from "../../../components/ui/league-chips";
import { Crest } from "../../../components/ui/crest";

export default function TeamsPage() {
  const [league, setLeague] = useState("epl");
  const { data: teams = [] } = useQuery({ queryKey: ["teams", league], queryFn: () => api.teams(league) });
  const { data: ratings = [] } = useQuery({ queryKey: ["ratings", league], queryFn: () => api.ratings(league), enabled: Boolean(league) });

  const eloById = useMemo(() => Object.fromEntries(ratings.map((r) => [r.teamId, r])), [ratings]);

  return (
    <>
      <PageHead
        eyebrow="Team Intelligence"
        title="Teams"
        sub="Strength ratings, recent form and expected-goals profiles across the platform's clubs."
      />
      <div className="reveal" style={{ marginBottom: 18 }}>
        <LeagueChips value={league} onChange={setLeague} includeAll={false} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {teams.map((t) => {
          const r = eloById[t.id];
          return (
            <Link key={t.id} href={`/teams/${t.id}`} className="card card-hover reveal" style={{ color: "inherit" }}>
              <div className="card-bd flex aic gap-14">
                <Crest name={t.name} shortName={t.shortName} seed={t.id} size="lg" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</div>
                  <div className="dim" style={{ fontSize: 12 }}>{t.shortName}</div>
                  {r && (
                    <div className="flex gap-12" style={{ marginTop: 8 }}>
                      <span className="mono" style={{ fontSize: 12 }}>
                        <span className="dim">Elo</span> {Math.round(r.elo)}
                      </span>
                      <span className="mono" style={{ fontSize: 12, color: "var(--green-2)" }}>
                        <span className="dim">Form</span> {r.recentFormPoints}/15
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
        {teams.length === 0 && (
          <section className="card"><div className="card-bd empty"><p>No teams for this competition.</p></div></section>
        )}
      </div>
    </>
  );
}
