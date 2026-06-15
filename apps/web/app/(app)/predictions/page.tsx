"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api-client";
import { PageHead } from "../../../components/ui/page-head";
import { Crest } from "../../../components/ui/crest";
import { ChartBox } from "../../../components/charts/chart-box";
import { usePredictions, confColor } from "../../../hooks/use-predictions";
import type { MatchPrediction, MatchView } from "../../../lib/types";
import * as IX from "../../../lib/ix-charts";

export default function PredictionsPage() {
  const { data: fixtures = [] } = useQuery({ queryKey: ["fixtures", ""], queryFn: () => api.fixtures() });
  const preds = usePredictions(fixtures.map((m) => m.id));

  const picks = useMemo(
    () =>
      fixtures
        .map((m) => ({ m, p: preds[m.id] }))
        .filter((x): x is { m: MatchView; p: MatchPrediction } => Boolean(x.p))
        .sort((a, b) => b.p.topSelection.probability - a.p.topSelection.probability)
        .slice(0, 9),
    [fixtures, preds],
  );

  return (
    <>
      <PageHead
        eyebrow="Today's Best Bets"
        title="Today's strongest bets"
        sub="The day's strongest bets, ranked by confidence — every bet shipped with the analysis behind it."
      />

      <div
        className="reveal"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          marginBottom: 18,
          borderRadius: 12,
          background: "rgba(46,125,255,.06)",
          border: "1px solid rgba(46,125,255,.18)",
          fontSize: 12.5,
          color: "var(--text-2)",
        }}
      >
        <span className="badge blue">Note</span>
        Every bet is ranked by our AI model and backed by a real, settled win rate — confident calls, with the reasoning in plain sight. 18+, bet responsibly.
      </div>

      {picks.length === 0 ? (
        <section className="card">
          <div className="card-bd empty">
            <h4>No bets available</h4>
            <p>Today&apos;s bets appear once the AI service returns predictions for upcoming fixtures.</p>
          </div>
        </section>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          {picks.map(({ m, p }) => {
            const conf = Math.round(p.topSelection.probability * 100);
            return (
              <Link key={m.id} href={`/matches/${m.id}`} className="card card-hover reveal" style={{ color: "inherit" }}>
                <div className="card-bd">
                  <div className="flex jcb aic" style={{ marginBottom: 14 }}>
                    <span className="badge">{m.season}</span>
                    <span className="badge blue" style={{ color: confColor(conf), borderColor: "var(--line)" }}>{p.confidenceLevel}</span>
                  </div>
                  <div className="flex aic gap-16" style={{ marginBottom: 14 }}>
                    <ChartBox style={{ width: 84, flexShrink: 0 }} deps={[conf]} draw={(el) => IX.ring(el, conf, { size: 84, color: confColor(conf) === "var(--green)" ? IX.C.green : IX.C.blue })} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex aic gap-8" style={{ marginBottom: 6 }}>
                        <Crest name={m.homeTeamName} seed={m.homeTeamId} size="xs" />
                        <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.homeTeamName}</span>
                      </div>
                      <div className="flex aic gap-8">
                        <Crest name={m.awayTeamName} seed={m.awayTeamId} size="xs" />
                        <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.awayTeamName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex jcb aic" style={{ paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                    <div>
                      <div className="label-xs">Model read</div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p.topSelection.label}</div>
                    </div>
                    <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
                      {new Date(m.utcDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
