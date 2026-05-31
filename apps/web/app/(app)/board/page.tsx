"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api-client";
import { PageHead } from "../../../components/ui/page-head";
import { Crest } from "../../../components/ui/crest";
import { Icon } from "../../../components/ui/icon";
import { usePredictions, confColor } from "../../../hooks/use-predictions";
import { clubCode } from "../../../lib/club";
import type { MatchPrediction, MatchView } from "../../../lib/types";

function pickCode(p: MatchPrediction): "1" | "X" | "2" {
  const { homeWin, draw, awayWin } = p.outcome;
  if (homeWin >= draw && homeWin >= awayWin) return "1";
  if (awayWin >= draw) return "2";
  return "X";
}
const pickClass = { "1": "h", X: "d", "2": "a" } as const;

export default function BoardPage() {
  const { data: fixtures = [] } = useQuery({ queryKey: ["fixtures", ""], queryFn: () => api.fixtures() });
  const { data: leagues = [] } = useQuery({ queryKey: ["leagues"], queryFn: api.leagues });
  const preds = usePredictions(fixtures.map((m) => m.id));

  const withPred = useMemo(
    () =>
      fixtures
        .map((m) => ({ m, p: preds[m.id] }))
        .filter((x): x is { m: MatchView; p: MatchPrediction } => Boolean(x.p))
        .sort((a, b) => b.p.topSelection.probability - a.p.topSelection.probability),
    [fixtures, preds],
  );

  const motd = withPred[0];
  const leagueName = (id: string) => leagues.find((l) => l.id === id)?.name ?? id.toUpperCase();

  // Group fixtures by league for the board list.
  const grouped = useMemo(() => {
    const g: Record<string, { m: MatchView; p?: MatchPrediction }[]> = {};
    fixtures.forEach((m) => {
      (g[m.leagueId] ??= []).push({ m, p: preds[m.id] });
    });
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixtures, preds]);

  return (
    <>
      <PageHead
        eyebrow="Today's intelligence board"
        title="Confidence Board"
        sub="Every fixture, ranked by model confidence — with the day's standout read up top."
        actions={
          <Link href="/fixtures" className="btn btn-sm btn-primary">
            View all fixtures →
          </Link>
        }
      />

      <div className="grid board-grid" style={{ gridTemplateColumns: "1fr 1.35fr", gap: 22, alignItems: "start" }}>
        {/* Match of the Day */}
        <div className="card reveal">
          <div className="board-hd">Match of the Day</div>
          <div className="card-bd">
            {motd ? (
              <>
                <div className="flex jcb aic" style={{ margin: "6px 0 20px" }}>
                  <div className="flex col aic gap-10" style={{ flex: 1 }}>
                    <Crest name={motd.m.homeTeamName} seed={motd.m.homeTeamId} size="lg" />
                    <div style={{ fontWeight: 700, textAlign: "center", fontSize: 14 }}>{motd.m.homeTeamName}</div>
                  </div>
                  <div className="flex col aic" style={{ flexShrink: 0, padding: "0 10px" }}>
                    <span className="dim mono" style={{ fontSize: 12, letterSpacing: ".1em" }}>VS</span>
                    <span className="badge blue" style={{ marginTop: 8 }}>AI {Math.round(motd.p.topSelection.probability * 100)}%</span>
                  </div>
                  <div className="flex col aic gap-10" style={{ flex: 1 }}>
                    <Crest name={motd.m.awayTeamName} seed={motd.m.awayTeamId} size="lg" />
                    <div style={{ fontWeight: 700, textAlign: "center", fontSize: 14 }}>{motd.m.awayTeamName}</div>
                  </div>
                </div>
                <div className="flex gap-8">
                  <ProbPill label="Home" value={Math.round(motd.p.outcome.homeWin * 100)} fav={pickCode(motd.p) === "1"} />
                  <ProbPill label="Draw" value={Math.round(motd.p.outcome.draw * 100)} fav={pickCode(motd.p) === "X"} />
                  <ProbPill label="Away" value={Math.round(motd.p.outcome.awayWin * 100)} fav={pickCode(motd.p) === "2"} />
                </div>
                <div className="flex jcb aic" style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                  <div className="flex aic gap-9">
                    <div className="tb-avatar" style={{ width: 30, height: 30, fontSize: 11, borderRadius: 9 }}>IX</div>
                    <div style={{ fontSize: 12 }}>
                      <span className="dim">Analysis by</span> <b>{motd.p.modelBackend}</b>
                    </div>
                  </div>
                  <Link href={`/matches/${motd.m.id}`} className="btn btn-sm btn-primary">View Intel →</Link>
                </div>
              </>
            ) : (
              <div className="empty"><p>Predictions load when the AI service is reachable.</p></div>
            )}
          </div>
        </div>

        {/* Confidence board list */}
        <div className="card reveal">
          <div className="board-hd">AI Picks · Confidence Board</div>
          <div className="card-bd" style={{ paddingTop: 4 }}>
            {Object.entries(grouped).map(([lid, rows]) => (
              <div key={lid}>
                <div className="league-row">
                  <span className="badge blue" style={{ fontSize: 9 }}>{lid.toUpperCase().slice(0, 3)}</span>
                  {leagueName(lid)}
                </div>
                {rows.map(({ m, p }) => (
                  <Link key={m.id} href={`/matches/${m.id}`} className="board-row" style={{ color: "inherit" }}>
                    <span className="mono dim" style={{ width: 50, fontSize: 12, flexShrink: 0 }}>
                      {new Date(m.utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div className="flex aic gap-7" style={{ flex: 1, justifyContent: "flex-end", fontSize: 13, fontWeight: 600, minWidth: 0 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clubCode(m.homeTeamName)}</span>
                      <Crest name={m.homeTeamName} seed={m.homeTeamId} size="xs" />
                    </div>
                    <span className="dim" style={{ fontSize: 11, flexShrink: 0 }}>:</span>
                    <div className="flex aic gap-7" style={{ flex: 1, fontSize: 13, fontWeight: 600, minWidth: 0 }}>
                      <Crest name={m.awayTeamName} seed={m.awayTeamId} size="xs" />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clubCode(m.awayTeamName)}</span>
                    </div>
                    {p ? (
                      <>
                        <span
                          className="mono"
                          style={{
                            fontSize: 11,
                            color: confColor(Math.round(p.topSelection.probability * 100)),
                            width: 34,
                            textAlign: "right",
                            flexShrink: 0,
                          }}
                        >
                          {Math.round(p.topSelection.probability * 100)}%
                        </span>
                        <span className={`pick-badge ${pickClass[pickCode(p)]}`} title="AI predicted outcome">
                          {pickCode(p)}
                        </span>
                      </>
                    ) : (
                      <span className="dim mono" style={{ width: 34, textAlign: "right", fontSize: 11 }}>—</span>
                    )}
                  </Link>
                ))}
              </div>
            ))}
            {fixtures.length === 0 && <div className="empty"><p>No fixtures scheduled.</p></div>}
          </div>
          <div className="board-ft" style={{ justifyContent: "flex-end" }}>
            <span className="muted" style={{ fontSize: 12, marginRight: "auto" }}>
              <Icon name="bolt" size={12} /> Confidence-ranked · probabilistic, for analytical use only
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

function ProbPill({ label, value, fav }: { label: string; value: number; fav: boolean }) {
  return (
    <div className={`prob-pill${fav ? " fav" : ""}`}>
      <b>{value}%</b>
      <span className="lbl">{label}</span>
    </div>
  );
}
