"use client";

import * as IX from "../../../lib/ix-charts";
import { CLUBS, FEATURE_MATCH, type AnyMatch, type FormResult } from "../data";
import { Chart } from "../chart";
import { useMobileNav } from "../nav-context";
import { Crest, FormDots, MiniStat, Tribar, ordinal } from "../ui";
import { Icon } from "../icons";

interface NormMatch {
  home: string;
  away: string;
  hp: number;
  dp: number;
  ap: number;
  conf: number;
  o15: number;
  o25: number;
  btts: number;
  comp: string;
  round: string;
  live: boolean;
  hs?: number;
  as?: number;
  min?: number;
  kickoff: string;
  stadium: string;
  hForm: FormResult[];
  aForm: FormResult[];
}

/** Reduce any match shape to the fields the Match Intel screen renders. */
function norm(m: AnyMatch): NormMatch {
  const hC = CLUBS[m.home];
  const aC = CLUBS[m.away];
  let hp: number;
  let dp: number;
  let ap: number;
  let conf: number;
  if (m.pred) {
    hp = m.pred.home;
    dp = m.pred.draw;
    ap = m.pred.away;
    conf = m.pred.conf;
  } else if (typeof m.hp === "number") {
    hp = m.hp;
    dp = m.dp as number;
    ap = m.ap as number;
    conf = m.conf as number;
  } else {
    conf = m.conf ?? 66;
    hp = m.momentum === "home" ? 52 : 41;
    ap = m.momentum === "away" ? 47 : 30;
    dp = 100 - hp - ap;
  }
  return {
    home: m.home,
    away: m.away,
    hp,
    dp,
    ap,
    conf,
    o15: m.pred ? m.pred.o15 : 84,
    o25: m.pred ? m.pred.o25 : 50 + (conf % 14),
    btts: m.pred ? m.pred.btts : 48 + (m.home.charCodeAt(0) % 16),
    comp: m.comp ?? "Premier League",
    round: m.round ?? "Matchday 31",
    live: m.status === "live",
    hs: m.hs,
    as: m.as,
    min: m.min,
    kickoff: m.status === "live" ? `LIVE · ${m.min}'` : `${m.date ?? "Today"} · ${m.time ?? "17:30"}`,
    stadium: m.stadium ?? hC.city + " Stadium",
    hForm: m.hForm ?? hC.form,
    aForm: m.aForm ?? aC.form,
  };
}

export function MatchScreen({ match }: { match?: AnyMatch }) {
  const nav = useMobileNav();
  const m = match ?? FEATURE_MATCH;
  const n = norm(m);
  const hC = CLUBS[n.home];
  const aC = CLUBS[n.away];
  const fav = n.hp >= n.dp && n.hp >= n.ap ? "h" : n.ap >= n.dp ? "a" : "d";

  const insights = [
    { ic: "pos", t: `${hC.short} press recovers the ball <b>14.2× per 90</b> — 38% above ${aC.short}'s build-up tolerance.`, w: "+18" },
    { ic: "neu", t: `Expected goals model leans <b>${n.hp}%</b> home off a +1.2 xG differential.`, w: "xG" },
    { ic: "neg", t: `${aC.short} concede <b>1.6 xGA</b> away to top-6 — vulnerable in transition.`, w: "−9" },
    { ic: "pos", t: `Set-piece edge: <b>${n.btts}%</b> BTTS probability with both attacks in form.`, w: "SP" },
  ];

  // Synthesised win-prob path drifting toward the current split.
  const wp: IX.WinProbDatum[] = [];
  const steps = 13;
  for (let i = 0; i < steps; i++) {
    const k = i / (steps - 1);
    const h = Math.round(33 + (n.hp - 33) * k + Math.sin(i * 1.3) * 4);
    const a = Math.round(33 + (n.ap - 33) * k + Math.cos(i * 1.1) * 3);
    const d = Math.max(8, 100 - h - a);
    wp.push({ m: i, h, d, a });
  }

  const xaiColor = (ic: string) => (ic === "pos" ? "var(--green-2)" : ic === "neg" ? "#ff8a95" : "var(--blue-2)");
  const xaiSymbol = (ic: string, w: string) => (ic === "pos" ? "↑" : ic === "neg" ? "↓" : w === "xG" ? "xG" : "AI");

  return (
    <>
      <div className="block" style={{ paddingTop: 14 }}>
        <div
          className="m-card pad"
          style={{
            background:
              "radial-gradient(440px 220px at 50% -10%,rgba(46,125,255,.14),transparent 62%),linear-gradient(180deg,var(--surface-1),var(--card-grad-2))",
          }}
        >
          <div className="flex aic jcb" style={{ marginBottom: 16 }}>
            <span className="badge blue">{n.comp}</span>
            <span className="dim" style={{ fontSize: 11 }}>
              {n.round}
            </span>
          </div>
          <div className="flex aic jcb">
            <div className="flex col aic gap-9" style={{ flex: 1 }}>
              <Crest code={n.home} size="xl" />
              <div style={{ fontWeight: 700, fontSize: 13.5, textAlign: "center" }}>{hC.short}</div>
              <div className="dim" style={{ fontSize: 10.5 }}>
                {hC.pos}
                {ordinal(hC.pos)}
              </div>
            </div>
            <div className="flex col aic" style={{ padding: "0 6px" }}>
              {n.live ? (
                <>
                  <div className="live-score">
                    {n.hs}–{n.as}
                  </div>
                  <span className="live-pill" style={{ marginTop: 6 }}>
                    <span className="pulse" />
                    {n.min}&apos;
                  </span>
                </>
              ) : (
                <>
                  <div className="mono dim" style={{ fontSize: 14, letterSpacing: ".14em" }}>
                    VS
                  </div>
                  <div className="badge blue" style={{ marginTop: 8 }}>
                    AI {n.conf}%
                  </div>
                </>
              )}
            </div>
            <div className="flex col aic gap-9" style={{ flex: 1 }}>
              <Crest code={n.away} size="xl" />
              <div style={{ fontWeight: 700, fontSize: 13.5, textAlign: "center" }}>{aC.short}</div>
              <div className="dim" style={{ fontSize: 10.5 }}>
                {aC.pos}
                {ordinal(aC.pos)}
              </div>
            </div>
          </div>
          <div
            className="flex aic jcc gap-16 muted"
            style={{ marginTop: 16, paddingTop: 13, borderTop: "1px solid var(--line)", fontSize: 11.5 }}
          >
            <span className="muted">{n.kickoff}</span>
            <span className="dim">·</span>
            <span className="muted">{n.stadium}</span>
          </div>
        </div>
      </div>

      <div className="block">
        <div className="block-hd">
          <h2>
            <span className="ic">
              <Icon name="target" />
            </span>
            Match Prediction
          </h2>
        </div>
        <div className="m-card pad">
          <div style={{ marginBottom: 14 }}>
            <Tribar hp={n.hp} dp={n.dp} ap={n.ap} />
          </div>
          <div className="flex gap-8">
            <div className={`prob-pill${fav === "h" ? " fav" : ""}`} style={{ flexDirection: "column", gap: 3, padding: "11px 4px" }}>
              <Crest code={n.home} size="xs" />
              <b className="mono" style={{ fontSize: 16 }}>
                {n.hp}%
              </b>
              <span className="dim" style={{ fontSize: 10 }}>
                Home
              </span>
            </div>
            <div className={`prob-pill${fav === "d" ? " fav" : ""}`} style={{ flexDirection: "column", gap: 3, padding: "11px 4px" }}>
              <span className="pickb d" style={{ width: 26, height: 26, fontSize: 11 }}>
                X
              </span>
              <b className="mono" style={{ fontSize: 16 }}>
                {n.dp}%
              </b>
              <span className="dim" style={{ fontSize: 10 }}>
                Draw
              </span>
            </div>
            <div className={`prob-pill${fav === "a" ? " fav" : ""}`} style={{ flexDirection: "column", gap: 3, padding: "11px 4px" }}>
              <Crest code={n.away} size="xs" />
              <b className="mono" style={{ fontSize: 16 }}>
                {n.ap}%
              </b>
              <span className="dim" style={{ fontSize: 10 }}>
                Away
              </span>
            </div>
          </div>
          <div className="flex gap-8" style={{ marginTop: 10 }}>
            <MiniStat label="Over 1.5" value={`${n.o15}%`} />
            <MiniStat label="Over 2.5" value={`${n.o25}%`} />
            <MiniStat label="BTTS" value={`${n.btts}%`} />
          </div>
        </div>
      </div>

      <div className="block">
        <div className="block-hd">
          <h2>
            <span className="ic">
              <Icon name="bolt" />
            </span>
            Confidence &amp; Win Probability
          </h2>
        </div>
        <div className="m-card pad">
          <div className="flex aic gap-16">
            <div style={{ width: 120, flexShrink: 0, textAlign: "center" }}>
              <Chart render={(el) => IX.gauge(el, n.conf, { size: 120, stroke: 12, label: n.conf >= 70 ? "High" : "Medium" })} />
              <div className="label-xs" style={{ fontSize: 9.5, marginTop: 2 }}>
                Model confidence
              </div>
            </div>
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="label-xs" style={{ fontSize: 9.5, marginBottom: 6 }}>
                Win-prob over time
              </div>
              <Chart render={(el) => IX.winprob(el, wp, { w: 230, h: 96 })} />
              <div className="flex gap-12" style={{ marginTop: 8, fontSize: 10.5 }}>
                <span className="flex aic gap-5">
                  <i style={{ width: 9, height: 9, borderRadius: 3, background: "var(--blue)" }} />
                  Home
                </span>
                <span className="flex aic gap-5">
                  <i style={{ width: 9, height: 9, borderRadius: 3, background: "#6b7689" }} />
                  Draw
                </span>
                <span className="flex aic gap-5">
                  <i style={{ width: 9, height: 9, borderRadius: 3, background: "var(--green)" }} />
                  Away
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="block">
        <div className="block-hd">
          <h2>
            <span className="ic">
              <Icon name="teams" />
            </span>
            Tactical Profile
          </h2>
        </div>
        <div className="m-card pad">
          <div className="flex aic gap-10" style={{ marginBottom: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--blue)" }} />
            <b style={{ fontSize: 13 }}>{hC.short}</b>
            <span className="dim" style={{ fontSize: 11 }}>
              possession press
            </span>
          </div>
          <div className="flex aic gap-10" style={{ marginBottom: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--green)" }} />
            <b style={{ fontSize: 13 }}>{aC.short}</b>
            <span className="dim" style={{ fontSize: 11 }}>
              direct transition
            </span>
          </div>
          <Chart
            style={{ maxWidth: 280, margin: "0 auto" }}
            render={(el) =>
              IX.radar(el, {
                size: 280,
                axes: ["Press", "Tempo", "Width", "Direct", "Poss", "Trans"],
                series: [
                  { color: IX.C.blue, values: [hC.def, hC.mid, hC.poss, hC.att, hC.poss, hC.mid].map((v) => Math.min(98, v)) },
                  {
                    color: IX.C.green,
                    values: [aC.def - 6, aC.mid + 4, aC.att, aC.att + 2, aC.poss - 8, aC.mid + 6].map((v) =>
                      Math.min(98, Math.max(30, v)),
                    ),
                  },
                ],
              })
            }
          />
        </div>
      </div>

      <div className="block">
        <div className="block-hd">
          <h2>
            <span className="ic">
              <Icon name="match" />
            </span>
            Key Insights
          </h2>
          <span className="badge violet">AI</span>
        </div>
        <div className="m-card pad">
          {insights.map((r, i) => (
            <div className="xai" key={i}>
              <span className={`ic ${r.ic}`}>{xaiSymbol(r.ic, r.w)}</span>
              <span className="bd" dangerouslySetInnerHTML={{ __html: r.t }} />
              <span className="w" style={{ color: xaiColor(r.ic) }}>
                {r.w}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="block">
        <div className="block-hd">
          <h2>
            <span className="ic">
              <Icon name="results" />
            </span>
            Recent Form
          </h2>
        </div>
        <div className="m-card pad">
          <div className="flex aic jcb" style={{ padding: "6px 0" }}>
            <div className="flex aic gap-9">
              <Crest code={n.home} size="xs" />
              <b style={{ fontSize: 13 }}>{hC.short}</b>
            </div>
            <FormDots form={n.hForm} />
          </div>
          <div className="flex aic jcb" style={{ padding: "10px 0 6px", borderTop: "1px solid var(--line)" }}>
            <div className="flex aic gap-9">
              <Crest code={n.away} size="xs" />
              <b style={{ fontSize: 13 }}>{aC.short}</b>
            </div>
            <FormDots form={n.aForm} />
          </div>
        </div>
      </div>

      <div className="block">
        <button
          className="btn btn-primary tappable"
          style={{ width: "100%" }}
          onClick={() => nav.pushScreen("premium")}
        >
          <Icon name="premium" /> See full Premium report
        </button>
      </div>
    </>
  );
}
