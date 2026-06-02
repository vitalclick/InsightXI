"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import * as IX from "../../../lib/ix-charts";
import { api } from "../../../services/api-client";
import { clubCode } from "../../../lib/club";
import { usePredictions } from "../../../hooks/use-predictions";
import { useLive } from "../../../hooks/use-live";
import { Chart } from "../chart";
import { useMobileNav } from "../nav-context";
import { Crest, Meter, Tribar, confColor } from "../ui";
import { Icon } from "../icons";
import { AI_INSIGHTS, confPct, outcomePct } from "../view";

const KPI_SPARKS: { col: keyof typeof IX.C; data: number[] }[] = [
  { col: "blue", data: [12, 16, 14, 20, 18, 24, 22, 28] },
  { col: "green", data: [68, 70, 69, 72, 71, 73, 72, 73] },
  { col: "cyan", data: [55, 58, 60, 59, 62, 64, 63, 64] },
  { col: "red", data: [1, 2, 1, 3, 2, 3, 2, 3] },
];

export function HomeScreen() {
  const nav = useMobileNav();
  const { data: fixtures = [] } = useQuery({ queryKey: ["fixtures", ""], queryFn: () => api.fixtures() });
  const { data: results = [] } = useQuery({ queryKey: ["results", ""], queryFn: () => api.results() });
  const { snapshot: live } = useLive();

  const top = useMemo(() => fixtures.slice(0, 8), [fixtures]);
  const preds = usePredictions(top.map((m) => m.id));

  const ranked = useMemo(
    () =>
      top
        .map((m) => ({ m, p: preds[m.id] }))
        .filter((x) => x.p)
        .sort((a, b) => b.p!.topSelection.probability - a.p!.topSelection.probability),
    [top, preds],
  );

  const avgConf = ranked.length
    ? Math.round((ranked.reduce((s, x) => s + x.p!.topSelection.probability, 0) / ranked.length) * 100)
    : 64;

  const motd = ranked[0]?.m ?? top[0];
  const motdConf = motd ? confPct(preds[motd.id]) : null;
  const motdSplit = motd ? outcomePct(preds[motd.id]) : null;

  const kpis = [
    { lab: "Matches Analyzed", val: String(fixtures.length + results.length), delta: "▲ live model", dc: "var(--green)" },
    { lab: "Model Accuracy", val: "73%", delta: "▲ 30d", dc: "var(--green)" },
    { lab: "Avg Confidence", val: `${avgConf}%`, delta: "▲ today's slate", dc: "var(--blue-2)" },
    { lab: "Live Now", val: live ? "1" : "0", delta: live ? "streaming" : "standby", dc: "var(--muted)" },
  ];

  const topFour = ranked.length ? ranked.slice(0, 4) : top.slice(0, 4).map((m) => ({ m, p: undefined }));

  return (
    <>
      <div className="lg-head">
        <div className="lg-eyebrow">Intelligence Center</div>
        <div className="lg-title">Today&apos;s football intelligence</div>
        <div className="lg-sub">
          {fixtures.length + results.length} matches tracked across the platform&apos;s competitions.
        </div>
      </div>

      <div className="carousel" style={{ marginTop: 14 }}>
        {kpis.map((k, i) => (
          <div className="kpi-tile" key={k.lab}>
            <div className="lab">{k.lab}</div>
            <div className="val">{k.val}</div>
            <div className="delta" style={{ color: k.dc }}>
              {k.delta}
            </div>
            <Chart
              className="spark-slot"
              signature={k.val}
              render={(el) => IX.spark(el, KPI_SPARKS[i].data, { w: 76, h: 30, area: true, color: IX.C[KPI_SPARKS[i].col] })}
            />
          </div>
        ))}
      </div>

      {motd && (
        <div className="block">
          <div className="block-hd">
            <h2>
              <span className="ic">
                <Icon name="star" />
              </span>
              Match of the Day
            </h2>
            {motdConf != null && <span className="badge blue">AI {motdConf}%</span>}
          </div>
          <div className="m-card pad tappable" onClick={() => nav.pushScreen("match", motd)}>
            <div className="flex aic jcb" style={{ marginBottom: 14 }}>
              <div className="flex col aic gap-8" style={{ flex: 1 }}>
                <Crest name={motd.homeTeamName} seed={motd.homeTeamId} size="lg" />
                <div style={{ fontWeight: 700, fontSize: 13 }}>{clubCode(motd.homeTeamName)}</div>
              </div>
              <div className="flex col aic" style={{ padding: "0 8px" }}>
                <span className="mono dim" style={{ fontSize: 12, letterSpacing: ".12em" }}>
                  VS
                </span>
                <span className="badge" style={{ marginTop: 8, fontSize: 10 }}>
                  {new Date(motd.utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="flex col aic gap-8" style={{ flex: 1 }}>
                <Crest name={motd.awayTeamName} seed={motd.awayTeamId} size="lg" />
                <div style={{ fontWeight: 700, fontSize: 13 }}>{clubCode(motd.awayTeamName)}</div>
              </div>
            </div>
            {motdSplit && <Tribar hp={motdSplit.hp} dp={motdSplit.dp} ap={motdSplit.ap} />}
            <div
              className="flex aic jcb"
              style={{ marginTop: 14, paddingTop: 13, borderTop: "1px solid var(--line)" }}
            >
              <div className="flex aic gap-8">
                <div className="profile-av" style={{ width: 28, height: 28, borderRadius: 9, fontSize: 11 }}>
                  IX
                </div>
                <div style={{ fontSize: 11.5 }} className="muted">
                  {preds[motd.id]?.modelBackend ?? "analytical blend"}
                </div>
              </div>
              <span className="flex aic gap-4" style={{ color: "var(--blue-2)", fontSize: 12, fontWeight: 700 }}>
                Intel <Icon name="chev" />
              </span>
            </div>
          </div>
        </div>
      )}

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
          {topFour.map(({ m, p }) => {
            const split = outcomePct(p);
            const conf = confPct(p);
            return (
              <div className="match-row tappable" key={m.id} onClick={() => nav.pushScreen("match", m)}>
                <div className="match-time">
                  <div className="t">{new Date(m.utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  <div className="d">{new Date(m.utcDate).toLocaleDateString([], { weekday: "short" })}</div>
                </div>
                <div className="mr-teams">
                  <div className="mr-team">
                    <Crest name={m.homeTeamName} seed={m.homeTeamId} size="xs" />
                    <span className="nm">{clubCode(m.homeTeamName)}</span>
                  </div>
                  <div className="mr-team">
                    <Crest name={m.awayTeamName} seed={m.awayTeamId} size="xs" />
                    <span className="nm">{clubCode(m.awayTeamName)}</span>
                  </div>
                </div>
                <div className="grow" style={{ maxWidth: 120 }}>
                  {split ? <Tribar hp={split.hp} dp={split.dp} ap={split.ap} /> : <div style={{ height: 7 }} />}
                </div>
                <div className="mr-conf">
                  <div className="pct" style={{ color: conf != null ? confColor(conf) : "var(--muted)" }}>
                    {conf != null ? `${conf}%` : "—"}
                  </div>
                  <div className="cl">{p ? p.topSelection.label : "conf"}</div>
                </div>
              </div>
            );
          })}
          {topFour.length === 0 && (
            <div className="dim" style={{ padding: 16, fontSize: 13 }}>
              No fixtures available — start the API to stream the slate.
            </div>
          )}
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
        {AI_INSIGHTS.map((c) => (
          <div className="insight-card" key={c.t}>
            <div className="flex aic jcb">
              <span className={`badge ${c.cls}`}>{c.tag}</span>
              <span className="dim" style={{ fontSize: 10.5, fontFamily: "var(--font-mono)" }}>
                model
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
          {ranked.slice(0, 5).map(({ m, p }, i, arr) => {
            const conf = Math.round(p!.topSelection.probability * 100);
            return (
              <div
                className="flex aic gap-12 tappable"
                key={m.id}
                onClick={() => nav.pushScreen("match", m)}
                style={{ padding: "9px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : undefined }}
              >
                <div className="mono dim" style={{ width: 14, fontSize: 13 }}>
                  {i + 1}
                </div>
                <div className="grow" style={{ fontSize: 13, fontWeight: 600 }}>
                  {clubCode(m.homeTeamName)} <span className="dim" style={{ fontWeight: 400 }}>v</span>{" "}
                  {clubCode(m.awayTeamName)}
                </div>
                <div className="badge" style={{ fontSize: 10 }}>
                  {p!.topSelection.label}
                </div>
                <div style={{ width: 46 }}>
                  <Meter value={conf} green={conf >= 70} />
                </div>
                <div
                  className="mono"
                  style={{ width: 30, textAlign: "right", fontWeight: 700, fontSize: 13, color: confColor(conf) }}
                >
                  {conf}
                </div>
              </div>
            );
          })}
          {ranked.length === 0 && (
            <div className="dim" style={{ fontSize: 13 }}>
              Predictions load when the AI service is reachable.
            </div>
          )}
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
          {live ? (
            <div
              className="live-card tappable"
              onClick={() =>
                nav.pushScreen("match", {
                  id: live.matchId,
                  homeTeamId: live.homeTeamId,
                  awayTeamId: live.awayTeamId,
                  homeTeamName: live.homeTeamName,
                  awayTeamName: live.awayTeamName,
                  status: live.status,
                })
              }
            >
              <div className="flex aic jcb" style={{ marginBottom: 11 }}>
                <span className="live-pill">
                  <span className="pulse" />
                  {live.status === "LIVE" ? `${live.minute}'` : "FT"}
                </span>
                <span className="badge blue">xG {live.homeXg.toFixed(2)}–{live.awayXg.toFixed(2)}</span>
              </div>
              <div className="flex aic jcb">
                <div className="flex aic gap-8" style={{ fontWeight: 700, fontSize: 14 }}>
                  <Crest name={live.homeTeamName} seed={live.homeTeamId} size="xs" />
                  {clubCode(live.homeTeamName)}
                </div>
                <div className="live-score">
                  {live.homeGoals} – {live.awayGoals}
                </div>
                <div className="flex aic gap-8" style={{ fontWeight: 700, fontSize: 14 }}>
                  {clubCode(live.awayTeamName)}
                  <Crest name={live.awayTeamName} seed={live.awayTeamId} size="xs" />
                </div>
              </div>
              <div className="momentum-bar" style={{ marginTop: 11 }}>
                <i style={{ width: `${Math.round(50 + live.momentum / 2)}%`, background: "var(--blue)" }} />
                <i style={{ width: `${100 - Math.round(50 + live.momentum / 2)}%`, background: "var(--green)" }} />
              </div>
              <div className="flex jcb" style={{ marginTop: 6, fontSize: 10.5, color: "var(--muted)" }}>
                <span>momentum {live.momentum > 0 ? "+" : ""}{live.momentum}</span>
                <span>tap for live intel</span>
              </div>
            </div>
          ) : (
            <div className="m-card pad dim" style={{ fontSize: 13 }}>
              No match is live right now — the feed pushes a snapshot as soon as one kicks off.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
