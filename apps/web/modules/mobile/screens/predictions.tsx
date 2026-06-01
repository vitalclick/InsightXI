"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as IX from "../../../lib/ix-charts";
import { api } from "../../../services/api-client";
import { clubCode } from "../../../lib/club";
import { availableMarkets, boardViews, type BoardEntry } from "../../../lib/board";
import { usePredictions } from "../../../hooks/use-predictions";
import { Chart } from "../chart";
import { useMobileNav } from "../nav-context";
import { Crest } from "../ui";
import { Icon } from "../icons";
import { pickClass } from "../view";

export function PredictionsScreen() {
  const nav = useMobileNav();
  const [market, setMarket] = useState<string | null>(null);
  const { data: fixtures = [] } = useQuery({ queryKey: ["fixtures", ""], queryFn: () => api.fixtures() });

  const slate = useMemo(() => fixtures.slice(0, 12), [fixtures]);
  const preds = usePredictions(slate.map((m) => m.id));
  const entries: BoardEntry[] = useMemo(() => slate.map((m) => ({ m, p: preds[m.id] })), [slate, preds]);

  const markets = useMemo(() => availableMarkets(entries), [entries]);
  const views = useMemo(() => boardViews(entries, { minConfidence: 0, market }), [entries, market]);

  const banker = views[0];
  const bankerMatch = banker?.m;
  const bankerPred = banker?.p;
  const bankerConf = banker ? Math.round(banker.prob * 100) : 0;

  return (
    <>
      <div className="lg-head">
        <div className="lg-eyebrow">Highest-conviction picks</div>
        <div className="lg-title">Sure Win</div>
        <div className="lg-sub">
          The model&apos;s strongest reads of the day — each fully explained, never a number without a reason.
        </div>
      </div>

      <div className="seg-row" style={{ marginTop: 14 }}>
        <button className={`seg${market === null ? " active" : ""}`} onClick={() => setMarket(null)}>
          Top pick
        </button>
        {markets.map((m) => (
          <button key={m.key} className={`seg${market === m.key ? " active" : ""}`} onClick={() => setMarket(m.key)}>
            {m.label}
          </button>
        ))}
      </div>

      {banker && bankerMatch && bankerPred ? (
        <div className="block">
          <div
            className="m-card pad"
            style={{
              borderColor: "rgba(39,224,138,.24)",
              background:
                "radial-gradient(420px 240px at 12% 0%,rgba(39,224,138,.12),transparent 62%),linear-gradient(180deg,var(--surface-1),var(--card-grad-2))",
            }}
          >
            <div className="flex aic gap-8" style={{ marginBottom: 13 }}>
              <span className="badge green">★ Top conviction</span>
              <span className="badge blue">{banker.label}</span>
            </div>
            <div className="flex aic gap-14">
              <div className="grow">
                <div className="flex aic gap-11" style={{ marginBottom: 12 }}>
                  <Crest name={bankerMatch.homeTeamName} seed={bankerMatch.homeTeamId} size="md" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{bankerMatch.homeTeamName}</div>
                    <div className="dim" style={{ fontSize: 11.5 }}>
                      v {bankerMatch.awayTeamName}
                    </div>
                  </div>
                </div>
                <div className="label-xs" style={{ fontSize: 10, marginBottom: 4 }}>
                  Model pick
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.15 }}>
                  {bankerPred.topSelection.label}{" "}
                  <span className="dim" style={{ fontWeight: 600, fontSize: 13 }}>
                    · exp {bankerPred.expectedGoals.home.toFixed(1)}–{bankerPred.expectedGoals.away.toFixed(1)}
                  </span>
                </div>
              </div>
              <div style={{ width: 104, flexShrink: 0, textAlign: "center" }}>
                <Chart signature={bankerConf} render={(el) => IX.gauge(el, bankerConf, { size: 104, stroke: 11, label: "confidence" })} />
                <div className="badge green" style={{ marginTop: 2 }}>
                  {bankerPred.confidenceLevel}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 14, paddingTop: 6, borderTop: "1px solid var(--line)" }}>
              {bankerPred.explanations.slice(0, 3).map((t, i) => (
                <div className="xai" key={i}>
                  <span className="ic neu">AI</span>
                  <span className="bd">{t}</span>
                </div>
              ))}
            </div>
            <button
              className="btn btn-green tappable"
              style={{ width: "100%", marginTop: 14 }}
              onClick={() => nav.pushScreen("match", bankerMatch)}
            >
              Full match intel →
            </button>
          </div>
        </div>
      ) : (
        <div className="block">
          <div className="m-card pad dim" style={{ fontSize: 13 }}>
            Predictions appear once the AI service is reachable.
          </div>
        </div>
      )}

      <div className="list-sec">
        <Icon name="flame" /> High-Confidence Board
        <span className="badge" style={{ marginLeft: "auto" }}>
          {views.length} picks
        </span>
      </div>
      <div className="block" style={{ paddingTop: 4 }}>
        <div className="flex col gap-12">
          {views.map(({ m, prob, label, pick }) => {
            const conf = Math.round(prob * 100);
            return (
              <div className="m-card pad tappable" key={m.id} onClick={() => nav.pushScreen("match", m)}>
                <div className="flex aic gap-12">
                  <div style={{ width: 62, flexShrink: 0 }}>
                    <Chart
                      signature={conf}
                      render={(el) =>
                        IX.ring(el, conf, {
                          size: 62,
                          stroke: 7,
                          color: conf >= 70 ? IX.C.green : conf >= 60 ? IX.C.blue : IX.C.gold,
                          glow: false,
                        })
                      }
                    />
                  </div>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="flex aic gap-7" style={{ fontWeight: 700, fontSize: 14, marginBottom: 5 }}>
                      <Crest name={m.homeTeamName} seed={m.homeTeamId} size="xs" />
                      {clubCode(m.homeTeamName)}{" "}
                      <span className="dim" style={{ fontWeight: 400, fontSize: 12 }}>
                        v
                      </span>{" "}
                      {clubCode(m.awayTeamName)}
                      <Crest name={m.awayTeamName} seed={m.awayTeamId} size="xs" />
                    </div>
                    <div className="dim" style={{ fontSize: 11 }}>
                      {new Date(m.utcDate).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}
                    </div>
                    <div className="flex aic gap-7" style={{ marginTop: 9 }}>
                      <span className="badge blue">Pick · {label}</span>
                      <span className={`pickb ${pickClass(pick)}`} style={{ width: 24, height: 24, fontSize: 11 }}>
                        {pick}
                      </span>
                    </div>
                  </div>
                  <span className="dim" style={{ flexShrink: 0 }}>
                    <Icon name="chev" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="block">
        <div className="m-card pad flex aic gap-11" style={{ background: "var(--surface-1)" }}>
          <span style={{ color: "var(--blue-2)", flexShrink: 0 }}>
            <Icon name="info" />
          </span>
          <span className="muted" style={{ fontSize: 11.5, lineHeight: 1.45 }}>
            Predictions reflect <b style={{ color: "var(--text-2)" }}>model confidence</b>, not guaranteed outcomes.
            For analytical use only — not a betting service.
          </span>
        </div>
      </div>
    </>
  );
}
