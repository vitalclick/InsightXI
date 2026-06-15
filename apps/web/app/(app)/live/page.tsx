"use client";

import { useEffect, useRef, useState } from "react";
import { PageHead } from "../../../components/ui/page-head";
import { Crest } from "../../../components/ui/crest";
import { ChartBox } from "../../../components/charts/chart-box";
import { useLive } from "../../../hooks/use-live";
import { liveWinProb, type WinProbPoint } from "../../../lib/live-winprob";
import * as IX from "../../../lib/ix-charts";

export default function LivePage() {
  const { snapshot: snap, connected } = useLive();
  const homePct = snap ? Math.round(50 + snap.momentum / 2) : 50;

  // Accumulate win-probability + cumulative-xG series across ticks, per match.
  const [series, setSeries] = useState<WinProbPoint[]>([]);
  const [xgSeries, setXgSeries] = useState<{ minute: number; home: number; away: number }[]>([]);
  const matchRef = useRef<string | null>(null);
  const lastMinute = useRef<number>(-1);

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

  return (
    <>
      <PageHead
        eyebrow="Live Intelligence"
        title="Live Center"
        sub="Real-time score, momentum and event intelligence streamed over websockets."
        actions={
          <span className={`badge ${connected ? "green" : ""}`}>
            <span className="badge-dot" style={{ background: connected ? "var(--green)" : "var(--dim)" }} />
            {connected ? "Live feed connected" : "Connecting…"}
          </span>
        }
      />

      {!snap ? (
        <section className="card reveal">
          <div className="card-bd empty">
            <div className="em-ic">
              <span className="live-pill"><span className="pulse" /></span>
            </div>
            <h4>Waiting for a live match…</h4>
            <p>The simulated live feed pushes a match snapshot as soon as one kicks off.</p>
          </div>
        </section>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "1.3fr 1fr", alignItems: "start" }}>
          <section className="card reveal">
            <div className="card-hd">
              <h3>
                {snap.status === "LIVE" ? (
                  <span className="live-pill"><span className="pulse" />{snap.minute}&apos;</span>
                ) : (
                  <span className="badge">Full time</span>
                )}
              </h3>
              <span className="badge blue">Momentum {snap.momentum > 0 ? "+" : ""}{snap.momentum}</span>
            </div>
            <div className="card-bd">
              <div className="flex jcb aic" style={{ marginBottom: 18 }}>
                <div className="flex col aic gap-10" style={{ flex: 1 }}>
                  <Crest name={snap.homeTeamName} seed={snap.homeTeamId} size="lg" />
                  <div style={{ fontWeight: 700, textAlign: "center" }}>{snap.homeTeamName}</div>
                </div>
                <div className="mono" style={{ fontSize: 44, fontWeight: 800 }}>
                  {snap.homeGoals} – {snap.awayGoals}
                </div>
                <div className="flex col aic gap-10" style={{ flex: 1 }}>
                  <Crest name={snap.awayTeamName} seed={snap.awayTeamId} size="lg" />
                  <div style={{ fontWeight: 700, textAlign: "center" }}>{snap.awayTeamName}</div>
                </div>
              </div>
              <div className="label-xs" style={{ marginBottom: 6 }}>Live momentum</div>
              <div style={{ display: "flex", height: 8, borderRadius: 20, overflow: "hidden", background: "var(--surface-3)" }}>
                <i style={{ width: `${homePct}%`, background: "var(--blue)" }} />
                <i style={{ width: `${100 - homePct}%`, background: "var(--green)" }} />
              </div>
              <div className="flex jcb" style={{ marginTop: 6, fontSize: 11, color: "var(--muted)" }}>
                <span>{snap.homeTeamName}</span>
                <span>{snap.awayTeamName}</span>
              </div>

              {current && (
                <>
                  <div className="flex jcb aic" style={{ margin: "20px 0 8px" }}>
                    <span className="label-xs">Win probability tracker</span>
                    <div className="flex gap-8" style={{ fontSize: 11 }}>
                      <span className="mono" style={{ color: "var(--blue-2)" }}>H {current.h}%</span>
                      <span className="mono dim">D {current.d}%</span>
                      <span className="mono" style={{ color: "var(--green-2)" }}>A {current.a}%</span>
                    </div>
                  </div>
                  {series.length >= 2 ? (
                    <ChartBox
                      style={{ width: "100%" }}
                      label={`In-play win probability over time. Currently home ${current.h} percent, draw ${current.d} percent, away ${current.a} percent.`}
                      deps={[snap.matchId, series.length]}
                      draw={(el) => IX.winprob(el, series, { w: 560, h: 150 })}
                    />
                  ) : (
                    <div className="dim" style={{ fontSize: 12, padding: "8px 0" }}>Building the probability curve as the match progresses…</div>
                  )}
                  <div className="dim" style={{ fontSize: 11, marginTop: 4 }}>
                    A live in-play read off momentum, scoreline and time remaining.
                  </div>
                </>
              )}

              <div className="flex jcb aic" style={{ margin: "22px 0 8px" }}>
                <span className="label-xs">Expected goals (cumulative)</span>
                <div className="flex gap-8" style={{ fontSize: 11 }}>
                  <span className="mono" style={{ color: "var(--blue-2)" }}>{snap.homeXg.toFixed(2)} xG</span>
                  <span className="mono" style={{ color: "var(--green-2)" }}>{snap.awayXg.toFixed(2)} xG</span>
                </div>
              </div>
              {xgSeries.length >= 2 ? (
                <ChartBox
                  style={{ width: "100%" }}
                  label={`Cumulative expected goals over time. Currently ${snap.homeTeamName} ${snap.homeXg.toFixed(2)}, ${snap.awayTeamName} ${snap.awayXg.toFixed(2)}. Dashed markers indicate goals.`}
                  deps={[snap.matchId, xgSeries.length]}
                  draw={(el) =>
                    IX.line(el, {
                      w: 560,
                      h: 150,
                      xMax: 90,
                      yMin: 0,
                      gy: 3,
                      yLabels: true,
                      yDec: 1,
                      xLabels: ["0'", "45'", "90'"],
                      markers: snap.events
                        .filter((e) => e.type === "GOAL")
                        .map((e) => ({
                          x: e.minute,
                          color: e.teamId === snap.awayTeamId ? IX.C.green : IX.C.blue,
                        })),
                      series: [
                        { color: IX.C.blue, data: xgSeries.map((d) => ({ x: d.minute, y: d.home })) },
                        { color: IX.C.green, data: xgSeries.map((d) => ({ x: d.minute, y: d.away })) },
                      ],
                    })
                  }
                />
              ) : (
                <div className="dim" style={{ fontSize: 12, padding: "8px 0" }}>Accruing expected goals as chances develop…</div>
              )}
              <div className="flex jcb" style={{ marginTop: 4, fontSize: 11, color: "var(--muted)" }}>
                <span>{snap.homeTeamName}</span>
                <span>{snap.awayTeamName}</span>
              </div>
            </div>
          </section>

          <section className="card reveal">
            <div className="card-hd"><h3>Event feed</h3><span className="badge">{snap.events.length}</span></div>
            <div className="card-bd" style={{ padding: "8px 14px" }}>
              {[...snap.events].reverse().map((e, i) => (
                <div
                  key={i}
                  className="flex aic gap-12"
                  style={{
                    padding: "10px 8px",
                    borderRadius: 10,
                    marginBottom: 4,
                    background: e.type === "GOAL" ? "rgba(39,224,138,.08)" : "transparent",
                  }}
                >
                  <span className="mono dim" style={{ width: 34 }}>{e.minute}&apos;</span>
                  <span className={`badge ${e.type === "GOAL" ? "green" : ""}`} style={{ fontSize: 9 }}>{e.type}</span>
                  <span style={{ fontSize: 13, color: "var(--text-2)" }}>{e.text}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
