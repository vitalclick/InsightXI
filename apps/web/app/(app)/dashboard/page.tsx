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
import { useLive } from "../../../hooks/use-live";
import { clubCode } from "../../../lib/club";
import * as IX from "../../../lib/ix-charts";

export default function DashboardPage() {
  const { data: fixtures = [] } = useQuery({ queryKey: ["fixtures", ""], queryFn: () => api.fixtures() });
  const { data: results = [] } = useQuery({ queryKey: ["results", ""], queryFn: () => api.results() });
  const { data: ratings = [] } = useQuery({ queryKey: ["ratings", "epl"], queryFn: () => api.ratings("epl") });
  const { data: bracket } = useQuery({ queryKey: ["tournament-bracket"], queryFn: api.tournamentBracket });
  const { snapshot: live, connected } = useLive();

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

  // World Cup banner enrichment — projected final + nation count from the bracket.
  const wcFinal = useMemo(
    () => bracket?.rounds.find((r) => r.stage === "FINAL")?.ties[0],
    [bracket],
  );
  const wcNations = bracket
    ? bracket.groups.reduce((n, g) => n + g.table.length, 0)
    : null;
  // Real bracket-narrowing series for the KPI sparkline (16 → 8 → 4 → 2 → 1).
  const wcRoundSizes = bracket?.rounds.map((r) => r.ties.length) ?? [16, 8, 4, 2, 1];

  // AI insights from real model output — the top picks' own explanations.
  const insights = useMemo(
    () =>
      ranked
        .filter((x) => x.p!.explanations.length > 0)
        .slice(0, 4)
        .map(({ m, p }) => ({
          id: m.id,
          title: `${clubCode(m.homeTeamName)} v ${clubCode(m.awayTeamName)}`,
          level: p!.confidenceLevel,
          pick: p!.topSelection.label,
          prob: Math.round(p!.topSelection.probability * 100),
          reason: p!.explanations[0],
        })),
    [ranked],
  );

  // Real sparkline series for the KPI strip — no decorative fabricated trends.
  const mdSeries = useMemo(() => {
    const by = new Map<number, number>();
    for (const m of results) {
      if (m.homeGoals != null) by.set(m.matchday, (by.get(m.matchday) ?? 0) + 1);
    }
    return [...by.entries()].sort((a, b) => a[0] - b[0]).map(([, c]) => c);
  }, [results]);
  const confSeries = useMemo(
    () => ranked.map((x) => Math.round(x.p!.topSelection.probability * 100)),
    [ranked],
  );
  const kickoffSeries = useMemo(() => {
    const now = Date.now();
    const days = [0, 0, 0, 0, 0];
    for (const m of fixtures) {
      const d = Math.floor((new Date(m.utcDate).getTime() - now) / (24 * 3600_000));
      if (d >= 0 && d < days.length) days[d] += 1;
    }
    return days;
  }, [fixtures]);
  const spark = (s: number[]) => (s.length ? s : [0]);

  // Season form aggregates computed from real finished matches (no placeholders).
  const season = useMemo(() => {
    const played = results.filter((m) => m.homeGoals != null && m.awayGoals != null);
    const n = played.length;
    if (!n) return null;
    const count = (f: (m: (typeof played)[number]) => boolean) =>
      played.filter(f).length / n;
    const sum = (f: (m: (typeof played)[number]) => number) =>
      played.reduce((s, m) => s + f(m), 0);
    return {
      n,
      goalsPg: sum((m) => m.homeGoals! + m.awayGoals!) / n,
      xgPg: sum((m) => (m.homeXg ?? 0) + (m.awayXg ?? 0)) / n,
      homeWin: count((m) => m.homeGoals! > m.awayGoals!),
      draw: count((m) => m.homeGoals! === m.awayGoals!),
      awayWin: count((m) => m.homeGoals! < m.awayGoals!),
      btts: count((m) => m.homeGoals! > 0 && m.awayGoals! > 0),
      over25: count((m) => m.homeGoals! + m.awayGoals! > 2.5),
    };
  }, [results]);

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

      {/* FIFA World Cup 2026 — launch tournament highlight (always an entry
          point; enriches with the projected champion + final once data loads) */}
      <Link
        href="/bracket"
        className="card reveal flex aic jcb wrap gap-12"
        style={{
          marginBottom: 16,
          padding: "14px 20px",
          color: "inherit",
          textDecoration: "none",
          background:
            "linear-gradient(120deg, color-mix(in srgb, var(--blue) 18%, transparent), color-mix(in srgb, var(--green) 10%, transparent) 70%)",
        }}
      >
        <div className="flex aic gap-12" style={{ minWidth: 220 }}>
          {bracket?.champion ? (
            <Crest name={bracket.champion.name} seed={bracket.champion.teamId} size="md" />
          ) : (
            <span className="xai-ic" style={{ width: 38, height: 38 }}>
              <Icon name="trophy" size={18} />
            </span>
          )}
          <div>
            <div className="label-xs flex aic gap-6">
              <Icon name="trophy" size={13} /> FIFA World Cup 2026 · projected bracket
            </div>
            <div style={{ fontWeight: 800, fontSize: 17, color: "var(--text)" }}>
              {bracket?.champion ? (
                <>
                  {bracket.champion.name}{" "}
                  <span className="dim" style={{ fontWeight: 500, fontSize: 13 }}>projected champion</span>
                </>
              ) : (
                "Explore the projected bracket"
              )}
            </div>
          </div>
        </div>
        <span className="flex aic gap-10 wrap dim" style={{ fontSize: 12 }}>
          {wcFinal?.home && wcFinal.away && (
            <span className="flex aic gap-5" title="Projected final">
              <Crest name={wcFinal.home.name} seed={wcFinal.home.teamId} size="xs" />
              {wcFinal.home.shortName} <span className="dim">vs</span> {wcFinal.away.shortName}
              <Crest name={wcFinal.away.name} seed={wcFinal.away.teamId} size="xs" />
              <span className="badge gold" style={{ fontSize: 9 }}>Final</span>
            </span>
          )}
          <span>
            {wcNations ?? 48} nations · {bracket?.qualifiers.length ?? 32} qualifiers ·{" "}
            {bracket?.rounds.length ?? 5} knockout rounds
          </span>
          <span className="btn btn-sm btn-primary">View bracket →</span>
        </span>
      </Link>

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
          <div className="stat-delta" style={{ color: "var(--muted)" }}>fixtures + results</div>
          <ChartBox className="spark" deps={[mdSeries.join()]} draw={(e) => IX.spark(e, spark(mdSeries), { w: 120, h: 34, area: true, color: IX.C.blue })} />
        </div>
        <div className="kpi card-hover">
          <div className="flex jcb aic">
            <div className="stat-lab">World Cup Qualifiers</div>
            <span className="badge gold">WC26</span>
          </div>
          <div className="stat-val" style={{ margin: "8px 0 2px" }}>
            <CountUp value={bracket?.qualifiers.length ?? 32} />
          </div>
          <div className="stat-delta" style={{ color: "var(--muted)" }}>of {wcNations ?? 48} nations</div>
          <ChartBox className="spark" deps={[wcRoundSizes.join()]} draw={(e) => IX.spark(e, spark(wcRoundSizes), { w: 120, h: 34, area: true, color: IX.C.gold })} />
        </div>
        <div className="kpi card-hover">
          <div className="flex jcb aic">
            <div className="stat-lab">Avg Confidence</div>
            <span className="badge cyan">AI</span>
          </div>
          <div className="stat-val" style={{ margin: "8px 0 2px" }}>
            <CountUp value={avgConf} suffix="%" />
          </div>
          <div className="stat-delta" style={{ color: "var(--muted)" }}>today&apos;s slate</div>
          <ChartBox className="spark" deps={[confSeries.join()]} draw={(e) => IX.spark(e, spark(confSeries), { w: 120, h: 34, area: true, color: IX.C.cyan })} />
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
            next 5 days
          </div>
          <ChartBox className="spark" deps={[kickoffSeries.join()]} draw={(e) => IX.spark(e, spark(kickoffSeries), { w: 120, h: 34, area: true, color: IX.C.red })} />
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

          {/* AI insights — real model reasoning from today's top predictions */}
          <section className="card reveal">
            <div className="card-hd">
              <h3>
                <span className="ic">
                  <Icon name="bolt" size={16} />
                </span>{" "}
                AI Match Insights
              </h3>
              <span className="badge violet">Explainable</span>
            </div>
            <div className="card-bd" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {insights.map((c) => (
                <Link
                  key={c.id}
                  href={`/matches/${c.id}`}
                  className="card-hover"
                  style={{ background: "var(--surface-1)", border: "1px solid var(--line)", borderRadius: 12, padding: 14, color: "inherit", textDecoration: "none" }}
                >
                  <div className="flex jcb aic" style={{ marginBottom: 8 }}>
                    <span className="badge blue">{c.level}</span>
                    <span className="mono" style={{ fontSize: 11, color: confColor(c.prob) }}>{c.prob}%</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                    {c.title} <span className="dim" style={{ fontWeight: 500, fontSize: 12 }}>· {c.pick}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>{c.reason}</div>
                </Link>
              ))}
              {insights.length === 0 && (
                <div className="dim" style={{ fontSize: 13, gridColumn: "1 / -1", padding: "6px 0" }}>
                  Insights load when the AI service is reachable.
                </div>
              )}
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
                <span className="ic" style={{ color: "var(--red)" }}>
                  <Icon name="live" size={16} />
                </span>{" "}
                Live Intelligence
              </h3>
              <Link href="/live" className={`badge ${live ? "red" : ""}`}>
                {live ? "1 live" : connected ? "standby" : "offline"}
              </Link>
            </div>
            <div className="card-bd" style={{ padding: "12px 16px" }}>
              {live ? (
                <Link href="/live" style={{ display: "block", color: "inherit" }}>
                  <div className="flex jcb aic" style={{ marginBottom: 8 }}>
                    <span className="live-pill">
                      <span className="pulse" />
                      {live.status === "LIVE" ? `${live.minute}'` : "FT"}
                    </span>
                    <span className="dim" style={{ fontSize: 10 }}>momentum {live.momentum > 0 ? "+" : ""}{live.momentum}</span>
                  </div>
                  <div className="flex jcb aic">
                    <div className="flex aic gap-8" style={{ fontSize: 13, fontWeight: 600 }}>
                      <Crest name={live.homeTeamName} seed={live.homeTeamId} size="xs" /> {clubCode(live.homeTeamName)}
                    </div>
                    <span className="mono" style={{ fontSize: 18, fontWeight: 800 }}>{live.homeGoals} – {live.awayGoals}</span>
                    <div className="flex aic gap-8" style={{ fontSize: 13, fontWeight: 600 }}>
                      {clubCode(live.awayTeamName)} <Crest name={live.awayTeamName} seed={live.awayTeamId} size="xs" />
                    </div>
                  </div>
                  <div style={{ display: "flex", height: 5, borderRadius: 20, overflow: "hidden", background: "var(--surface-3)", marginTop: 10 }}>
                    <i style={{ width: `${Math.round(50 + live.momentum / 2)}%`, background: "var(--blue)" }} />
                    <i style={{ width: `${100 - Math.round(50 + live.momentum / 2)}%`, background: "var(--green)" }} />
                  </div>
                </Link>
              ) : (
                <div className="dim" style={{ fontSize: 13, padding: "6px 0" }}>
                  {connected ? "Waiting for the next live kickoff…" : "Live feed offline — start the API to stream matches."}
                </div>
              )}
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
                <Icon name="results" size={16} />
              </span>{" "}
              Season Form Index
            </h3>
            <span className="badge">{season ? `this season · ${season.n} matches` : "this season"}</span>
          </div>
          <div className="card-bd">
            {season ? (
              <>
                <ChartBox
                  deps={[season.n]}
                  draw={(e) =>
                    IX.bars(
                      e,
                      [
                        { label: "Home win", v: Math.round(season.homeWin * 100), disp: `${Math.round(season.homeWin * 100)}%`, color: "linear-gradient(90deg,var(--blue),var(--blue-2))" },
                        { label: "Draw", v: Math.round(season.draw * 100), disp: `${Math.round(season.draw * 100)}%`, color: "linear-gradient(90deg,#54607a,#6b7689)" },
                        { label: "Away win", v: Math.round(season.awayWin * 100), disp: `${Math.round(season.awayWin * 100)}%`, color: "linear-gradient(90deg,var(--green),var(--green-2))" },
                        { label: "BTTS", v: Math.round(season.btts * 100), disp: `${Math.round(season.btts * 100)}%`, color: "linear-gradient(90deg,var(--gold),#f0d28a)" },
                        { label: "Over 2.5", v: Math.round(season.over25 * 100), disp: `${Math.round(season.over25 * 100)}%`, color: "linear-gradient(90deg,var(--cyan),#5ee0ec)" },
                      ],
                      { horiz: true, labelW: 64, valW: 44, max: 100 },
                    )
                  }
                />
                <div className="flex jcb" style={{ marginTop: 14 }}>
                  <div className="stat"><div className="stat-val" style={{ fontSize: 20 }}>{season.goalsPg.toFixed(2)}</div><div className="stat-lab">Goals/game</div></div>
                  <div className="stat"><div className="stat-val" style={{ fontSize: 20, color: "var(--green)" }}>{Math.round(season.homeWin * 100)}%</div><div className="stat-lab">Home win rate</div></div>
                  <div className="stat"><div className="stat-val" style={{ fontSize: 20, color: "var(--gold)" }}>{Math.round(season.btts * 100)}%</div><div className="stat-lab">BTTS rate</div></div>
                  <div className="stat"><div className="stat-val" style={{ fontSize: 20 }}>{season.xgPg.toFixed(2)}</div><div className="stat-lab">xG/game</div></div>
                </div>
              </>
            ) : (
              <div className="dim" style={{ fontSize: 13 }}>Season form loads when results are available.</div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
