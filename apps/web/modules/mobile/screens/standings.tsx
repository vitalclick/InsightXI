"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api-client";
import { clubCode } from "../../../lib/club";
import { Crest } from "../ui";

export function StandingsScreen() {
  const { data: leagues = [] } = useQuery({ queryKey: ["leagues"], queryFn: () => api.leagues() });
  const [league, setLeague] = useState<string | null>(null);
  const activeLeague = league ?? leagues[0]?.id ?? "epl";
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["standings", activeLeague],
    queryFn: () => api.standings(activeLeague),
    enabled: !!activeLeague,
  });

  const leagueName = useMemo(
    () => leagues.find((l) => l.id === activeLeague)?.name ?? "League",
    [leagues, activeLeague],
  );

  return (
    <>
      <div className="lg-head" style={{ paddingTop: 14 }}>
        <div className="lg-eyebrow">Tables</div>
        <div className="lg-title">Standings</div>
        <div className="lg-sub">Live league tables — points, goal difference and form.</div>
      </div>

      {leagues.length > 1 && (
        <div className="seg-row" style={{ marginTop: 6 }}>
          {leagues.map((l) => (
            <button key={l.id} className={`seg${l.id === activeLeague ? " active" : ""}`} onClick={() => setLeague(l.id)}>
              {l.name}
            </button>
          ))}
        </div>
      )}

      <div className="block">
        <div className="list-sec" style={{ paddingLeft: 0 }}>
          {leagueName}
        </div>
        <div className="m-card">
          <div
            className="flex aic"
            style={{ padding: "8px 15px", borderBottom: "1px solid var(--line)", fontSize: 10, color: "var(--dim)", fontFamily: "var(--font-mono)" }}
          >
            <span style={{ width: 20 }}>#</span>
            <span style={{ flex: 1 }}>Team</span>
            <span style={{ width: 26, textAlign: "center" }}>P</span>
            <span style={{ width: 30, textAlign: "center" }}>GD</span>
            <span style={{ width: 30, textAlign: "right" }}>Pts</span>
          </div>
          {rows.map((r) => (
            <div
              key={r.teamId}
              className="flex aic"
              style={{ padding: "10px 15px", borderBottom: "1px solid var(--line)", fontSize: 13 }}
            >
              <span className="mono dim" style={{ width: 20, fontSize: 12 }}>{r.position}</span>
              <div className="flex aic gap-8" style={{ flex: 1, minWidth: 0 }}>
                <Crest name={r.teamName} seed={r.teamId} size="xs" />
                <span style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {clubCode(r.teamName)}
                </span>
              </div>
              <span className="mono" style={{ width: 26, textAlign: "center", color: "var(--muted)" }}>{r.played}</span>
              <span className="mono" style={{ width: 30, textAlign: "center", color: r.goalDifference > 0 ? "var(--green-2)" : r.goalDifference < 0 ? "#ff8a95" : "var(--muted)" }}>
                {r.goalDifference > 0 ? "+" : ""}{r.goalDifference}
              </span>
              <span className="mono" style={{ width: 30, textAlign: "right", fontWeight: 800 }}>{r.points}</span>
            </div>
          ))}
          {!isLoading && rows.length === 0 && (
            <div className="dim" style={{ padding: 16, fontSize: 13 }}>
              No table available for this competition yet.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
