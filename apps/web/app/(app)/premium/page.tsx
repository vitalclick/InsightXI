"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api-client";
import { useAuthStore } from "../../../store/auth-store";
import { PageHead } from "../../../components/ui/page-head";
import { PlanCard } from "../../../components/billing/plan-card";
import { Crest } from "../../../components/ui/crest";
import { Icon } from "../../../components/ui/icon";
import { usePredictions, confColor } from "../../../hooks/use-predictions";
import { ScoreMatrix } from "../../../components/match/score-matrix";
import { clubCode } from "../../../lib/club";
import type { AuthResponse, MatchPrediction, MatchView } from "../../../lib/types";

export default function PremiumPage() {
  const { user, token, setAuth } = useAuthStore();
  const isPremium = user?.tier === "PREMIUM";

  function onActivated(auth: AuthResponse) {
    setAuth(auth.accessToken, auth.user, auth.refreshToken);
  }

  const { data: fixtures = [] } = useQuery({ queryKey: ["fixtures", ""], queryFn: () => api.fixtures() });
  const preds = usePredictions(fixtures.map((m) => m.id));

  const elite = useMemo(
    () =>
      fixtures
        .map((m) => ({ m, p: preds[m.id] }))
        .filter((x): x is { m: MatchView; p: MatchPrediction } => Boolean(x.p))
        .sort((a, b) => b.p.topSelection.probability - a.p.topSelection.probability)
        .slice(0, 3),
    [fixtures, preds],
  );

  const featured = elite[0];
  const { data: tactical } = useQuery({
    queryKey: ["tactical", featured?.m.id],
    queryFn: () => api.tactical(featured!.m.id),
    enabled: Boolean(featured),
    retry: 0,
  });

  return (
    <>
      <PageHead eyebrow="Premium Intelligence" title="The elite analytics layer" />

      <section className="card reveal premium-cta" style={{ overflow: "hidden", marginBottom: 18, borderColor: "rgba(232,194,112,.22)" }}>
        <div style={{ padding: "28px 32px" }}>
          <div className="flex jcb aic wrap gap-16">
            <div>
              <div className="badge gold" style={{ marginBottom: 14, height: 26, padding: "0 12px" }}>⭐ Premium Intelligence</div>
              <h1 style={{ fontSize: 30, letterSpacing: "-.03em" }}>Deepest read on any fixture</h1>
              <div className="muted" style={{ fontSize: 14, marginTop: 8, maxWidth: 520 }}>
                Tactical AI reports, correct-score modelling, lineup-impact and hidden-trend detection.
              </div>
              {!isPremium && (
                <a href="#upgrade" className="btn btn-gold" style={{ marginTop: 16 }}>
                  Upgrade to Premium
                </a>
              )}
              {isPremium && (
                <span className="badge green" style={{ marginTop: 16, display: "inline-flex" }}>
                  <span className="badge-dot" /> Premium active
                </span>
              )}
            </div>
            <div className="flex gap-24">
              <div className="center"><div className="mono" style={{ fontSize: 28, fontWeight: 800, color: "var(--gold)" }}>{elite[0] ? Math.round(elite[0].p.topSelection.probability * 100) : "—"}%</div><div className="stat-lab">top read</div></div>
              <div className="center"><div className="mono" style={{ fontSize: 28, fontWeight: 800, color: "var(--green)" }}>{elite.length}</div><div className="stat-lab">elite spots</div></div>
              <div className="center"><div className="mono" style={{ fontSize: 28, fontWeight: 800, color: "var(--blue-2)" }}>6</div><div className="stat-lab">sub-models</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Plan + checkout (PayPal / Paystack / Flutterwave, localized currency) */}
      <div
        id="upgrade"
        className="grid"
        style={{ gridTemplateColumns: "minmax(0,460px) 1fr", alignItems: "start", gap: 18, marginBottom: 18, scrollMarginTop: 80 }}
      >
        <PlanCard
          token={token}
          isPremium={isPremium}
          currentPeriodEnd={user?.currentPeriodEnd}
          onActivated={onActivated}
        />
        <section className="card reveal">
          <div className="card-hd"><h3>Everything in Premium</h3><span className="badge gold">30 days access</span></div>
          <div className="card-bd">
            {[
              "Elite confidence insights & probability rings",
              "Tactical AI reports and matchup edge",
              "Correct-score modelling & expected-goals matrix",
              "Hidden-trend detection and season trends",
              "Probability-ranked selections across value and long-shot reads",
              "High-confidence picks refreshed daily",
            ].map((c) => (
              <div className="xai-row" key={c}>
                <span className="xai-ic"><Icon name="check" size={15} /></span>
                <span className="xai-txt" style={{ fontSize: 13.5 }}>{c}</span>
              </div>
            ))}
            <p className="dim" style={{ fontSize: 11.5, marginTop: 12 }}>
              Every InsightXI bet is ranked by our AI model and backed by a real,
              settled win rate. 18+, bet responsibly.
            </p>
          </div>
        </section>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1.3fr", alignItems: "start", marginBottom: 18 }}>
        {/* Elite confidence */}
        <section className="card reveal" style={{ borderColor: "rgba(232,194,112,.22)" }}>
          <div className="card-hd"><h3><span className="ic" style={{ color: "var(--gold)" }}><Icon name="premium" size={16} /></span> Elite Confidence Insights</h3><span className="badge gold">Top {elite.length}</span></div>
          <div className="card-bd">
            {elite.length === 0 && <div className="empty"><p>Predictions load when the AI service is reachable.</p></div>}
            {elite.map(({ m, p }, i) => {
              const conf = Math.round(p.topSelection.probability * 100);
              return (
                <Link key={m.id} href={`/matches/${m.id}`} className="flex aic gap-12" style={{ padding: "11px 0", borderBottom: i < elite.length - 1 ? "1px solid var(--line)" : "none", color: "inherit" }}>
                  <div className="mono" style={{ fontSize: 18, fontWeight: 800, color: confColor(conf), width: 44 }}>{conf}%</div>
                  <div style={{ flex: 1 }}>
                    <div className="flex aic gap-7" style={{ fontSize: 13, fontWeight: 600 }}>
                      <Crest name={m.homeTeamName} seed={m.homeTeamId} size="xs" />
                      {clubCode(m.homeTeamName)}
                      <span className="dim">v</span>
                      <Crest name={m.awayTeamName} seed={m.awayTeamId} size="xs" />
                      {clubCode(m.awayTeamName)}
                    </div>
                    <div className="dim" style={{ fontSize: 11, marginTop: 3 }}>{p.confidenceLevel} · {p.topSelection.label}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Tactical AI report */}
        <section className="card reveal">
          <div className="card-hd"><h3><span className="ic"><Icon name="bolt" size={16} /></span> Tactical AI Report</h3>{featured && <span className="badge violet">{clubCode(featured.m.homeTeamName)} v {clubCode(featured.m.awayTeamName)}</span>}</div>
          <div className="card-bd">
            {tactical ? (
              <>
                <div className="flex gap-12 wrap" style={{ marginBottom: 14 }}>
                  <span className="badge blue">{tactical.home.name} · {tactical.home.formation}</span>
                  <span className="badge green">{tactical.away.name} · {tactical.away.formation}</span>
                  <span className="badge">Edge {tactical.tacticalEdge > 0 ? "+" : ""}{tactical.tacticalEdge}</span>
                </div>
                {tactical.insights.map((t, i) => (
                  <div className="xai-row" key={i}><span className="xai-ic"><Icon name="check" size={15} /></span><span className="xai-txt">{t}</span></div>
                ))}
              </>
            ) : (
              <div className="empty"><p>Select a fixture with model coverage to generate a tactical report.</p></div>
            )}
          </div>
        </section>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1.1fr", alignItems: "start" }}>
        {/* Correct score matrix */}
        <section className="card reveal">
          <div className="card-hd"><h3>Advanced Probability</h3><span className="badge">correct-score matrix</span></div>
          <div className="card-bd">
            {featured ? (
              <ScoreMatrix
                homeCode={clubCode(featured.m.homeTeamName)}
                awayCode={clubCode(featured.m.awayTeamName)}
                lambdaHome={featured.p.expectedGoals.home}
                lambdaAway={featured.p.expectedGoals.away}
              />
            ) : (
              <div className="empty"><p>Awaiting a featured fixture with expected-goals output.</p></div>
            )}
          </div>
        </section>

        {/* Hidden trends */}
        <section className="card reveal" style={{ borderColor: "rgba(232,194,112,.22)" }}>
          <div className="card-hd"><h3><span className="ic" style={{ color: "var(--violet)" }}><Icon name="bolt" size={16} /></span> Hidden Trend Detection</h3><span className="badge violet">anomalies</span></div>
          <div className="card-bd">
            {[
              { t: "xG vs result divergence", d: "Several sides are out-creating their points return — the model flags positive regression candidates.", cls: "blue" },
              { t: "Set-piece dependency", d: "Detects clubs whose goal output leans heavily on dead-ball situations, a fragile signal under pressure.", cls: "amber" },
              { t: "Second-half collapse risk", d: "Highlights teams whose win-probability decays sharply after 60' across recent matches.", cls: "red" },
            ].map((c) => (
              <div className="xai-row" key={c.t}>
                <span className={`xai-ic neu`}><Icon name="up" size={15} /></span>
                <div className="xai-txt">
                  <b>{c.t}</b>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{c.d}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
