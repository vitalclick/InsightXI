"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api-client";
import { Crest } from "../ui/crest";
import { Icon } from "../ui/icon";
import { FormDots } from "../ui/form-dots";
import { ChartBox } from "../charts/chart-box";
import { formationLayout } from "../../lib/formation";
import type { MarketProbability, MatchPrediction, TacticalProfile } from "../../lib/types";
import * as IX from "../../lib/ix-charts";

function findMarket(markets: MarketProbability[], needle: string): number | null {
  const m = markets.find((x) => x.label.toLowerCase().includes(needle.toLowerCase()));
  return m ? Math.round(m.probability * 100) : null;
}

const LINE_SCORE: Record<string, number> = { High: 88, Medium: 55, Low: 25 };
function tacticalRadar(p: TacticalProfile): number[] {
  return [
    p.possession,
    p.pressingIntensity,
    LINE_SCORE[p.defensiveLine] ?? 50,
    p.transitionStyle.toLowerCase().includes("counter") ? 85 : p.transitionStyle.toLowerCase().includes("direct") ? 65 : 35,
    Math.min(100, p.possession + 12),
  ];
}

export function MatchIntel({ id }: { id: string }) {
  const { data: match, isLoading } = useQuery({ queryKey: ["match", id], queryFn: () => api.match(id) });
  const { data: pred } = useQuery({ queryKey: ["prediction", id], queryFn: () => api.prediction(id), retry: 0 });
  const { data: tactical } = useQuery({ queryKey: ["tactical", id], queryFn: () => api.tactical(id), retry: 0 });

  const homeId = match?.homeTeamId;
  const awayId = match?.awayTeamId;
  const { data: homeProfile } = useQuery({ queryKey: ["team", homeId], queryFn: () => api.teamProfile(homeId!), enabled: !!homeId });
  const { data: awayProfile } = useQuery({ queryKey: ["team", awayId], queryFn: () => api.teamProfile(awayId!), enabled: !!awayId });
  const { data: h2h } = useQuery({
    queryKey: ["h2h", homeId, awayId],
    queryFn: () => api.h2h(homeId!, awayId!),
    enabled: !!homeId && !!awayId,
    retry: 0,
  });

  if (isLoading) return <div className="empty">Loading match intelligence…</div>;
  if (!match) return <div className="empty"><h4>Match not found</h4></div>;

  const favoured =
    pred && (pred.outcome.homeWin >= pred.outcome.draw && pred.outcome.homeWin >= pred.outcome.awayWin
      ? "home"
      : pred.outcome.awayWin >= pred.outcome.draw
        ? "away"
        : "draw");

  return (
    <>
      <div className="flex aic gap-8 reveal" style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14 }}>
        <Link href="/fixtures" style={{ color: "var(--blue-2)" }}>Fixtures</Link>
        <span>›</span>
        <span>{match.season} · Matchday {match.matchday}</span>
        <span>›</span>
        <span style={{ color: "var(--text)" }}>{match.homeTeamName} vs {match.awayTeamName}</span>
      </div>

      {/* HEADER */}
      <section className="card reveal" style={{ overflow: "hidden", marginBottom: 18 }}>
        <div
          style={{
            position: "relative",
            padding: "26px 30px",
            background:
              "radial-gradient(700px 300px at 18% 0%, rgba(46,125,255,.16), transparent 60%), radial-gradient(700px 300px at 82% 0%, rgba(39,224,138,.14), transparent 60%)",
          }}
        >
          <div className="flex jcb aic wrap gap-12" style={{ marginBottom: 22 }}>
            <div className="flex aic gap-10">
              <span className="badge gold">{match.status === "FINISHED" ? "Full time" : "Fixture"}</span>
              <span className="badge">Matchday {match.matchday}</span>
              <span className="dim" style={{ fontSize: 12.5, fontFamily: "var(--font-mono)" }}>
                {new Date(match.utcDate).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            {pred && (
              <span className="badge blue">
                <Icon name="bolt" size={12} /> AI confidence {Math.round(pred.topSelection.probability * 100)}%
              </span>
            )}
          </div>

          <div className="flex jcb aic" style={{ maxWidth: 780, margin: "0 auto" }}>
            <div className="flex col aic gap-10" style={{ flex: 1 }}>
              <Crest name={match.homeTeamName} seed={match.homeTeamId} size="xl" />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{match.homeTeamName}</div>
                <div className="dim" style={{ fontSize: 12 }}>Home</div>
              </div>
              {homeProfile && <FormDots form={homeProfile.recentForm} />}
            </div>
            <div className="flex col aic" style={{ flexShrink: 0, padding: "0 18px" }}>
              <div className="dim" style={{ fontSize: 11, letterSpacing: ".1em", fontFamily: "var(--font-mono)" }}>
                {match.status === "FINISHED" ? "FINAL" : "PREDICTED"}
              </div>
              <div className="mono" style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1, margin: "4px 0", whiteSpace: "nowrap" }}>
                {match.status === "FINISHED"
                  ? `${match.homeGoals}`
                  : pred
                    ? pred.expectedGoals.home.toFixed(1)
                    : "–"}
                <span className="dim" style={{ fontSize: 24 }}>–</span>
                {match.status === "FINISHED" ? `${match.awayGoals}` : pred ? pred.expectedGoals.away.toFixed(1) : "–"}
              </div>
              <div className="dim" style={{ fontSize: 11 }}>{match.status === "FINISHED" ? "full-time score" : "expected goals"}</div>
              {pred && (
                <div className={`badge ${favoured === "away" ? "green" : "blue"}`} style={{ marginTop: 10 }}>
                  {pred.topSelection.label} · {Math.round(pred.topSelection.probability * 100)}%
                </div>
              )}
            </div>
            <div className="flex col aic gap-10" style={{ flex: 1 }}>
              <Crest name={match.awayTeamName} seed={match.awayTeamId} size="xl" />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{match.awayTeamName}</div>
                <div className="dim" style={{ fontSize: 12 }}>Away</div>
              </div>
              {awayProfile && <FormDots form={awayProfile.recentForm} />}
            </div>
          </div>
        </div>
        <div className="flex jcb wrap" style={{ borderTop: "1px solid var(--line)", padding: "14px 30px", gap: 18, fontSize: 12.5 }}>
          <div className="flex aic gap-8"><span className="dim"><Icon name="analytics" size={14} /></span><span className="muted">Model: {pred?.modelBackend ?? "analytical blend"}</span></div>
          {pred && <div className="flex aic gap-8"><span className="dim"><Icon name="bolt" size={14} /></span><span className="muted">{pred.confidenceLevel}</span></div>}
          {h2h && h2h.played > 0 && (
            <div className="flex aic gap-8"><span className="dim"><Icon name="history" size={14} /></span><span className="muted">H2H: {h2h.teamAWins}W · {h2h.draws}D · {h2h.teamBWins}L</span></div>
          )}
          {homeProfile && <div className="flex aic gap-8"><span className="dim"><Icon name="results" size={14} /></span><span className="muted">Home xG {homeProfile.avgXgFor.toFixed(2)}</span></div>}
        </div>
      </section>

      {!pred ? (
        <section className="card reveal">
          <div className="card-bd empty">
            <h4>Match intelligence unavailable</h4>
            <p>The AI service is offline — outcome probabilities and explainable reasoning will appear once it&apos;s reachable.</p>
          </div>
        </section>
      ) : (
        <>
          {/* PREDICTION + CONFIDENCE */}
          <div className="grid" style={{ gridTemplateColumns: "1.05fr 1fr", alignItems: "start", marginBottom: 18 }}>
            <PredictionCard pred={pred} homeName={match.homeTeamName} awayName={match.awayTeamName} />
            <ConfidenceCard pred={pred} />
          </div>

          {/* EXPLAINABLE */}
          <section className="card reveal" style={{ marginBottom: 18 }}>
            <div className="card-hd">
              <h3><span className="ic"><Icon name="bolt" size={16} /></span> Explainable AI — why this read</h3>
              <span className="badge violet">Factor breakdown</span>
            </div>
            <div className="card-bd grid" style={{ gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>
              <div>
                {pred.explanations.map((e, i) => (
                  <div className="xai-row" key={i}>
                    <span className="xai-ic neu"><Icon name="up" size={15} /></span>
                    <span className="xai-txt">{e}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="label-xs" style={{ marginBottom: 12 }}>Market probabilities</div>
                <ChartBox
                  deps={[id]}
                  draw={(el) =>
                    IX.bars(
                      el,
                      pred.markets.slice(0, 6).map((m) => ({
                        label: m.label,
                        v: Math.round(m.probability * 100),
                        disp: `${Math.round(m.probability * 100)}%`,
                      })),
                      { horiz: true, labelW: 120, valW: 40, max: 100 },
                    )
                  }
                />
              </div>
            </div>
          </section>

          {/* TACTICAL */}
          {tactical && (
            <>
              <section className="section-title reveal">
                <h2><span className="ic" style={{ color: "var(--blue-2)" }}><Icon name="teams" size={16} /></span> Tactical Analysis</h2>
                <div className="ln" />
              </section>
              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1.1fr", alignItems: "start", marginBottom: 18 }}>
                <section className="card reveal">
                  <div className="card-hd"><h3>{tactical.home.name} · {tactical.home.formation}</h3><span className="badge blue">{tactical.home.transitionStyle}</span></div>
                  <div className="card-bd flex jcc">
                    <ChartBox style={{ width: 240 }} deps={[tactical.home.formation]} draw={(el) => IX.formation(el, formationLayout(tactical.home.formation), { color: IX.C.blue })} />
                  </div>
                </section>
                <section className="card reveal">
                  <div className="card-hd"><h3>{tactical.away.name} · {tactical.away.formation}</h3><span className="badge green">{tactical.away.transitionStyle}</span></div>
                  <div className="card-bd flex jcc">
                    <ChartBox style={{ width: 240 }} deps={[tactical.away.formation]} draw={(el) => IX.formation(el, formationLayout(tactical.away.formation), { color: IX.C.green })} />
                  </div>
                </section>
                <div className="grid" style={{ gap: 18 }}>
                  <section className="card reveal">
                    <div className="card-hd"><h3>Tactical profile</h3><span className="badge">Edge {tactical.tacticalEdge > 0 ? "+" : ""}{tactical.tacticalEdge}</span></div>
                    <div className="card-bd flex gap-16 aic">
                      <ChartBox
                        style={{ width: 200 }}
                        deps={[id]}
                        draw={(el) =>
                          IX.radar(el, {
                            size: 200,
                            axes: ["Poss", "Press", "Line", "Transit", "Tempo"],
                            series: [
                              { color: IX.C.blue, values: tacticalRadar(tactical.home) },
                              { color: IX.C.green, values: tacticalRadar(tactical.away) },
                            ],
                          })
                        }
                      />
                      <div style={{ flex: 1 }}>
                        <div className="flex aic gap-8" style={{ marginBottom: 8 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: "var(--blue)" }} /><b style={{ fontSize: 12.5 }}>{tactical.home.name}</b></div>
                        <div className="flex aic gap-8"><span style={{ width: 9, height: 9, borderRadius: 3, background: "var(--green)" }} /><b style={{ fontSize: 12.5 }}>{tactical.away.name}</b></div>
                      </div>
                    </div>
                  </section>
                  <section className="card reveal">
                    <div className="card-hd"><h3>Matchup insights</h3></div>
                    <div className="card-bd">
                      {tactical.insights.map((t, i) => (
                        <div className="xai-row" key={i}><span className="xai-ic"><Icon name="check" size={15} /></span><span className="xai-txt">{t}</span></div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </>
          )}

          {/* HISTORY */}
          {h2h && h2h.played > 0 && (
            <>
              <section className="section-title reveal">
                <h2><span className="ic" style={{ color: "var(--blue-2)" }}><Icon name="history" size={16} /></span> Historical Analysis</h2>
                <div className="ln" />
              </section>
              <div className="grid" style={{ gridTemplateColumns: "1fr 1.5fr", alignItems: "start", marginBottom: 18 }}>
                <section className="card reveal">
                  <div className="card-hd"><h3>Head to Head</h3><span className="badge">{h2h.played} meetings</span></div>
                  <div className="card-bd">
                    <div className="flex jcb aic" style={{ marginBottom: 16 }}>
                      <div className="center"><div className="stat-val" style={{ color: "var(--blue-2)" }}>{h2h.teamAWins}</div><div className="stat-lab">{match.homeTeamName} wins</div></div>
                      <div className="center"><div className="stat-val" style={{ color: "var(--muted)" }}>{h2h.draws}</div><div className="stat-lab">Draws</div></div>
                      <div className="center"><div className="stat-val" style={{ color: "var(--green)" }}>{h2h.teamBWins}</div><div className="stat-lab">{match.awayTeamName} wins</div></div>
                    </div>
                    <div className="meter" style={{ height: 9, display: "flex" }}>
                      <i style={{ width: `${(h2h.teamAWins / h2h.played) * 100}%`, background: "var(--blue)", borderRadius: 0 }} />
                      <i style={{ width: `${(h2h.draws / h2h.played) * 100}%`, background: "#54607a", borderRadius: 0 }} />
                      <i style={{ width: `${(h2h.teamBWins / h2h.played) * 100}%`, background: "var(--green)", borderRadius: 0 }} />
                    </div>
                  </div>
                </section>
                <section className="card reveal">
                  <div className="card-hd"><h3>Scoring profile · this fixture</h3><span className="badge gold">Avg {h2h.avgGoalsPerGame.toFixed(1)} goals</span></div>
                  <div className="card-bd">
                    <div className="flex jcb">
                      <div className="stat"><div className="stat-val" style={{ fontSize: 19 }}>{h2h.avgGoalsPerGame.toFixed(2)}</div><div className="stat-lab">Avg total goals</div></div>
                      <div className="stat"><div className="stat-val" style={{ fontSize: 19, color: "var(--green)" }}>{Math.round(h2h.bttsRate * 100)}%</div><div className="stat-lab">BTTS rate</div></div>
                      <div className="stat"><div className="stat-val" style={{ fontSize: 19, color: "var(--blue-2)" }}>{h2h.teamAWins - h2h.teamBWins > 0 ? "+" : ""}{h2h.teamAWins - h2h.teamBWins}</div><div className="stat-lab">H2H win margin</div></div>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

function PredictionCard({ pred, homeName, awayName }: { pred: MatchPrediction; homeName: string; awayName: string }) {
  const h = Math.round(pred.outcome.homeWin * 100);
  const d = Math.round(pred.outcome.draw * 100);
  const a = Math.round(pred.outcome.awayWin * 100);
  const o15 = findMarket(pred.markets, "Over 1.5");
  const o25 = findMarket(pred.markets, "Over 2.5");
  const btts = findMarket(pred.markets, "Both Teams") ?? findMarket(pred.markets, "BTTS");

  return (
    <section className="card reveal">
      <div className="card-hd"><h3><span className="ic"><Icon name="analytics" size={16} /></span> AI Prediction Engine</h3><span className="badge blue">{pred.modelBackend}</span></div>
      <div className="card-bd">
        <div className="flex aic gap-24" style={{ marginBottom: 8 }}>
          <ChartBox
            style={{ width: 160, flexShrink: 0 }}
            deps={[h, d, a]}
            draw={(el) =>
              IX.donut(el, [
                { v: h, color: IX.C.blue },
                { v: d, color: "#6b7689" },
                { v: a, color: IX.C.green },
              ], { size: 160, centerTop: `${Math.max(h, d, a)}%`, centerBot: pred.topSelection.label })
            }
          />
          <div style={{ flex: 1 }}>
            <Legend color="var(--blue)" label={`${homeName} win`} value={h} />
            <Legend color="#6b7689" label="Draw" value={d} />
            <Legend color="var(--green)" label={`${awayName} win`} value={a} />
          </div>
        </div>
        <div style={{ height: 1, background: "var(--line)", margin: "16px 0" }} />
        <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 10, textAlign: "center" }}>
          {[
            { v: o15, l: "Over 1.5" },
            { v: o25, l: "Over 2.5" },
            { v: btts, l: "BTTS" },
          ].map((m) => (
            <div key={m.l}>
              {m.v != null ? (
                <ChartBox style={{ width: 96, margin: "0 auto" }} deps={[m.v]} draw={(el) => IX.ring(el, m.v!, { size: 96, color: IX.C.cyan })} />
              ) : (
                <div className="dim" style={{ height: 96, display: "grid", placeItems: "center" }}>—</div>
              )}
              <div className="stat-lab" style={{ marginTop: 4 }}>{m.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ConfidenceCard({ pred }: { pred: MatchPrediction }) {
  const conf = Math.round(pred.topSelection.probability * 100);
  return (
    <section className="card reveal">
      <div className="card-hd"><h3><span className="ic"><Icon name="bolt" size={16} /></span> Confidence Meter</h3><span className="badge green">{pred.confidenceLevel}</span></div>
      <div className="card-bd">
        <div className="flex aic gap-20">
          <ChartBox style={{ width: 180, flexShrink: 0 }} deps={[conf]} draw={(el) => IX.gauge(el, conf, { size: 180, label: "confidence" })} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55, marginBottom: 14 }}>
              The ensemble blends Poisson scorelines, Elo and a logistic/XGBoost vote. Its strongest read is{" "}
              <b style={{ color: "var(--text)" }}>{pred.topSelection.label}</b>.
            </div>
            {pred.markets.slice(0, 3).map((m) => (
              <div key={m.market} className="flex aic gap-8" style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "var(--text-2)", width: 110, flexShrink: 0 }}>{m.label}</span>
                <span className="meter green" style={{ flex: 1 }}><i style={{ width: `${Math.round(m.probability * 100)}%` }} /></span>
                <span className="mono" style={{ fontSize: 12, width: 36, textAlign: "right" }}>{Math.round(m.probability * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex aic gap-8" style={{ marginBottom: 8, fontSize: 13 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
      <span className="muted">{label}</span>
      <span className="mono" style={{ marginLeft: "auto", fontWeight: 700 }}>{value}%</span>
    </div>
  );
}
