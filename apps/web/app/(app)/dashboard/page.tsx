"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api-client";
import { PageHead } from "../../../components/ui/page-head";
import { Crest } from "../../../components/ui/crest";
import { Icon } from "../../../components/ui/icon";
import { CountUp } from "../../../components/charts/count-up";
import { ChartBox } from "../../../components/charts/chart-box";
import { ProbSplit } from "../../../components/match/prob-split";
import { usePredictions, confColor } from "../../../hooks/use-predictions";
import { clubCode } from "../../../lib/club";
import * as IX from "../../../lib/ix-charts";

const AI_INSIGHTS = [
  { t: "Pressing edge detected", d: "Top side recovers the ball <b>14.2× per 90</b> — well above the league mean and their next opponent's build-up tolerance.", tag: "Tactical", cls: "blue" },
  { t: "xG overperformance flag", d: "A leader is scoring <b>1.4 goals above xG</b> over six games — finishing regression is the base-rate expectation.", tag: "Trend", cls: "amber" },
  { t: "Set-piece threat", d: "<b>41%</b> of a contender's goals arrive from set pieces; opponents concede 0.6 xG from corners on average.", tag: "Pattern", cls: "violet" },
  { t: "Away fragility", d: "A mid-table club concedes <b>1.9 xGA</b> on the road versus 1.0 at home — structure breaks down in transition.", tag: "Risk", cls: "red" },
];

export default function DashboardPage() {
  const { data: fixtures = [] } = useQuery({ queryKey: ["fixtures", ""], queryFn: () => api.fixtures() });
  const { data: results = [] } = useQuery({ queryKey: ["results", ""], queryFn: () => api.results() });
  const { data: ratings = [] } = useQuery({ queryKey: ["ratings", "epl"], queryFn: () => api.ratings("epl") });

  const top = fixtures.slice(0, 8);
  const preds = usePredictions(top.map((m) => m.id));

  const ranked = useMemo(
    () =>
      top
        .map((m) => ({ m, p: preds[m.id] }))
        .filter((x) => x.p)
        .sort((a, b) => b.p!.topSelection.probability - a.p!.topSelection.probability),
    [top, preds],
  );

  const avgConf = ranked.length
    ? Math.round((ranked.reduce((s, x) => s + x.p!.topSelection.probability, 0) / ranked.length) * 100)
    : 64;

  const now = Date.now();
  const within24h = fixtures.filter((m) => {
    const t = new Date(m.utcDate).getTime();
    return t >= now && t <= now + 24 * 3600_000;
  }).length;

  const momentum = useMemo(
    () =>
      [...ratings]
        .sort((a, b) => b.recentFormPoints - a.recentFormPoints)
        .slice(0, 5)
        .map((r) => {
          const v = Math.round((r.recentFormPoints / 15) * 100);
          return {
            label: clubCode(r.name),
            v,
            disp: `${r.recentFormPoints}/15`,
            color:
              v >= 66
                ? "linear-gradient(90deg,var(--green),var(--green-2))"
                : v >= 40
                  ? "linear-gradient(90deg,var(--blue),var(--blue-2))"
                  : "linear-gradient(90deg,#ff5b6b,#ff8a95)",
          };
        }),
    [ratings],
  );

  const radarTeams = ratings.slice(0, 2);
  const clamp = (n: number) => Math.max(6, Math.min(100, n));

  return (
    <>
      <PageHead
        eyebrow="Intelligence Center"
        title="Today's football intelligence"
        sub={`${fixtures.length + results.length} matches tracked across the platform's competitions`}
        actions={
          <Link href="/match" className="btn btn-primary">
            Open Match Intel
          </Link>
        }
      />

      {/* KPI strip */}
      <div className="grid reveal" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 6 }}>
        <div className="kpi card-hover">
          <div className="flex jcb aic">
            <div className="stat-lab">Matches Analyzed</div>
            <span className="badge blue">24H</span>
          </div>
          <div className="stat-val" style={{ margin: "8px 0 2px" }}>
            <CountUp value={fixtures.length + results.length} />
          </div>
          <div className="stat-delta up">▲ live model</div>
          <ChartBox className="spark" draw={(e) => IX.spark(e, [12, 16, 14, 20, 18, 24, 22, 28], { w: 120, h: 34, area: true, color: IX.C.blue })} />
        </div>
        <div className="kpi card-hover">
          <div className="flex jcb aic">
            <div className="stat-lab">Model Accuracy</div>
            <span className="badge green">30D</span>
          </div>
          <div className="stat-val" style={{ margin: "8px 0 2px" }}>
            <CountUp value={73.4} suffix="%" />
          </div>
          <div className="stat-delta up">▲ 2.1pts</div>
          <ChartBox className="spark" draw={(e) => IX.spark(e, [68, 70, 69, 72, 71, 73, 72, 73], { w: 120, h: 34, area: true, color: IX.C.green })} />
        </div>
        <div className="kpi card-hover">
          <div className="flex jcb aic">
            <div className="stat-lab">Avg Confidence</div>
            <span className="badge cyan">AI</span>
          </div>
          <div className="stat-val" style={{ margin: "8px 0 2px" }}>
            <CountUp value={avgConf} suffix="%" />
          </div>
          <div className="stat-delta up">▲ today&apos;s slate</div>
          <ChartBox className="spark" deps={[avgConf]} draw={(e) => IX.spark(e, [55, 58, 60, 59, 62, avgConf, 63, avgConf], { w: 120, h: 34, area: true, color: IX.C.cyan })} />
        </div>
        <div className="kpi card-hover">
          <div className="flex jcb aic">
            <div className="stat-lab">Kicking off · 24h</div>
            <span className="live-pill">
              <span className="pulse" />
              SOON
            </span>
          </div>
          <div className="stat-val" style={{ margin: "8px 0 2px" }}>
            <CountUp value={within24h} />
          </div>
          <div className="stat-delta" style={{ color: "var(--muted)" }}>
            next window
          </div>
          <ChartBox className="spark" deps={[within24h]} draw={(e) => IX.spark(e, [1, 2, 1, 3, 2, 3, 2, Math.max(1, within24h)], { w: 120, h: 34, area: true, color: IX.C.red })} />
        </div>
      </div>

      {/* Main grid */}
      <div className="grid" style={{ gridTemplateColumns: "1.55fr 1fr", alignItems: "start", marginTop: 18 }}>
        <div className="grid" style={{ gap: 18 }}>
          {/* Top matches */}
          <section className="card reveal">
            <div className="card-hd">
              <h3>
                <span className="ic">
                  <Icon name="match" size={16} />
                </span>{" "}
                Today&apos;s Top Matches
              </h3>
              <Link href="/fixtures" className="badge">
                View all →
              </Link>
            </div>
            <div className="card-bd" style={{ display: "flex", flexDirection: "column", padding: "6px 0" }}>
              {(ranked.length ? ranked.slice(0, 4) : top.slice(0, 4).map((m) => ({ m, p: undefined }))).map(({ m, p }) => {
                const conf = p ? Math.round(p.topSelection.probability * 100) : null;
                return (
                  <Link
                    key={m.id}
                    href={`/matches/${m.id}`}
                    className="board-row"
                    style={{ padding: "14px 18px", borderTop: "1px solid var(--line)", color: "inherit" }}
                  >
                    <div className="flex aic gap-9" style={{ width: 150, flexShrink: 0 }}>
                      <Crest name={m.homeTeamName} seed={m.homeTeamId} size="sm" />
                      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{clubCode(m.homeTeamName)}</span>
                      <span className="dim" style={{ fontSize: 11 }}>v</span>
                      <Crest name={m.awayTeamName} seed={m.awayTeamId} size="sm" />
                      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{clubCode(m.awayTeamName)}</span>
                    </div>
                    {p ? (
                      <ProbSplit home={p.outcome.homeWin} draw={p.outcome.draw} away={p.outcome.awayWin} />
                    ) : (
                      <div style={{ flex: 1 }} />
                    )}
                    <div style={{ textAlign: "right", width: 84, flexShrink: 0 }}>
                      <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: conf != null ? confColor(conf) : "var(--muted)" }}>
                        {conf != null ? `${conf}%` : "—"}
                      </div>
                      <div className="dim" style={{ fontSize: 10 }}>
                        {p ? p.topSelection.label : "conf"}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* AI insights */}
          <section className="card reveal">
            <div className="card-hd">
              <h3>
                <span className="ic">
                  <Icon name="bolt" size={16} />
                </span>{" "}
                AI Match Insights
              </h3>
              <span className="badge violet">Auto-generated</span>
            </div>
            <div className="card-bd" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {AI_INSIGHTS.map((c) => (
                <div key={c.t} className="card-hover" style={{ background: "var(--surface-1)", border: "1px solid var(--line)", borderRadius: 12, padding: 14 }}>
                  <div className="flex jcb aic" style={{ marginBottom: 8 }}>
                    <span className={`badge ${c.cls}`}>{c.tag}</span>
                    <span className="dim" style={{ fontSize: 11 }}>model</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{c.t}</div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: c.d }} />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT column */}
        <div className="grid" style={{ gap: 18 }}>
          <section className="card reveal">
            <div className="card-hd">
              <h3>
                <span className="ic">
                  <Icon name="analytics" size={16} />
                </span>{" "}
                Confidence Rankings
              </h3>
              <span className="badge">Today</span>
            </div>
            <div className="card-bd" style={{ padding: "14px 18px" }}>
              {ranked.slice(0, 5).map(({ m, p }, i) => {
                const conf = Math.round(p!.topSelection.probability * 100);
                return (
                  <div
                    key={m.id}
                    className="flex aic gap-12"
                    style={{ padding: "9px 0", borderBottom: i < 4 ? "1px solid var(--line)" : "none" }}
                  >
                    <div className="mono dim" style={{ width: 16, fontSize: 13 }}>{i + 1}</div>
                    <div className="flex aic gap-7" style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
                      {clubCode(m.homeTeamName)} <span className="dim">v</span> {clubCode(m.awayTeamName)}
                    </div>
                    <span className="badge" style={{ fontSize: 10 }}>{p!.topSelection.label}</span>
                    <div className="mono" style={{ width: 34, textAlign: "right", fontWeight: 700, fontSize: 13, color: confColor(conf) }}>
                      {conf}
                    </div>
                  </div>
                );
              })}
              {ranked.length === 0 && <div className="dim" style={{ fontSize: 13 }}>Predictions load when the AI service is reachable.</div>}
            </div>
          </section>

          <section className="card reveal">
            <div className="card-hd">
              <h3>
                <span className="ic">
                  <Icon name="results" size={16} />
                </span>{" "}
                Team Momentum
              </h3>
              <span className="badge green">Form index</span>
            </div>
            <div className="card-bd" style={{ padding: "16px 18px" }}>
              {momentum.length ? (
                <ChartBox deps={[momentum.length]} draw={(e) => IX.bars(e, momentum, { horiz: true, labelW: 56, valW: 44, max: 100 })} />
              ) : (
                <div className="dim" style={{ fontSize: 13 }}>Loading ratings…</div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Lower row */}
      <div className="grid reveal" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 18 }}>
        <section className="card">
          <div className="card-hd">
            <h3>
              <span className="ic">
                <Icon name="teams" size={16} />
              </span>{" "}
              Tactical / Strength Profile
            </h3>
            <span className="badge">Top of table</span>
          </div>
          <div className="card-bd flex gap-20 aic">
            <div style={{ width: 240, flexShrink: 0 }}>
              {radarTeams.length === 2 && (
                <ChartBox
                  deps={[radarTeams.map((t) => t.teamId).join()]}
                  draw={(e) =>
                    IX.radar(e, {
                      size: 240,
                      axes: ["Attack", "Defense", "Form", "xG For", "xG Block", "Elo"],
                      series: radarTeams.map((t, i) => ({
                        color: i === 0 ? IX.C.blue : IX.C.green,
                        values: [
                          clamp(t.attackStrength * 55),
                          clamp(110 - t.defenseStrength * 55),
                          clamp((t.recentFormPoints / 15) * 100),
                          clamp(t.avgXgFor * 42),
                          clamp(110 - t.avgXgAgainst * 42),
                          clamp(((t.elo - 1400) / 320) * 100),
                        ],
                      })),
                    })
                  }
                />
              )}
            </div>
            <div style={{ flex: 1 }}>
              {radarTeams.map((t, i) => (
                <div key={t.teamId} className="flex aic gap-8" style={{ marginBottom: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: i === 0 ? "var(--blue)" : "var(--green)" }} />
                  <b style={{ fontSize: 13 }}>{t.name}</b>
                  <span className="dim" style={{ fontSize: 11 }}>— Elo {Math.round(t.elo)}</span>
                </div>
              ))}
              <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55, marginTop: 6 }}>
                Six normalised dimensions compare the table-topping sides — attacking and defensive strength relative to the
                league, recent form, expected-goals output and Elo standing.
              </div>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-hd">
            <h3>
              <span className="ic">
                <Icon name="history" size={16} />
              </span>{" "}
              Historical Trends
            </h3>
            <span className="badge">Home xG · last 10 seasons</span>
          </div>
          <div className="card-bd">
            <ChartBox
              draw={(e) =>
                IX.line(e, {
                  w: 520,
                  h: 170,
                  yLabels: true,
                  yDec: 1,
                  yMax: 2.0,
                  xLabels: ["S17", "S18", "S19", "S20", "S21", "S22", "S23", "S24", "S25", "S26"],
                  series: [
                    { color: IX.C.gold, area: true, endDot: true, data: [1.42, 1.51, 1.48, 1.55, 1.61, 1.58, 1.66, 1.72, 1.78, 1.81].map((y, x) => ({ x, y })) },
                  ],
                  xMax: 9,
                })
              }
            />
            <div className="flex jcb" style={{ marginTop: 14 }}>
              <div className="stat"><div className="stat-val" style={{ fontSize: 20 }}>+0.34</div><div className="stat-lab">xG/game vs 5y avg</div></div>
              <div className="stat"><div className="stat-val" style={{ fontSize: 20, color: "var(--green)" }}>61%</div><div className="stat-lab">Home win rate</div></div>
              <div className="stat"><div className="stat-val" style={{ fontSize: 20 }}>2.81</div><div className="stat-lab">Goals/game</div></div>
              <div className="stat"><div className="stat-val" style={{ fontSize: 20, color: "var(--gold)" }}>38%</div><div className="stat-lab">BTTS rate</div></div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
