"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api-client";
import { PageHead } from "../../../components/ui/page-head";
import { LeagueChips } from "../../../components/ui/league-chips";
import { MatchRow } from "../../../components/match/match-row";
import { SkeletonRows } from "../../../components/ui/skeleton";
import { usePredictions } from "../../../hooks/use-predictions";
import { distinctMatchdays, filterByMatchday } from "../../../lib/fixtures";

export default function FixturesPage() {
  const [league, setLeague] = useState("");
  const [matchday, setMatchday] = useState<number | null>(null);
  const { data: allFixtures = [], isLoading } = useQuery({
    queryKey: ["fixtures", league],
    queryFn: () => api.fixtures(league || undefined),
  });

  const matchdays = useMemo(() => distinctMatchdays(allFixtures), [allFixtures]);
  // Drop a stale matchday selection when the league switch changes the slate.
  useEffect(() => {
    if (matchday !== null && !matchdays.includes(matchday)) setMatchday(null);
  }, [matchdays, matchday]);

  const fixtures = useMemo(() => filterByMatchday(allFixtures, matchday), [allFixtures, matchday]);
  const preds = usePredictions(fixtures.map((m) => m.id));

  return (
    <>
      <PageHead
        eyebrow="Football Data Hub"
        title="Fixtures"
        sub="Upcoming matches with model-ranked outcome probabilities and confidence."
      />
      <div className="reveal" style={{ marginBottom: 14 }}>
        <LeagueChips value={league} onChange={setLeague} />
      </div>
      {matchdays.length > 1 && (
        <div className="flex aic gap-8 wrap reveal" style={{ marginBottom: 18 }}>
          <span className="label-xs" style={{ marginRight: 2 }}>Matchday</span>
          <div className="chip-row">
            <button
              type="button"
              className={`chip${matchday === null ? " active" : ""}`}
              onClick={() => setMatchday(null)}
              aria-pressed={matchday === null}
            >
              All
            </button>
            {matchdays.map((md) => (
              <button
                key={md}
                type="button"
                className={`chip${matchday === md ? " active" : ""}`}
                onClick={() => setMatchday(md)}
                aria-pressed={matchday === md}
              >
                MD {md}
              </button>
            ))}
          </div>
        </div>
      )}

      <section className="card reveal">
        <div className="card-hd">
          <h3>{matchday === null ? "Upcoming fixtures" : `Matchday ${matchday}`}</h3>
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
