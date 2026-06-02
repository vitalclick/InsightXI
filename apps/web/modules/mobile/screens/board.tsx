"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api-client";
import { clubCode } from "../../../lib/club";
import { boardViews, type BoardEntry } from "../../../lib/board";
import { distinctMatchdays, filterByMatchday } from "../../../lib/fixtures";
import { usePredictions } from "../../../hooks/use-predictions";
import { useMobileNav } from "../nav-context";
import { Crest, Tribar, confColor } from "../ui";
import { Icon } from "../icons";
import { pickClass } from "../view";

export function BoardScreen() {
  const nav = useMobileNav();
  const [matchday, setMatchday] = useState<number | null>(null);
  const { data: allFixtures = [] } = useQuery({ queryKey: ["fixtures", ""], queryFn: () => api.fixtures() });

  const matchdays = useMemo(() => distinctMatchdays(allFixtures), [allFixtures]);
  useEffect(() => {
    if (matchday !== null && !matchdays.includes(matchday)) setMatchday(null);
  }, [matchdays, matchday]);

  const fixtures = useMemo(() => filterByMatchday(allFixtures, matchday), [allFixtures, matchday]);
  const preds = usePredictions(fixtures.map((m) => m.id));
  const entries: BoardEntry[] = useMemo(() => fixtures.map((m) => ({ m, p: preds[m.id] })), [fixtures, preds]);
  const views = useMemo(() => boardViews(entries, { minConfidence: 0, market: null }), [entries]);

  const motd = views[0];

  return (
    <>
      <div className="lg-head" style={{ paddingTop: 14 }}>
        <div className="lg-eyebrow">Today&apos;s intelligence board</div>
        <div className="lg-title">Confidence Board</div>
        <div className="lg-sub">Matches with AI picks, confidence-ranked.</div>
      </div>

      {matchdays.length > 1 && (
        <div className="seg-row" style={{ marginTop: 14 }}>
          <button className={`seg${matchday === null ? " active" : ""}`} onClick={() => setMatchday(null)}>
            All
          </button>
          {matchdays.map((md) => (
            <button key={md} className={`seg${matchday === md ? " active" : ""}`} onClick={() => setMatchday(md)}>
              MD {md}
            </button>
          ))}
        </div>
      )}

      {motd && (
        <div className="block">
          <div className="block-hd">
            <h2>
              <span className="ic">
                <Icon name="star" />
              </span>
              Match of the Day
            </h2>
            <span className="badge blue">AI {Math.round(motd.prob * 100)}%</span>
          </div>
          <div className="m-card pad tappable" onClick={() => nav.pushScreen("match", motd.m)}>
            <div className="flex aic jcb" style={{ marginBottom: 14 }}>
              <div className="flex col aic gap-8" style={{ flex: 1 }}>
                <Crest name={motd.m.homeTeamName} seed={motd.m.homeTeamId} size="lg" />
                <div style={{ fontWeight: 700, fontSize: 13 }}>{clubCode(motd.m.homeTeamName)}</div>
              </div>
              <div className="flex col aic" style={{ padding: "0 8px" }}>
                <span className="mono dim" style={{ fontSize: 12, letterSpacing: ".12em" }}>
                  VS
                </span>
                <span className="badge blue" style={{ marginTop: 8 }}>
                  {motd.label}
                </span>
              </div>
              <div className="flex col aic gap-8" style={{ flex: 1 }}>
                <Crest name={motd.m.awayTeamName} seed={motd.m.awayTeamId} size="lg" />
                <div style={{ fontWeight: 700, fontSize: 13 }}>{clubCode(motd.m.awayTeamName)}</div>
              </div>
            </div>
            <Tribar
              hp={Math.round(motd.p.outcome.homeWin * 100)}
              dp={Math.round(motd.p.outcome.draw * 100)}
              ap={Math.round(motd.p.outcome.awayWin * 100)}
            />
          </div>
        </div>
      )}

      <div className="block">
        <div className="block-hd">
          <h2>
            <span className="ic">
              <Icon name="grid" />
            </span>
            AI Picks
          </h2>
          <span className="badge">{views.length}</span>
        </div>
        <div className="m-card">
          {views.map(({ m, prob, pick }) => {
            const conf = Math.round(prob * 100);
            return (
              <div className="match-row tappable" key={m.id} onClick={() => nav.pushScreen("match", m)}>
                <div className="match-time">
                  <div className="t">{new Date(m.utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <div className="mr-teams">
                  <div className="mr-team">
                    <Crest name={m.homeTeamName} seed={m.homeTeamId} size="xs" />
                    <span className="nm">{clubCode(m.homeTeamName)}</span>
                  </div>
                  <div className="mr-team">
                    <Crest name={m.awayTeamName} seed={m.awayTeamId} size="xs" />
                    <span className="nm">{clubCode(m.awayTeamName)}</span>
                  </div>
                </div>
                <div className="mr-conf">
                  <div className="pct" style={{ color: confColor(conf) }}>
                    {conf}%
                  </div>
                </div>
                <div className={`pickb ${pickClass(pick)}`}>{pick}</div>
              </div>
            );
          })}
          {views.length === 0 && (
            <div className="dim" style={{ padding: 16, fontSize: 13 }}>
              The board fills in as the AI service returns predictions.
            </div>
          )}
        </div>
      </div>

      <div className="block">
        <div className="list-sec" style={{ paddingLeft: 0 }}>
          <span className="badge gold" style={{ fontSize: 9 }}>
            ★
          </span>{" "}
          Premium board
          <span className="badge gold" style={{ marginLeft: "auto" }}>
            <Icon name="premium" /> Premium
          </span>
        </div>
        <div
          className="m-card pad center"
          style={{
            background: "radial-gradient(360px 200px at 50% 0%,rgba(232,194,112,.1),transparent 62%),var(--surface-1)",
            borderColor: "rgba(232,194,112,.22)",
          }}
        >
          <div style={{ color: "var(--gold)", marginBottom: 8 }}>
            <Icon name="premium" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Cross-competition picks</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 5, marginBottom: 14 }}>
            Unlock the full board across every league with Premium.
          </div>
          <button className="btn btn-gold tappable" onClick={() => nav.pushScreen("premium")}>
            Unlock Premium →
          </button>
        </div>
      </div>
    </>
  );
}
