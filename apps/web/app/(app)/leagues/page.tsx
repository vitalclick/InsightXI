"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api-client";
import { PageHead } from "../../../components/ui/page-head";
import { LeagueChips } from "../../../components/ui/league-chips";
import { FormDots } from "../../../components/ui/form-dots";
import { Crest } from "../../../components/ui/crest";
import { SkeletonRows } from "../../../components/ui/skeleton";

export default function LeaguesPage() {
  const [league, setLeague] = useState("epl");
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["standings", league],
    queryFn: () => api.standings(league),
    enabled: Boolean(league),
  });

  const maxAbs = Math.max(1, ...rows.map((r) => Math.abs(r.goalDifference)));

  return (
    <>
      <PageHead
        eyebrow="Football Data Hub"
        title="Leagues & Standings"
        sub="Computed tables, goal difference and recent form across the platform's competitions."
      />
      <div className="reveal" style={{ marginBottom: 18 }}>
        <LeagueChips value={league} onChange={setLeague} includeAll={false} />
      </div>

      <section className="card reveal">
        <div className="card-hd">
          <h3>League table</h3>
          <span className="badge">Current season</span>
        </div>
        <div className="card-bd" style={{ padding: 0, overflowX: "auto" }}>
          {isLoading ? (
            <SkeletonRows rows={8} />
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Team</th>
                  <th style={{ textAlign: "center" }}>P</th>
                  <th style={{ textAlign: "center" }}>W</th>
                  <th style={{ textAlign: "center" }}>D</th>
                  <th style={{ textAlign: "center" }}>L</th>
                  <th>GD</th>
                  <th className="num">Pts</th>
                  <th>Form</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const pos = r.position;
                  const accent = pos <= 4 ? "var(--green)" : pos >= rows.length - 1 ? "var(--red)" : "transparent";
                  return (
                    <tr key={r.teamId}>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 3, height: 16, borderRadius: 2, background: accent }} />
                          <span className="mono">{pos}</span>
                        </span>
                      </td>
                      <td>
                        <span className="flex aic gap-8">
                          <Crest name={r.teamName} seed={r.teamId} size="xs" />
                          <b style={{ fontWeight: 600, color: "var(--text)" }}>{r.teamName}</b>
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>{r.played}</td>
                      <td style={{ textAlign: "center" }}>{r.won}</td>
                      <td style={{ textAlign: "center" }}>{r.drawn}</td>
                      <td style={{ textAlign: "center" }}>{r.lost}</td>
                      <td>
                        <span className="flex aic gap-8">
                          <span className="meter" style={{ width: 70 }}>
                            <i
                              style={{
                                width: `${(Math.abs(r.goalDifference) / maxAbs) * 100}%`,
                                background: r.goalDifference >= 0 ? "linear-gradient(90deg,var(--green),var(--green-2))" : "linear-gradient(90deg,var(--red),#ff8a95)",
                              }}
                            />
                          </span>
                          <span className="mono" style={{ color: r.goalDifference >= 0 ? "var(--green-2)" : "#ff8a95" }}>
                            {r.goalDifference > 0 ? "+" : ""}
                            {r.goalDifference}
                          </span>
                        </span>
                      </td>
                      <td className="num" style={{ fontWeight: 700, color: "var(--text)" }}>
                        {r.points}
                      </td>
                      <td>
                        <FormDots form={r.form} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}
