"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api-client";
import { useAuthStore } from "../../../store/auth-store";
import { PageHead } from "../../../components/ui/page-head";
import { Crest } from "../../../components/ui/crest";
import { Icon } from "../../../components/ui/icon";
import { usePredictions, confColor } from "../../../hooks/use-predictions";
import { clubCode } from "../../../lib/club";
import type { MatchPrediction, MatchView } from "../../../lib/types";

function poisson(k: number, lambda: number): number {
  let f = 1;
  for (let i = 2; i <= k; i++) f *= i;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / f;
}

export default function PremiumPage() {
  const { user } = useAuthStore();
  const isPremium = user?.tier === "PREMIUM";

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

  // Correct-score matrix (0..4) from the featured match expected goals.
  const matrix = useMemo(() => {
    if (!featured) return null;
    const lh = featured.p.expectedGoals.home;
    const la = featured.p.expectedGoals.away;
    const cells: { h: number; a: number; prob: number }[] = [];
    let best = { h: 0, a: 0, prob: 0 };
    for (let h = 0; h <= 4; h++) {
      for (let a = 0; a <= 4; a++) {
        const prob = poisson(h, lh) * poisson(a, la);
        cells.push({ h, a, prob });
        if (prob > best.prob) best = { h, a, prob };
      }
    }
    const max = Math.max(...cells.map((c) => c.prob));
    return { cells, best, max, lh, la };
  }, [featured]);

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
                <Link href="/account" className="btn btn-gold" style={{ marginTop: 16 }}>
                  Upgrade Premium
                </Link>
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
            {matrix ? (
              <>
                <div className="flex gap-10">
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", padding: "4px 0", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dim)" }}>
                    {[0, 1, 2, 3, 4].map((h) => (
                      <span key={h}>{clubCode(featured!.m.homeTeamName)} {h}</span>
                    ))}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5 }}>
                      {matrix.cells.map((c) => {
                        const intensity = c.prob / matrix.max;
                        const isBest = c.h === matrix.best.h && c.a === matrix.best.a;
                        return (
                          <div
                            key={`${c.h}-${c.a}`}
                            title={`${c.h}-${c.a}: ${(c.prob * 100).toFixed(1)}%`}
                            style={{
                              aspectRatio: "1",
                              borderRadius: 7,
                              display: "grid",
                              placeItems: "center",
                              fontFamily: "var(--font-mono)",
                              fontSize: 11,
                              fontWeight: 600,
                              border: isBest ? "1px solid var(--blue)" : "1px solid var(--line)",
                              background: `rgba(46,125,255,${(intensity * 0.5).toFixed(2)})`,
                              color: intensity > 0.5 ? "#fff" : "var(--text-2)",
                            }}
                          >
                            {(c.prob * 100).toFixed(0)}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex jcb" style={{ marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dim)" }}>
                      <span>{clubCode(featured!.m.awayTeamName)} 0</span><span>1</span><span>2</span><span>3</span><span>4</span>
                    </div>
                  </div>
                </div>
                <div className="flex aic gap-8" style={{ marginTop: 14, fontSize: 11.5, color: "var(--muted)" }}>
                  <span className="dim">Most likely:</span>
                  <span className="badge blue">{matrix.best.h}-{matrix.best.a} · {(matrix.best.prob * 100).toFixed(1)}%</span>
                </div>
              </>
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
