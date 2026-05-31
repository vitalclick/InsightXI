"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api-client";
import { PageHead } from "../../../components/ui/page-head";
import { LeagueChips } from "../../../components/ui/league-chips";
import { MatchRow } from "../../../components/match/match-row";

export default function ResultsPage() {
  const [league, setLeague] = useState("");
  const { data: results = [], isLoading } = useQuery({
    queryKey: ["results", league],
    queryFn: () => api.results(league || undefined),
  });

  return (
    <>
      <PageHead
        eyebrow="Football Data Hub"
        title="Results"
        sub="Final scores with expected-goals context across every tracked competition."
      />
      <div className="reveal" style={{ marginBottom: 18 }}>
        <LeagueChips value={league} onChange={setLeague} />
      </div>

      <section className="card reveal">
        <div className="card-hd">
          <h3>Latest results</h3>
          <span className="badge">{results.length} matches</span>
        </div>
        <div className="card-bd" style={{ padding: "4px 12px 8px" }}>
          {isLoading ? (
            <div className="empty">Loading results…</div>
          ) : results.length === 0 ? (
            <div className="empty">
              <h4>No results yet</h4>
              <p>Played matches will appear here once finished.</p>
            </div>
          ) : (
            results.map((m) => <MatchRow key={m.id} match={m} />)
          )}
        </div>
      </section>
    </>
  );
}
