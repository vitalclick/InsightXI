"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api-client";
import { PageHead } from "../../../components/ui/page-head";
import { LeagueChips } from "../../../components/ui/league-chips";
import { FormDots } from "../../../components/ui/form-dots";
import { Crest } from "../../../components/ui/crest";
import { SkeletonRows } from "../../../components/ui/skeleton";

export default function LeaguesPage() {
  const [league, setLeague] = useState("epl");
  // Up to two teams picked for a head-to-head comparison (FIFO when full).
  const [picked, setPicked] = useState<string[]>([]);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["standings", league],
    queryFn: () => api.standings(league),
    enabled: Boolean(league),
  });

  // Reset the comparison selection whenever the competition changes.
  useEffect(() => setPicked([]), [league]);

  const togglePick = (teamId: string) =>
    setPicked((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId].slice(-2),
    );

  const nameFor = (id: string) => rows.find((r) => r.teamId === id)?.teamName ?? id;
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

      {picked.length > 0 && (
        <div className="card reveal flex aic jcb wrap gap-12" style={{ marginBottom: 14, padding: "10px 16px" }}>
          <span className="flex aic gap-10 wrap" style={{ fontSize: 13 }}>
            <span className="label-xs">Compare</span>
            {picked.map((id) => (
              <span key={id} className="badge" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {nameFor(id)}
                <button
                  type="button"
                  onClick={() => togglePick(id)}
                  aria-label={`Remove ${nameFor(id)}`}
                  style={{ background: "none", border: 0, color: "inherit", cursor: "pointer", fontSize: 14, lineHeight: 1 }}
                >
                  ×
                </button>
              </span>
            ))}
            {picked.length === 1 && <span className="dim" style={{ fontSize: 12 }}>pick one more…</span>}
          </span>
          {picked.length === 2 ? (
            <Link href={`/compare?a=${picked[0]}&b=${picked[1]}`} className="btn btn-sm btn-primary">
              Compare head-to-head →
            </Link>
          ) : (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setPicked([])}>
              Clear
            </button>
          )}
        </div>
      )}

      <section className="card reveal">
        <div className="card-hd">
          <h3>League table</h3>
          <span className="badge">Select two teams to compare</span>
        </div>
        <div className="card-bd" style={{ padding: 0, overflowX: "auto" }}>
          {isLoading ? (
            <SkeletonRows rows={8} />
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 34 }} aria-label="Select for comparison" />
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
                  const isPicked = picked.includes(r.teamId);
                  return (
                    <tr key={r.teamId} style={isPicked ? { background: "color-mix(in srgb, var(--blue) 10%, transparent)" } : undefined}>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={isPicked}
                          onChange={() => togglePick(r.teamId)}
                          disabled={!isPicked && picked.length >= 2}
                          aria-label={`Compare ${r.teamName}`}
                          style={{ cursor: "pointer", accentColor: "var(--blue)" }}
                        />
                      </td>
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
