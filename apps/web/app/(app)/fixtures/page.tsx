"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api-client";
import { PageHead } from "../../../components/ui/page-head";
import { LeagueChips } from "../../../components/ui/league-chips";
import { MatchRow } from "../../../components/match/match-row";
import { SkeletonRows } from "../../../components/ui/skeleton";
import { usePredictions } from "../../../hooks/use-predictions";

export default function FixturesPage() {
  const [league, setLeague] = useState("");
  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ["fixtures", league],
    queryFn: () => api.fixtures(league || undefined),
  });
  const preds = usePredictions(fixtures.map((m) => m.id));

  return (
    <>
      <PageHead
        eyebrow="Football Data Hub"
        title="Fixtures"
        sub="Upcoming matches with model-ranked outcome probabilities and confidence."
      />
      <div className="reveal" style={{ marginBottom: 18 }}>
        <LeagueChips value={league} onChange={setLeague} />
      </div>

      <section className="card reveal">
        <div className="card-hd">
          <h3>Upcoming fixtures</h3>
          <span className="badge">{fixtures.length} matches</span>
        </div>
        <div className="card-bd" style={{ padding: "4px 12px 8px" }}>
          {isLoading ? (
            <SkeletonRows />
          ) : fixtures.length === 0 ? (
            <div className="empty">
              <h4>No upcoming fixtures</h4>
              <p>There are no scheduled matches for this competition right now.</p>
            </div>
          ) : (
            fixtures.map((m) => <MatchRow key={m.id} match={m} prediction={preds[m.id]} />)
          )}
        </div>
      </section>
    </>
  );
}
