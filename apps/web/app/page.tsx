"use client";

import "./landing.css";
import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api-client";
import { Logo, Icon } from "../components/ui/icon";
import { Crest } from "../components/ui/crest";
import { ThemeToggle } from "../components/theme/theme-toggle";
import { ChartBox } from "../components/charts/chart-box";
import { confColor } from "../hooks/use-predictions";
import type { BracketTie } from "../lib/types";
import * as IX from "../lib/ix-charts";

const FEATURES = [
  { icon: "target", color: "var(--blue-2)", bg: "rgba(46,125,255,.12)", t: "Group-Stage Projections", d: "Expected-points tables for all 12 groups — actual points where matches are played, projected from national-team priors where they aren't." },
  { icon: "check", color: "var(--green-2)", bg: "rgba(39,224,138,.12)", t: "Knockout Path Modelling", d: "Every tie from the Round of 32 to the final, resolved tie by tie with advance probabilities — same-group teams kept apart until the semis." },
  { icon: "mom", color: "var(--cyan)", bg: "rgba(25,211,227,.12)", t: "Explainable Reads", d: "Each projection traces back to transparent inputs — never a number without a reason, never a guaranteed result." },
];

/** Short stage labels for the knockout board rows. */
const STAGE_LABEL: Record<string, string> = {
  R32: "R32",
  R16: "R16",
  QF: "QF",
  SF: "SF",
  THIRD_PLACE: "3rd",
  FINAL: "Final",
};

const pct = (n: number) => Math.round(n * 100);

export default function Landing() {
  const { data } = useQuery({
    queryKey: ["tournament-bracket"],
    queryFn: api.tournamentBracket,
  });

  // The projected final and its finalists — the hero centrepiece.
  const final = useMemo(
    () => data?.rounds.find((r) => r.stage === "FINAL")?.ties[0],
    [data],
  );

  // All resolved knockout ties, ranked by how decisive the projection is.
  const topTies = useMemo(() => {
    if (!data) return [] as Array<{ t: BracketTie; round: string; conf: number }>;
    return data.rounds
      .flatMap((r) => r.ties.map((t) => ({ t, round: r.stage ?? r.name })))
      .filter(({ t }) => t.home && t.away)
      .map((x) => ({ ...x, conf: Math.max(x.t.homeAdvance, x.t.awayAdvance) }))
      .sort((a, b) => b.conf - a.conf)
      .slice(0, 6);
  }, [data]);

  // Headline counts — all derived from live bracket data, nothing hardcoded.
  const nations = data ? data.groups.reduce((n, g) => n + g.table.length, 0) : null;
  const groups = data ? data.groups.length : null;
  const qualifiers = data ? data.qualifiers.length : null;

  return (
    <>
      <nav className="lp-nav">
        <Link href="/" className="lp-brand">
          <div className="sb-logo"><Logo /></div>
          <b>Insight<span>XI</span></b>
        </Link>
        <div className="links">
          <Link href="/bracket">World Cup 2026</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/board">Confidence Board</Link>
          <Link href="/fixtures">Fixtures</Link>
          <Link href="/results">Results</Link>
          <Link href="/leagues">Leagues</Link>
        </div>
        <div className="flex aic gap-10" style={{ marginLeft: "auto" }}>
          <ThemeToggle />
          <Link href="/account" className="btn btn-sm btn-ghost">Sign in</Link>
          <Link href="/bracket" className="btn btn-sm btn-primary">View Bracket</Link>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <div className="glow-bg" />
        <div className="hero-grid">
          <div className="reveal">
            <div className="badge blue" style={{ marginBottom: 22, height: "auto", padding: "6px 12px", whiteSpace: "nowrap" }}>
              <span className="badge-dot" style={{ background: "var(--blue)" }} /> FIFA World Cup 2026 · Canada · Mexico · USA
            </div>
            <h1>
              The World Cup,
              <br />
              <span className="grad">Decoded by AI</span>
            </h1>
            <p className="sub">
              A transparent, probabilistic read of the 48-team tournament — group-stage projections,
              a full knockout bracket and explainable match intelligence for every tie. Projections,
              never guarantees.
            </p>
            <div className="flex gap-12 wrap">
              <Link href="/bracket" className="btn btn-lg btn-primary">View Projected Bracket</Link>
              <Link href="/dashboard" className="btn btn-lg btn-ghost"><Icon name="bolt" size={16} /> Explore Insights</Link>
              <Link href="/premium" className="btn btn-lg btn-gold">Upgrade Premium</Link>
            </div>
            <div className="flex gap-24 wrap" style={{ marginTop: 34 }}>
              <div><div className="mono" style={{ fontSize: 24, fontWeight: 800 }}>{nations ?? "—"}</div><div className="stat-lab">nations modelled</div></div>
              <div><div className="mono" style={{ fontSize: 24, fontWeight: 800, color: "var(--blue-2)" }}>{groups ?? "—"}</div><div className="stat-lab">groups</div></div>
              <div><div className="mono" style={{ fontSize: 24, fontWeight: 800, color: "var(--green)" }}>{qualifiers ?? "—"}</div><div className="stat-lab">knockout qualifiers</div></div>
            </div>
          </div>

          {/* Hero — projected final */}
          <div className="reveal float" style={{ position: "relative" }}>
            <div className="card glass" style={{ padding: 20, boxShadow: "var(--shadow-3)" }}>
              {final && final.home && final.away ? (
                <>
                  <div className="flex jcb aic" style={{ marginBottom: 16 }}>
                    <span className="dim" style={{ fontSize: 11 }}>Projected final · Jul 19</span>
                    {data?.champion && (
                      <span className="badge gold" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <Icon name="trophy" size={12} /> {data.champion.shortName}
                      </span>
                    )}
                  </div>
                  <div className="flex jcb aic" style={{ marginBottom: 18 }}>
                    <div className="flex aic gap-10">
                      <Crest name={final.home.name} seed={final.home.teamId} size="md" />
                      <div style={{ fontWeight: 700 }}>{final.home.shortName}</div>
                    </div>
                    <div className="mono" style={{ fontSize: 26, fontWeight: 800 }}>
                      {final.expectedGoals.home.toFixed(1)}–{final.expectedGoals.away.toFixed(1)}
                    </div>
                    <div className="flex aic gap-10">
                      <div style={{ fontWeight: 700 }}>{final.away.shortName}</div>
                      <Crest name={final.away.name} seed={final.away.teamId} size="md" />
                    </div>
                  </div>
                  <div className="flex gap-16 aic" style={{ padding: 14, background: "var(--surface-1)", borderRadius: 14, border: "1px solid var(--line)" }}>
                    <ChartBox
                      style={{ width: 96, flexShrink: 0 }}
                      deps={[final.id]}
                      draw={(el) =>
                        IX.ring(el, Math.round(Math.max(final.homeAdvance, final.awayAdvance) * 100), {
                          size: 96,
                          color: IX.C.blue,
                          label: "lift trophy",
                        })
                      }
                    />
                    <div style={{ flex: 1 }}>
                      <div className="label-xs" style={{ marginBottom: 8 }}>Win probability</div>
                      <ChartBox
                        deps={[final.id]}
                        draw={(el) =>
                          IX.bars(
                            el,
                            [
                              { label: final.home!.shortName, v: pct(final.homeAdvance), disp: `${pct(final.homeAdvance)}%`, color: "linear-gradient(90deg,var(--blue),var(--blue-2))" },
                              { label: final.away!.shortName, v: pct(final.awayAdvance), disp: `${pct(final.awayAdvance)}%`, color: "linear-gradient(90deg,var(--green),var(--green-2))" },
                            ],
                            { horiz: true, labelW: 46, valW: 38, max: 100 },
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="flex aic gap-8" style={{ marginTop: 12, padding: 11, borderRadius: 11, background: "rgba(46,125,255,.06)", border: "1px solid rgba(46,125,255,.18)" }}>
                    <span className="xai-ic" style={{ width: 26, height: 26 }}><Icon name="bolt" size={13} /></span>
                    <span style={{ fontSize: 12, color: "var(--text-2)" }}>
                      Projection only — a probabilistic read of how the tournament could unfold, not a guaranteed result.
                    </span>
                  </div>
                </>
              ) : (
                <div className="empty"><p>World Cup intelligence loads when the services are reachable.</p></div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* KNOCKOUT BOARD */}
      <section className="sect" style={{ paddingTop: 26 }}>
        <div className="flex jcb aic wrap gap-16" style={{ marginBottom: 24 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Projected knockout stage</div>
            <h2 style={{ fontSize: 32, letterSpacing: "-.03em" }}>Highest-confidence ties</h2>
          </div>
          <Link href="/bracket" className="btn btn-sm btn-ghost">Open full bracket →</Link>
        </div>
        <div className="card">
          <div className="card-bd" style={{ paddingTop: 4 }}>
            {topTies.map(({ t, round, conf }) => (
              <Link key={t.id} href={`/matches/${t.id}`} className="board-row" style={{ color: "inherit" }}>
                <span className="badge" style={{ width: 44, justifyContent: "center", fontSize: 10, flexShrink: 0 }}>
                  {STAGE_LABEL[round] ?? round}
                </span>
                <div className="flex aic gap-7" style={{ flex: 1, justifyContent: "flex-end", fontSize: 13, fontWeight: 600 }}>
                  {t.home!.shortName} <Crest name={t.home!.name} seed={t.home!.teamId} size="xs" />
                </div>
                <span className="dim">vs</span>
                <div className="flex aic gap-7" style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>
                  <Crest name={t.away!.name} seed={t.away!.teamId} size="xs" /> {t.away!.shortName}
                </div>
                <span className="mono" style={{ width: 40, textAlign: "right", color: confColor(pct(conf)) }}>
                  {pct(conf)}%
                </span>
              </Link>
            ))}
            {topTies.length === 0 && <div className="empty"><p>Projections appear when the API service is reachable.</p></div>}
          </div>
        </div>
      </section>

      {/* INTELLIGENCE FEATURES */}
      <section className="sect">
        <div className="sect-head">
          <div className="eyebrow" style={{ justifyContent: "center", display: "flex", marginBottom: 10 }}>01 — Intelligence first</div>
          <h2>World Cup Intelligence</h2>
          <p>Every group, every tie, decoded. Expected points, knockout paths and explainable reads — surfaced the moment they matter.</p>
        </div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          {FEATURES.map((f) => (
            <div className="feat-card reveal" key={f.t}>
              <div className="feat-ic" style={{ background: f.bg, color: f.color }}><Icon name={f.icon} size={22} /></div>
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PREMIUM CTA */}
      <section className="sect" style={{ paddingTop: 0 }}>
        <div
          className="card reveal premium-cta"
          style={{
            padding: 46,
            textAlign: "center",
            background:
              "radial-gradient(600px 300px at 50% 0%, rgba(232,194,112,.10), transparent 65%), linear-gradient(180deg,var(--surface-1),var(--card-grad-2))",
            borderColor: "rgba(232,194,112,.2)",
          }}
        >
          <div className="badge gold" style={{ marginBottom: 18, height: 28, padding: "0 12px" }}>Premium Intelligence</div>
          <h2 style={{ fontSize: 38, maxWidth: 640, margin: "0 auto 14px" }}>Go deeper on every World Cup tie</h2>
          <p className="muted" style={{ fontSize: 16, maxWidth: 560, margin: "0 auto 26px" }}>
            Tactical AI reports, correct-score modelling, lineup-impact and hidden-trend detection — the analytical layer for people who read the game deeper.
          </p>
          <div className="flex gap-12 jcc wrap">
            <Link href="/premium" className="btn btn-lg btn-gold">Upgrade Premium</Link>
            <Link href="/bracket" className="btn btn-lg btn-ghost">View Bracket</Link>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--line)", padding: "34px 38px", maxWidth: 1320, margin: "0 auto" }}>
        <div className="flex jcb aic wrap gap-16">
          <div className="lp-brand"><div className="sb-logo"><Logo /></div><b>Insight<span>XI</span></b></div>
          <div className="muted" style={{ fontSize: 13 }}>True Football Intelligence Platform · For analytical use only — not a betting service.</div>
          <div className="flex gap-16" style={{ fontSize: 13, color: "var(--muted)" }}>
            <Link href="/bracket">World Cup</Link>
            <Link href="/dashboard">Platform</Link>
            <Link href="/premium">Premium</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
