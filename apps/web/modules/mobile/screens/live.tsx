"use client";

import * as IX from "../../../lib/ix-charts";
import { CLUBS, NOW_LIVE, UPCOMING, xgRace } from "../data";
import { Chart } from "../chart";
import { useMobileNav } from "../nav-context";
import { Crest, confColor } from "../ui";
import { Icon } from "../icons";

export function LiveScreen() {
  const nav = useMobileNav();

  return (
    <>
      <div className="lg-head">
        <div className="lg-eyebrow">Real-time intelligence</div>
        <div className="lg-title">Live Center</div>
        <div className="lg-sub">
          {NOW_LIVE.length} matches live now · momentum, xG race and win probability updating live.
        </div>
      </div>

      <div className="block">
        <div className="flex col gap-14">
          {NOW_LIVE.map((m) => {
            const momCol = m.momentum === "home" ? "var(--blue)" : "var(--green)";
            return (
              <div className="m-card pad tappable" key={m.id} onClick={() => nav.pushScreen("match", m)}>
                <div className="flex aic jcb" style={{ marginBottom: 13 }}>
                  <span className="live-pill">
                    <span className="pulse" />
                    LIVE {m.min}&apos;
                  </span>
                  <span className="dim" style={{ fontSize: 11 }}>
                    {m.comp}
                  </span>
                </div>
                <div className="flex aic jcb" style={{ marginBottom: 6 }}>
                  <div className="flex aic gap-9" style={{ flex: 1 }}>
                    <Crest code={m.home} size="sm" />
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{CLUBS[m.home].short}</div>
                  </div>
                  <div className="live-score">
                    {m.hs} – {m.as}
                  </div>
                  <div className="flex aic gap-9" style={{ flex: 1, justifyContent: "flex-end" }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{CLUBS[m.away].short}</div>
                    <Crest code={m.away} size="sm" />
                  </div>
                </div>
                <div className="label-xs" style={{ margin: "10px 0 4px", fontSize: 10 }}>
                  xG race
                </div>
                <Chart
                  render={(el) => {
                    const r = xgRace(m.home.charCodeAt(0), m.min);
                    IX.line(el, {
                      w: 340,
                      h: 58,
                      pad: { t: 6, r: 6, b: 6, l: 6 },
                      gy: 2,
                      series: [
                        { color: IX.C.blue, area: true, data: r.a.map((p) => ({ x: p.m, y: p.v })) },
                        { color: IX.C.green, data: r.b.map((p) => ({ x: p.m, y: p.v })) },
                      ],
                      xMax: r.a[r.a.length - 1].m,
                      yMax: Math.max(...r.a.map((p) => p.v), ...r.b.map((p) => p.v)) * 1.12,
                    });
                  }}
                />
                <div className="momentum-bar" style={{ marginTop: 10 }}>
                  <i style={{ width: `${m.momentum === "home" ? 64 : 40}%`, background: momCol }} />
                </div>
                <div className="flex jcb" style={{ marginTop: 6, fontSize: 11, color: "var(--muted)" }}>
                  <span>xG {m.hxg.toFixed(2)}</span>
                  <span style={{ color: momCol }}>{m.momentum} momentum</span>
                  <span>xG {m.axg.toFixed(2)}</span>
                </div>
                <div
                  className="flex aic gap-8"
                  style={{
                    marginTop: 12,
                    padding: 10,
                    borderRadius: 11,
                    background: "rgba(46,125,255,.06)",
                    border: "1px solid rgba(46,125,255,.16)",
                  }}
                >
                  <span className="badge blue" style={{ flexShrink: 0 }}>
                    AI {m.conf}%
                  </span>
                  <span style={{ fontSize: 11.5, color: "var(--text-2)" }}>
                    Model favours <b style={{ color: "#fff" }}>{m.pick === "Draw" ? "the draw" : m.pick}</b> · tap for
                    full live intel
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="block">
        <div className="block-hd">
          <h2>
            <span className="ic">
              <Icon name="fixtures" />
            </span>
            Starting Soon
          </h2>
        </div>
        <div className="m-card">
          {UPCOMING.slice(0, 3).map((m) => (
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
              <div className="mr-conf">
                <div className="pct" style={{ color: confColor(m.conf) }}>
                  {m.conf}%
                </div>
                <div className="cl">{m.pick}</div>
              </div>
              <span className="dim" style={{ marginLeft: 2 }}>
                <Icon name="chev" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
