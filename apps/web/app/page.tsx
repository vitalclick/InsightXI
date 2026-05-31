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
import { usePredictions, confColor } from "../hooks/use-predictions";
import { clubCode } from "../lib/club";
import type { MatchPrediction, MatchView } from "../lib/types";
import * as IX from "../lib/ix-charts";

const FEATURES = [
  { icon: "target", color: "var(--blue-2)", bg: "rgba(46,125,255,.12)", t: "Top Match Picks", d: "The model surfaces the day's highest-confidence reads with full factor breakdowns — never a number without a reason." },
  { icon: "check", color: "var(--green-2)", bg: "rgba(39,224,138,.12)", t: "Confidence Levels", d: "Sub-models vote on every outcome. Agreement becomes a calibrated confidence score you can actually trust." },
  { icon: "mom", color: "var(--cyan)", bg: "rgba(25,211,227,.12)", t: "Momentum Indicators", d: "Live momentum tracks who's winning the game beyond the scoreline — pressure, territory and the xG race." },
];

export default function Landing() {
  const { data: fixtures = [] } = useQuery({ queryKey: ["fixtures", ""], queryFn: () => api.fixtures() });
  const preds = usePredictions(fixtures.map((m) => m.id));

  const ranked = useMemo(
    () =>
      fixtures
        .map((m) => ({ m, p: preds[m.id] }))
        .filter((x): x is { m: MatchView; p: MatchPrediction } => Boolean(x.p))
        .sort((a, b) => b.p.topSelection.probability - a.p.topSelection.probability),
    [fixtures, preds],
  );
  const motd = ranked[0];

  return (
    <>
      <nav className="lp-nav">
        <Link href="/" className="lp-brand">
          <div className="sb-logo"><Logo /></div>
          <b>Insight<span>XI</span></b>
        </Link>
        <div className="links">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/board">Confidence Board</Link>
          <Link href="/predictions">Confidence Picks</Link>
          <Link href="/fixtures">Fixtures</Link>
          <Link href="/results">Results</Link>
          <Link href="/leagues">Leagues</Link>
        </div>
        <div className="flex aic gap-10" style={{ marginLeft: "auto" }}>
          <ThemeToggle />
          <Link href="/account" className="btn btn-sm btn-ghost">Sign in</Link>
          <Link href="/dashboard" className="btn btn-sm btn-primary">Launch Platform</Link>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <div className="glow-bg" />
        <div className="hero-grid">
          <div className="reveal">
            <div className="badge blue" style={{ marginBottom: 22, height: "auto", padding: "6px 12px", whiteSpace: "nowrap" }}>
              <span className="badge-dot" style={{ background: "var(--blue)" }} /> True Football Intelligence Platform
            </div>
            <h1>
              Football Intelligence
              <br />
              <span className="grad">Beyond Predictions</span>
            </h1>
            <p className="sub">
              AI-powered football analytics, tactical insights, historical trends and real-time match intelligence —
              engineered for people who read the game deeper.
            </p>
            <div className="flex gap-12 wrap">
              <Link href="/dashboard" className="btn btn-lg btn-primary">Explore Insights</Link>
              <Link href="/live" className="btn btn-lg btn-ghost"><Icon name="live" size={16} /> View Live Matches</Link>
              <Link href="/premium" className="btn btn-lg btn-gold">Upgrade Premium</Link>
            </div>
            <div className="flex gap-24 wrap" style={{ marginTop: 34 }}>
              <div><div className="mono" style={{ fontSize: 24, fontWeight: 800 }}>{fixtures.length}</div><div className="stat-lab">fixtures modelled</div></div>
              <div><div className="mono" style={{ fontSize: 24, fontWeight: 800, color: "var(--green)" }}>73%</div><div className="stat-lab">model accuracy</div></div>
              <div><div className="mono" style={{ fontSize: 24, fontWeight: 800, color: "var(--blue-2)" }}>6</div><div className="stat-lab">sub-models</div></div>
            </div>
          </div>

          {/* Hero product mock */}
          <div className="reveal float" style={{ position: "relative" }}>
            <div className="card glass" style={{ padding: 20, boxShadow: "var(--shadow-3)" }}>
              {motd ? (
                <>
                  <div className="flex jcb aic" style={{ marginBottom: 16 }}>
                    <span className="dim" style={{ fontSize: 11 }}>Featured fixture</span>
                    <span className="badge blue">AI {Math.round(motd.p.topSelection.probability * 100)}%</span>
                  </div>
                  <div className="flex jcb aic" style={{ marginBottom: 18 }}>
                    <div className="flex aic gap-10">
                      <Crest name={motd.m.homeTeamName} seed={motd.m.homeTeamId} size="md" />
                      <div style={{ fontWeight: 700 }}>{clubCode(motd.m.homeTeamName)}</div>
                    </div>
                    <div className="mono" style={{ fontSize: 26, fontWeight: 800 }}>
                      {motd.p.expectedGoals.home.toFixed(1)}–{motd.p.expectedGoals.away.toFixed(1)}
                    </div>
                    <div className="flex aic gap-10">
                      <div style={{ fontWeight: 700 }}>{clubCode(motd.m.awayTeamName)}</div>
                      <Crest name={motd.m.awayTeamName} seed={motd.m.awayTeamId} size="md" />
                    </div>
                  </div>
                  <div className="flex gap-16 aic" style={{ padding: 14, background: "var(--surface-1)", borderRadius: 14, border: "1px solid var(--line)" }}>
                    <ChartBox style={{ width: 96, flexShrink: 0 }} deps={[motd.m.id]} draw={(el) => IX.ring(el, Math.round(motd.p.topSelection.probability * 100), { size: 96, color: IX.C.blue, label: "conf" })} />
                    <div style={{ flex: 1 }}>
                      <div className="label-xs" style={{ marginBottom: 8 }}>Win probability</div>
                      <ChartBox
                        deps={[motd.m.id]}
                        draw={(el) =>
                          IX.bars(
                            el,
                            [
                              { label: clubCode(motd.m.homeTeamName), v: Math.round(motd.p.outcome.homeWin * 100), disp: `${Math.round(motd.p.outcome.homeWin * 100)}%`, color: "linear-gradient(90deg,var(--blue),var(--blue-2))" },
                              { label: "Draw", v: Math.round(motd.p.outcome.draw * 100), disp: `${Math.round(motd.p.outcome.draw * 100)}%`, color: "linear-gradient(90deg,#54607a,#6b7689)" },
                              { label: clubCode(motd.m.awayTeamName), v: Math.round(motd.p.outcome.awayWin * 100), disp: `${Math.round(motd.p.outcome.awayWin * 100)}%`, color: "linear-gradient(90deg,var(--green),var(--green-2))" },
                            ],
                            { horiz: true, labelW: 46, valW: 38, max: 100 },
                          )
                        }
                      />
                    </div>
                  </div>
                  {motd.p.explanations[0] && (
                    <div className="flex aic gap-8" style={{ marginTop: 12, padding: 11, borderRadius: 11, background: "rgba(39,224,138,.06)", border: "1px solid rgba(39,224,138,.18)" }}>
                      <span className="xai-ic" style={{ width: 26, height: 26 }}><Icon name="up" size={13} /></span>
                      <span style={{ fontSize: 12, color: "var(--text-2)" }}>{motd.p.explanations[0]}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty"><p>Live intelligence loads when the services are reachable.</p></div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* TODAY'S BOARD */}
      <section className="sect" style={{ paddingTop: 26 }}>
        <div className="flex jcb aic wrap gap-16" style={{ marginBottom: 24 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Today&apos;s intelligence board</div>
            <h2 style={{ fontSize: 32, letterSpacing: "-.03em" }}>Confidence-ranked fixtures</h2>
          </div>
          <Link href="/board" className="btn btn-sm btn-ghost">Open full board →</Link>
        </div>
        <div className="card">
          <div className="card-bd" style={{ paddingTop: 4 }}>
            {ranked.slice(0, 6).map(({ m, p }) => (
              <Link key={m.id} href={`/matches/${m.id}`} className="board-row" style={{ color: "inherit" }}>
                <span className="mono dim" style={{ width: 50, fontSize: 12, flexShrink: 0 }}>
                  {new Date(m.utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <div className="flex aic gap-7" style={{ flex: 1, justifyContent: "flex-end", fontSize: 13, fontWeight: 600 }}>
                  {clubCode(m.homeTeamName)} <Crest name={m.homeTeamName} seed={m.homeTeamId} size="xs" />
                </div>
                <span className="dim">:</span>
                <div className="flex aic gap-7" style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>
                  <Crest name={m.awayTeamName} seed={m.awayTeamId} size="xs" /> {clubCode(m.awayTeamName)}
                </div>
                <span className="mono" style={{ width: 40, textAlign: "right", color: confColor(Math.round(p.topSelection.probability * 100)) }}>
                  {Math.round(p.topSelection.probability * 100)}%
                </span>
              </Link>
            ))}
            {ranked.length === 0 && <div className="empty"><p>Predictions appear when the AI service is reachable.</p></div>}
          </div>
        </div>
      </section>

      {/* INTELLIGENCE FEATURES */}
      <section className="sect">
        <div className="sect-head">
          <div className="eyebrow" style={{ justifyContent: "center", display: "flex", marginBottom: 10 }}>01 — Intelligence first</div>
          <h2>AI Match Intelligence</h2>
          <p>Every fixture, decoded. Confidence levels, tactical edges and momentum indicators — surfaced the moment they matter.</p>
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
          <h2 style={{ fontSize: 38, maxWidth: 640, margin: "0 auto 14px" }}>Unlock the elite analytics layer</h2>
          <p className="muted" style={{ fontSize: 16, maxWidth: 560, margin: "0 auto 26px" }}>
            Tactical AI reports, correct-score modelling, lineup-impact and hidden-trend detection — the tools the pros use.
          </p>
          <div className="flex gap-12 jcc wrap">
            <Link href="/premium" className="btn btn-lg btn-gold">Upgrade Premium</Link>
            <Link href="/dashboard" className="btn btn-lg btn-ghost">Open Dashboard</Link>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--line)", padding: "34px 38px", maxWidth: 1320, margin: "0 auto" }}>
        <div className="flex jcb aic wrap gap-16">
          <div className="lp-brand"><div className="sb-logo"><Logo /></div><b>Insight<span>XI</span></b></div>
          <div className="muted" style={{ fontSize: 13 }}>True Football Intelligence Platform · For analytical use only — not a betting service.</div>
          <div className="flex gap-16" style={{ fontSize: 13, color: "var(--muted)" }}>
            <Link href="/dashboard">Platform</Link>
            <Link href="/premium">Premium</Link>
            <Link href="/historical">Analytics</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
