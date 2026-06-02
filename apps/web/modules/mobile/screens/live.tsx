"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as IX from "../../../lib/ix-charts";
import { api } from "../../../services/api-client";
import { clubCode } from "../../../lib/club";
import { useLive } from "../../../hooks/use-live";
import { liveWinProb, type WinProbPoint } from "../../../lib/live-winprob";
import { Chart } from "../chart";
import { useMobileNav } from "../nav-context";
import { Crest } from "../ui";
import { Icon } from "../icons";

export function LiveScreen() {
  const nav = useMobileNav();
  const { snapshot: snap, connected } = useLive();
  const { data: fixtures = [] } = useQuery({ queryKey: ["fixtures", ""], queryFn: () => api.fixtures() });

  const [series, setSeries] = useState<WinProbPoint[]>([]);
  const [xgSeries, setXgSeries] = useState<{ minute: number; home: number; away: number }[]>([]);
  const matchRef = useRef<string | null>(null);
  const lastMinute = useRef(-1);

  useEffect(() => {
    if (!snap) return;
    if (snap.matchId !== matchRef.current) {
      matchRef.current = snap.matchId;
      lastMinute.current = -1;
      setSeries([]);
      setXgSeries([]);
    }
    if (snap.minute !== lastMinute.current) {
      lastMinute.current = snap.minute;
      setSeries((prev) => [...prev, liveWinProb(snap)]);
      setXgSeries((prev) => [...prev, { minute: snap.minute, home: snap.homeXg, away: snap.awayXg }]);
    }
  }, [snap]);

  const current = snap ? liveWinProb(snap) : null;
  const homePct = snap ? Math.round(50 + snap.momentum / 2) : 50;

  return (
    <>
      <div className="lg-head">
        <div className="lg-eyebrow">Real-time intelligence</div>
        <div className="lg-title">Live Center</div>
        <div className="lg-sub">
          {connected ? "Live feed connected" : "Connecting…"} · momentum, win probability and xG stream over websockets.
        </div>
      </div>

      <div className="block">
        {snap ? (
          <div className="m-card pad">
            <div className="flex aic jcb" style={{ marginBottom: 13 }}>
              {snap.status === "LIVE" ? (
                <span className="live-pill">
                  <span className="pulse" />
                  LIVE {snap.minute}&apos;
                </span>
              ) : (
                <span className="badge">Full time</span>
              )}
              <span className="badge blue">Momentum {snap.momentum > 0 ? "+" : ""}{snap.momentum}</span>
            </div>
            <div className="flex aic jcb" style={{ marginBottom: 6 }}>
              <div className="flex aic gap-9" style={{ flex: 1 }}>
                <Crest name={snap.homeTeamName} seed={snap.homeTeamId} size="sm" />
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{clubCode(snap.homeTeamName)}</div>
              </div>
              <div className="live-score">
                {snap.homeGoals} – {snap.awayGoals}
              </div>
              <div className="flex aic gap-9" style={{ flex: 1, justifyContent: "flex-end" }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{clubCode(snap.awayTeamName)}</div>
                <Crest name={snap.awayTeamName} seed={snap.awayTeamId} size="sm" />
              </div>
            </div>

            <div className="label-xs" style={{ margin: "12px 0 4px", fontSize: 10 }}>
              Live momentum
            </div>
            <div className="momentum-bar">
              <i style={{ width: `${homePct}%`, background: "var(--blue)" }} />
              <i style={{ width: `${100 - homePct}%`, background: "var(--green)" }} />
            </div>

            {current && (
              <>
                <div className="flex aic jcb" style={{ margin: "16px 0 4px" }}>
                  <span className="label-xs" style={{ fontSize: 10 }}>
                    Win probability
                  </span>
                  <div className="flex gap-8" style={{ fontSize: 10.5 }}>
                    <span className="mono" style={{ color: "var(--blue-2)" }}>H {current.h}%</span>
                    <span className="mono dim">D {current.d}%</span>
                    <span className="mono" style={{ color: "var(--green-2)" }}>A {current.a}%</span>
                  </div>
                </div>
                {series.length >= 2 ? (
                  <Chart signature={`${snap.matchId}:${series.length}`} render={(el) => IX.winprob(el, series, { w: 340, h: 90 })} />
                ) : (
                  <div className="dim" style={{ fontSize: 11.5, padding: "6px 0" }}>
                    Building the probability curve as the match progresses…
                  </div>
                )}
              </>
            )}

            <div className="flex aic jcb" style={{ margin: "16px 0 4px" }}>
              <span className="label-xs" style={{ fontSize: 10 }}>
                Cumulative xG
              </span>
              <div className="flex gap-8" style={{ fontSize: 10.5 }}>
                <span className="mono" style={{ color: "var(--blue-2)" }}>{snap.homeXg.toFixed(2)}</span>
                <span className="mono" style={{ color: "var(--green-2)" }}>{snap.awayXg.toFixed(2)}</span>
              </div>
            </div>
            {xgSeries.length >= 2 ? (
              <Chart
                signature={`${snap.matchId}:${xgSeries.length}`}
                render={(el) =>
                  IX.line(el, {
                    w: 340,
                    h: 76,
                    xMax: 90,
                    yMin: 0,
                    gy: 2,
                    pad: { t: 6, r: 6, b: 6, l: 6 },
                    markers: snap.events
                      .filter((e) => e.type === "GOAL")
                      .map((e) => ({ x: e.minute, color: e.teamId === snap.awayTeamId ? IX.C.green : IX.C.blue })),
                    series: [
                      { color: IX.C.blue, area: true, data: xgSeries.map((d) => ({ x: d.minute, y: d.home })) },
                      { color: IX.C.green, data: xgSeries.map((d) => ({ x: d.minute, y: d.away })) },
                    ],
                  })
                }
              />
            ) : (
              <div className="dim" style={{ fontSize: 11.5, padding: "6px 0" }}>
                Accruing expected goals as chances develop…
              </div>
            )}

            <button
              className="btn btn-primary tappable"
              style={{ width: "100%", marginTop: 14 }}
              onClick={() =>
                nav.pushScreen("match", {
                  id: snap.matchId,
                  homeTeamId: snap.homeTeamId,
                  awayTeamId: snap.awayTeamId,
                  homeTeamName: snap.homeTeamName,
                  awayTeamName: snap.awayTeamName,
                  status: snap.status,
                })
              }
            >
              Full match intel →
            </button>
          </div>
        ) : (
          <div className="m-card pad center" style={{ padding: "28px 16px" }}>
            <div style={{ color: "var(--red)", display: "flex", justifyContent: "center", marginBottom: 10 }}>
              <span className="live-pill">
                <span className="pulse" />
              </span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Waiting for a live match…</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 5 }}>
              {connected
                ? "The live feed pushes a snapshot as soon as one kicks off."
                : "Live feed offline — start the API to stream matches."}
            </div>
          </div>
        )}
      </div>

      {snap && snap.events.length > 0 && (
        <div className="block">
          <div className="block-hd">
            <h2>
              <span className="ic">
                <Icon name="bolt" />
              </span>
              Event Feed
            </h2>
            <span className="badge">{snap.events.length}</span>
          </div>
          <div className="m-card pad">
            {[...snap.events].reverse().map((e, i) => (
              <div
                key={i}
                className="flex aic gap-10"
                style={{
                  padding: "9px 6px",
                  borderRadius: 9,
                  marginBottom: 3,
                  background: e.type === "GOAL" ? "rgba(39,224,138,.08)" : "transparent",
                }}
              >
                <span className="mono dim" style={{ width: 30 }}>{e.minute}&apos;</span>
                <span className={`badge ${e.type === "GOAL" ? "green" : ""}`} style={{ fontSize: 9 }}>
                  {e.type}
                </span>
                <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>{e.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="block">
        <div className="block-hd">
          <h2>
            <span className="ic">
              <Icon name="fixtures" />
            </span>
            Starting Soon
          </h2>
        </div>
        <div className="m-card">
          {fixtures.slice(0, 4).map((m) => (
            <div className="match-row tappable" key={m.id} onClick={() => nav.pushScreen("match", m)}>
              <div className="match-time">
                <div className="t">{new Date(m.utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                <div className="d">{new Date(m.utcDate).toLocaleDateString([], { weekday: "short" })}</div>
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
              <span className="dim" style={{ marginLeft: "auto" }}>
                <Icon name="chev" />
              </span>
            </div>
          ))}
          {fixtures.length === 0 && (
            <div className="dim" style={{ padding: 16, fontSize: 13 }}>
              No upcoming fixtures right now.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
