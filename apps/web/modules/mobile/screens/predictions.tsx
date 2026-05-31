"use client";

import { useState } from "react";
import * as IX from "../../../lib/ix-charts";
import { CLUBS, FEATURE_MATCH, UPCOMING } from "../data";
import { Chart } from "../chart";
import { useMobileNav } from "../nav-context";
import { Crest } from "../ui";
import { Icon } from "../icons";

const MARKETS: [string, string][] = [
  ["all", "All markets"],
  ["1x2", "Result"],
  ["ou", "Over / Under"],
  ["btts", "BTTS"],
];

const REASONS = [
  { ic: "pos", t: "Home xG differential <b>+1.22</b> over last 6 — league best.", w: "+18", wc: "var(--green-2)" },
  { ic: "pos", t: "Kingsgate concede <b>1.6 xGA</b> away vs top-6 sides.", w: "+11", wc: "var(--green-2)" },
  { ic: "neu", t: "Six sub-models agree on a home win (<b>5 of 6</b>).", w: "AI", wc: "var(--blue-2)" },
];

export function PredictionsScreen() {
  const nav = useMobileNav();
  const [market, setMarket] = useState("all");
  const picks = [...UPCOMING].sort((a, b) => b.conf - a.conf);

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
        {MARKETS.map((m) => (
          <button key={m[0]} className={`seg${market === m[0] ? " active" : ""}`} onClick={() => setMarket(m[0])}>
            {m[1]}
          </button>
        ))}
      </div>

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
            <span className="badge green">★ Banker of the Day</span>
            <span className="badge blue">Match result</span>
          </div>
          <div className="flex aic gap-14">
            <div className="grow">
              <div className="flex aic gap-11" style={{ marginBottom: 12 }}>
                <Crest code="RVS" size="md" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Riverside FC</div>
                  <div className="dim" style={{ fontSize: 11.5 }}>
                    v Kingsgate · 17:30
                  </div>
                </div>
              </div>
              <div className="label-xs" style={{ fontSize: 10, marginBottom: 4 }}>
                Model pick
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.15 }}>
                Riverside to win{" "}
                <span className="dim" style={{ fontWeight: 600, fontSize: 13 }}>
                  · exp 2–1
                </span>
              </div>
            </div>
            <div style={{ width: 104, flexShrink: 0, textAlign: "center" }}>
              <Chart render={(el) => IX.gauge(el, 74, { size: 104, stroke: 11, label: "confidence" })} />
              <div className="badge green" style={{ marginTop: 2 }}>
                Elite
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14, paddingTop: 6, borderTop: "1px solid var(--line)" }}>
            {REASONS.map((r, i) => (
              <div className="xai" key={i}>
                <span className={`ic ${r.ic}`}>{r.ic === "pos" ? "↑" : "AI"}</span>
                <span className="bd" dangerouslySetInnerHTML={{ __html: r.t }} />
                <span className="w" style={{ color: r.wc }}>
                  {r.w}
                </span>
              </div>
            ))}
          </div>
          <button
            className="btn btn-green tappable"
            style={{ width: "100%", marginTop: 14 }}
            onClick={() => nav.pushScreen("match", FEATURE_MATCH)}
          >
            Full match intel →
          </button>
        </div>
      </div>

      <div className="list-sec">
        <Icon name="flame" /> High-Confidence Board
        <span className="badge" style={{ marginLeft: "auto" }}>
          {picks.length} picks
        </span>
      </div>
      <div className="block" style={{ paddingTop: 4 }}>
        <div className="flex col gap-12">
          {picks.map((m) => (
            <div className="m-card pad tappable" key={m.id} onClick={() => nav.pushScreen("match", m)}>
              <div className="flex aic gap-12">
                <div style={{ width: 62, flexShrink: 0 }}>
                  <Chart
                    render={(el) =>
                      IX.ring(el, m.conf, {
                        size: 62,
                        stroke: 7,
                        color: m.conf >= 70 ? IX.C.green : m.conf >= 60 ? IX.C.blue : IX.C.gold,
                        glow: false,
                      })
                    }
                  />
                </div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="flex aic gap-7" style={{ fontWeight: 700, fontSize: 14, marginBottom: 5 }}>
                    <Crest code={m.home} size="xs" />
                    {CLUBS[m.home].short}{" "}
                    <span className="dim" style={{ fontWeight: 400, fontSize: 12 }}>
                      v
                    </span>{" "}
                    {CLUBS[m.away].short}
                    <Crest code={m.away} size="xs" />
                  </div>
                  <div className="dim" style={{ fontSize: 11 }}>
                    {m.comp} · {m.date} {m.time}
                  </div>
                  <div className="flex aic gap-7" style={{ marginTop: 9 }}>
                    <span className="badge blue">Pick · {m.pick}</span>
                    <span className={`badge${m.conf >= 70 ? " green" : ""}`} style={{ fontSize: 10 }}>
                      {m.conf >= 70 ? "High" : "Medium"} conf
                    </span>
                  </div>
                </div>
                <span className="dim" style={{ flexShrink: 0 }}>
                  <Icon name="chev" />
                </span>
              </div>
            </div>
          ))}
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
