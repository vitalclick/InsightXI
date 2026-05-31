"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api-client";
import { MatchIntel } from "../../../components/match/match-intel";
import { PageHead } from "../../../components/ui/page-head";

/** "Match Intel" entry point — features the highest-confidence upcoming fixture. */
export default function FeaturedMatchPage() {
  const { data: fixtures = [], isLoading } = useQuery({ queryKey: ["fixtures", ""], queryFn: () => api.fixtures() });
  const feature = fixtures[0];

  if (isLoading) return <div className="empty">Finding the featured fixture…</div>;
  if (!feature)
    return (
      <>
        <PageHead eyebrow="Match Intelligence" title="Match Intel" />
        <section className="card">
          <div className="card-bd empty">
            <h4>No upcoming fixtures</h4>
            <p>Match intelligence features the next scheduled fixture — check back when the schedule fills.</p>
          </div>
        </section>
      </>
    );

  return <MatchIntel id={feature.id} />;
}
