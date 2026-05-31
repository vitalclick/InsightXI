"use client";

import * as IX from "../../../lib/ix-charts";
import { CLUBS, FEATURE_MATCH, NOW_LIVE, UPCOMING } from "../data";
import { Chart } from "../chart";
import { useMobileNav } from "../nav-context";
import { Crest, Meter, Tribar, confColor } from "../ui";
import { Icon } from "../icons";

interface Kpi {
  lab: string;
  val: string;
  delta: string;
  dc: string;
  sp: number[];
  col: keyof typeof IX.C;
}

const KPIS: Kpi[] = [
  { lab: "Matches Analyzed", val: "24", delta: "▲ 12%", dc: "var(--green)", sp: [12, 16, 14, 20, 18, 24, 22, 28], col: "blue" },
  { lab: "Model Accuracy", val: "73%", delta: "▲ 2.1pts", dc: "var(--green)", sp: [68, 70, 69, 72, 71, 73, 72, 73], col: "green" },
  { lab: "Avg Confidence", val: "64%", delta: "▲ Strong", dc: "var(--blue-2)", sp: [55, 58, 60, 59, 62, 64, 63, 64], col: "cyan" },
  { lab: "Live Now", val: "3", delta: "3 high-intensity", dc: "var(--muted)", sp: [1, 2, 1, 3, 2, 3, 2, 3], col: "red" },
];

const INSIGHTS = [
  { t: "Riverside pressing edge", d: "High press recovers the ball <b>14.2× per 90</b> — top of the league and 38% above Kingsgate's build-up tolerance.", tag: "Tactical", cls: "blue" },
  { t: "Ashford xG overperformance", d: "Scoring <b>1.4 goals above xG</b> across 6 games — finishing regression likely.", tag: "Trend", cls: "amber" },
  { t: "Hartwell set-piece threat", d: "<b>41%</b> of goals from set pieces this season — opponents concede 0.6 xG from corners.", tag: "Pattern", cls: "violet" },
  { t: "Northfield away fragility", d: "Conceding <b>1.9 xGA</b> on the road vs 1.0 at home — breaks down in transition.", tag: "Risk", cls: "red" },
];

export function HomeScreen() {
  const nav = useMobileNav();
  const top = UPCOMING.slice(0, 4);
  const ranked = [...UPCOMING].sort((a, b) => b.conf - a.conf).slice(0, 5);

  return (
    <>
      <div className="lg-head">
        <div className="lg-eyebrow">Intelligence Center</div>
        <div className="lg-title">
          Good evening,
          <br />
          Alex
        </div>
        <div className="lg-sub">Sat 31 May · 24 matches tracked across 6 competitions today.</div>
      </div>

      <div className="carousel" style={{ marginTop: 14 }}>
        {KPIS.map((k) => (
          <div className="kpi-tile" key={k.lab}>
            <div className="lab">{k.lab}</div>
            <div className="val">{k.val}</div>
            <div className="delta" style={{ color: k.dc }}>
              {k.delta}
            </div>
            <Chart
              className="spark-slot"
              render={(el) => IX.spark(el, k.sp, { w: 76, h: 30, area: true, color: IX.C[k.col] })}
            />
          </div>
        ))}
      </div>

      <div className="block">
        <div className="block-hd">
          <h2>
            <span className="ic">
              <Icon name="star" />
            </span>
            Match of the Day
          </h2>
          <span className="badge blue">AI 74%</span>
        </div>
        <div className="m-card pad tappable" onClick={() => nav.pushScreen("match", FEATURE_MATCH)}>
          <div className="flex aic jcb" style={{ marginBottom: 14 }}>
            <div className="flex col aic gap-8" style={{ flex: 1 }}>
              <Crest code="RVS" size="lg" />
              <div style={{ fontWeight: 700, fontSize: 13 }}>Riverside</div>
            </div>
            <div className="flex col aic" style={{ padding: "0 8px" }}>
              <span className="mono dim" style={{ fontSize: 12, letterSpacing: ".12em" }}>
                VS
              </span>
              <span className="badge" style={{ marginTop: 8, fontSize: 10 }}>
                17:30
              </span>
            </div>
            <div className="flex col aic gap-8" style={{ flex: 1 }}>
              <Crest code="KGT" size="lg" />
              <div style={{ fontWeight: 700, fontSize: 13 }}>Kingsgate</div>
            </div>
          </div>
          <Tribar hp={47} dp={27} ap={26} />
          <div
            className="flex aic jcb"
            style={{ marginTop: 14, paddingTop: 13, borderTop: "1px solid var(--line)" }}
          >
            <div className="flex aic gap-8">
              <div className="profile-av" style={{ width: 28, height: 28, borderRadius: 9, fontSize: 11 }}>
                IX
              </div>
              <div style={{ fontSize: 11.5 }} className="muted">
                Model v4.2 · Premier League
              </div>
            </div>
            <span className="flex aic gap-4" style={{ color: "var(--blue-2)", fontSize: 12, fontWeight: 700 }}>
              Intel <Icon name="chev" />
            </span>
          </div>
        </div>
      </div>

      <div className="block">
        <div className="block-hd">
          <h2>
            <span className="ic">
              <Icon name="match" />
            </span>
            Today&apos;s Top Matches
          </h2>
          <span className="block-link" onClick={() => nav.showTab("fixtures")}>
            All <Icon name="chev" />
          </span>
        </div>
        <div className="m-card">
          {top.map((m) => (
            <div className="match-row tappable" key={m.id} onClick={() => nav.pushScreen("match", m)}>
              <div className="match-time">
                <div className="t">{m.time}</div>
                <div className="d">{m.date}</div>
              </div>
              <div className="mr-teams">
                <div className="mr-team">
                  <Crest code={m.home} size="xs" />
                  <span className="nm">{CLUBS[m.home].short}</span>
                </div>
                <div className="mr-team">
                  <Crest code={m.away} size="xs" />
                  <span className="nm">{CLUBS[m.away].short}</span>
                </div>
              </div>
              <div className="grow" style={{ maxWidth: 120 }}>
                <Tribar hp={m.hp} dp={m.dp} ap={m.ap} />
              </div>
              <div className="mr-conf">
                <div className="pct" style={{ color: confColor(m.conf) }}>
                  {m.conf}%
                </div>
                <div className="cl">{m.pick}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="block">
        <div className="block-hd">
          <h2>
            <span className="ic">
              <Icon name="bolt" />
            </span>
            AI Insights
          </h2>
          <span className="badge violet">Auto</span>
        </div>
      </div>
      <div className="carousel">
        {INSIGHTS.map((c) => (
          <div className="insight-card" key={c.t}>
            <div className="flex aic jcb">
              <span className={`badge ${c.cls}`}>{c.tag}</span>
              <span className="dim" style={{ fontSize: 10.5, fontFamily: "var(--font-mono)" }}>
                98%
              </span>
            </div>
            <div className="ttl">{c.t}</div>
            <div className="txt" dangerouslySetInnerHTML={{ __html: c.d }} />
          </div>
        ))}
      </div>

      <div className="block">
        <div className="block-hd">
          <h2>
            <span className="ic">
              <Icon name="target" />
            </span>
            Confidence Rankings
          </h2>
          <span className="badge">Today</span>
        </div>
        <div className="m-card pad">
          {ranked.map((m, i) => (
            <div
              className="flex aic gap-12 tappable"
              key={m.id}
              onClick={() => nav.pushScreen("match", m)}
              style={{ padding: "9px 0", borderBottom: i < ranked.length - 1 ? "1px solid var(--line)" : undefined }}
            >
              <div className="mono dim" style={{ width: 14, fontSize: 13 }}>
                {i + 1}
              </div>
              <div className="grow" style={{ fontSize: 13, fontWeight: 600 }}>
                {CLUBS[m.home].short} <span className="dim" style={{ fontWeight: 400 }}>v</span>{" "}
                {CLUBS[m.away].short}
              </div>
              <div className="badge" style={{ fontSize: 10 }}>
                {m.pick}
              </div>
              <div style={{ width: 46 }}>
                <Meter value={m.conf} green={m.conf >= 70} />
              </div>
              <div
                className="mono"
                style={{ width: 30, textAlign: "right", fontWeight: 700, fontSize: 13, color: confColor(m.conf) }}
              >
                {m.conf}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="block">
        <div className="block-hd">
          <h2>
            <span className="ic" style={{ color: "var(--red)" }}>
              <Icon name="live" />
            </span>
            Live Now
          </h2>
          <span className="block-link" onClick={() => nav.showTab("live")}>
            Watch <Icon name="chev" />
          </span>
        </div>
        <div className="flex col gap-12">
          {NOW_LIVE.slice(0, 2).map((m) => {
            const momCol = m.momentum === "home" ? "var(--blue)" : "var(--green)";
            return (
              <div className="live-card tappable" key={m.id} onClick={() => nav.pushScreen("match", m)}>
                <div className="flex aic jcb" style={{ marginBottom: 11 }}>
                  <span className="live-pill">
                    <span className="pulse" />
                    {m.min}&apos;
                  </span>
                  <span className="badge blue">AI {m.conf}%</span>
                </div>
                <div className="flex aic jcb">
                  <div className="flex aic gap-8" style={{ fontWeight: 700, fontSize: 14 }}>
                    <Crest code={m.home} size="xs" />
                    {m.home}
                  </div>
                  <div className="live-score">
                    {m.hs} – {m.as}
                  </div>
                  <div className="flex aic gap-8" style={{ fontWeight: 700, fontSize: 14 }}>
                    {m.away}
                    <Crest code={m.away} size="xs" />
                  </div>
                </div>
                <div className="momentum-bar" style={{ marginTop: 11 }}>
                  <i style={{ width: `${m.momentum === "home" ? 64 : 38}%`, background: momCol }} />
                </div>
                <div className="flex jcb" style={{ marginTop: 6, fontSize: 10.5, color: "var(--muted)" }}>
                  <span>xG {m.hxg.toFixed(2)}</span>
                  <span style={{ color: momCol }}>▲ {m.momentum}</span>
                  <span>xG {m.axg.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
