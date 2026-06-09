"use client";

import { useQuery } from "@tanstack/react-query";
import * as IX from "../../../lib/ix-charts";
import { api } from "../../../services/api-client";
import { clubCode } from "../../../lib/club";
import type { TacticalProfile } from "../../../lib/types";
import { Chart } from "../chart";
import { useMobileNav } from "../nav-context";
import { Crest, FormDots, MiniStat, Tribar } from "../ui";
import { Icon } from "../icons";
import { buildMatchReport } from "../../../lib/match-report";
import { confPct, findMarketPct, outcomePct, type MatchArg } from "../view";

const LINE_SCORE: Record<string, number> = { High: 88, Medium: 55, Low: 25 };
function tacticalRadar(p: TacticalProfile): number[] {
  return [
    p.possession,
    p.pressingIntensity,
    LINE_SCORE[p.defensiveLine] ?? 50,
    p.transitionStyle.toLowerCase().includes("counter")
      ? 85
      : p.transitionStyle.toLowerCase().includes("direct")
        ? 65
        : 35,
    Math.min(100, p.possession + 12),
  ];
}

export function MatchScreen({ match: arg }: { match?: MatchArg }) {
  const nav = useMobileNav();
  const id = arg?.id;

  const { data: fetched } = useQuery({ queryKey: ["match", id], queryFn: () => api.match(id!), enabled: !!id });
  const { data: pred } = useQuery({ queryKey: ["prediction", id], queryFn: () => api.prediction(id!), enabled: !!id, retry: 0 });
  const { data: tactical } = useQuery({ queryKey: ["tactical", id], queryFn: () => api.tactical(id!), enabled: !!id, retry: 0 });

  const homeId = fetched?.homeTeamId ?? arg?.homeTeamId;
  const awayId = fetched?.awayTeamId ?? arg?.awayTeamId;
  const { data: homeProfile } = useQuery({ queryKey: ["team", homeId], queryFn: () => api.teamProfile(homeId!), enabled: !!homeId });
  const { data: awayProfile } = useQuery({ queryKey: ["team", awayId], queryFn: () => api.teamProfile(awayId!), enabled: !!awayId });
  const { data: h2h } = useQuery({
    queryKey: ["h2h", homeId, awayId],
    queryFn: () => api.h2h(homeId!, awayId!),
    enabled: !!homeId && !!awayId,
    retry: 0,
  });

  // Render from the fetched match, falling back to the push arg for an instant header.
  const m = fetched ?? arg;
  if (!m) {
    return (
      <div className="block" style={{ paddingTop: 14 }}>
        <div className="m-card pad dim" style={{ fontSize: 13 }}>
          Match not found.
        </div>
      </div>
    );
  }

  const split = outcomePct(pred);
  const conf = confPct(pred);
  const fav = split ? (split.hp >= split.dp && split.hp >= split.ap ? "h" : split.ap >= split.dp ? "a" : "d") : null;
  const finished = m.status === "FINISHED";
  const o15 = findMarketPct(pred, "Over 1.5");
  const o25 = findMarketPct(pred, "Over 2.5");
  const btts = findMarketPct(pred, "Both Teams") ?? findMarketPct(pred, "BTTS");

  const report = pred
    ? buildMatchReport({
        homeName: m.homeTeamName,
        awayName: m.awayTeamName,
        pred,
        homeForm: homeProfile?.recentForm,
        awayForm: awayProfile?.recentForm,
        h2h: h2h && h2h.played > 0 ? h2h : undefined,
        tacticalEdge: tactical?.tacticalEdge,
      })
    : null;

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
            <span className="badge blue">{m.matchday ? `Matchday ${m.matchday}` : "Fixture"}</span>
            <span className="dim" style={{ fontSize: 11 }}>
              {m.utcDate
                ? new Date(m.utcDate).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                : ""}
            </span>
          </div>
          <div className="flex aic jcb">
            <div className="flex col aic gap-9" style={{ flex: 1 }}>
              <Crest name={m.homeTeamName} seed={m.homeTeamId} size="xl" />
              <div style={{ fontWeight: 700, fontSize: 13.5, textAlign: "center" }}>{clubCode(m.homeTeamName)}</div>
              <div className="dim" style={{ fontSize: 10.5 }}>Home</div>
            </div>
            <div className="flex col aic" style={{ padding: "0 6px" }}>
              {finished ? (
                <>
                  <div className="live-score">
                    {m.homeGoals ?? 0}–{m.awayGoals ?? 0}
                  </div>
                  <span className="badge" style={{ marginTop: 6 }}>
                    Full time
                  </span>
                </>
              ) : (
                <>
                  <div className="mono dim" style={{ fontSize: 14, letterSpacing: ".14em" }}>
                    VS
                  </div>
                  {conf != null && (
                    <div className="badge blue" style={{ marginTop: 8 }}>
                      AI {conf}%
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex col aic gap-9" style={{ flex: 1 }}>
              <Crest name={m.awayTeamName} seed={m.awayTeamId} size="xl" />
              <div style={{ fontWeight: 700, fontSize: 13.5, textAlign: "center" }}>{clubCode(m.awayTeamName)}</div>
              <div className="dim" style={{ fontSize: 10.5 }}>Away</div>
            </div>
          </div>
          <div
            className="flex aic jcc gap-16 muted"
            style={{ marginTop: 16, paddingTop: 13, borderTop: "1px solid var(--line)", fontSize: 11.5 }}
          >
            <span className="muted">{m.homeTeamName} v {m.awayTeamName}</span>
            <span className="dim">·</span>
            <span className="muted">{pred?.modelBackend ?? "analytical blend"}</span>
          </div>
        </div>
      </div>

      {!pred ? (
        <div className="block">
          <div className="m-card pad">
            <div style={{ fontWeight: 700, fontSize: 14 }}>Match intelligence unavailable</div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.5 }}>
              The AI service is offline — outcome probabilities and explainable reasoning will appear once it&apos;s
              reachable.
            </div>
          </div>
        </div>
      ) : (
        <>
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
              {split && (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <Tribar hp={split.hp} dp={split.dp} ap={split.ap} />
                  </div>
                  <div className="flex gap-8">
                    <div className={`prob-pill${fav === "h" ? " fav" : ""}`} style={{ flexDirection: "column", gap: 3, padding: "11px 4px" }}>
                      <Crest name={m.homeTeamName} seed={m.homeTeamId} size="xs" />
                      <b className="mono" style={{ fontSize: 16 }}>{split.hp}%</b>
                      <span className="dim" style={{ fontSize: 10 }}>Home</span>
                    </div>
                    <div className={`prob-pill${fav === "d" ? " fav" : ""}`} style={{ flexDirection: "column", gap: 3, padding: "11px 4px" }}>
                      <span className="pickb d" style={{ width: 26, height: 26, fontSize: 11 }}>X</span>
                      <b className="mono" style={{ fontSize: 16 }}>{split.dp}%</b>
                      <span className="dim" style={{ fontSize: 10 }}>Draw</span>
                    </div>
                    <div className={`prob-pill${fav === "a" ? " fav" : ""}`} style={{ flexDirection: "column", gap: 3, padding: "11px 4px" }}>
                      <Crest name={m.awayTeamName} seed={m.awayTeamId} size="xs" />
                      <b className="mono" style={{ fontSize: 16 }}>{split.ap}%</b>
                      <span className="dim" style={{ fontSize: 10 }}>Away</span>
                    </div>
                  </div>
                </>
              )}
              <div className="flex gap-8" style={{ marginTop: 10 }}>
                <MiniStat label="Over 1.5" value={o15 != null ? `${o15}%` : "—"} />
                <MiniStat label="Over 2.5" value={o25 != null ? `${o25}%` : "—"} />
                <MiniStat label="BTTS" value={btts != null ? `${btts}%` : "—"} />
              </div>
            </div>
          </div>

          <div className="block">
            <div className="block-hd">
              <h2>
                <span className="ic">
                  <Icon name="bolt" />
                </span>
                Confidence &amp; Markets
              </h2>
              <span className="badge green">{pred.confidenceLevel}</span>
            </div>
            <div className="m-card pad">
              <div className="flex aic gap-16">
                <div style={{ width: 120, flexShrink: 0, textAlign: "center" }}>
                  <Chart signature={conf ?? 0} render={(el) => IX.gauge(el, conf ?? 0, { size: 120, stroke: 12, label: "confidence" })} />
                  <div className="label-xs" style={{ fontSize: 9.5, marginTop: 2 }}>
                    Model confidence
                  </div>
                </div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="label-xs" style={{ fontSize: 9.5, marginBottom: 6 }}>
                    Market probabilities
                  </div>
                  <Chart
                    signature={id}
                    render={(el) =>
                      IX.bars(
                        el,
                        pred.markets.slice(0, 5).map((mk) => ({
                          label: mk.label,
                          v: Math.round(mk.probability * 100),
                          disp: `${Math.round(mk.probability * 100)}%`,
                        })),
                        { horiz: true, labelW: 92, valW: 38, max: 100 },
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {tactical && (
            <div className="block">
              <div className="block-hd">
                <h2>
                  <span className="ic">
                    <Icon name="teams" />
                  </span>
                  Tactical Profile
                </h2>
                <span className="badge">Edge {tactical.tacticalEdge > 0 ? "+" : ""}{tactical.tacticalEdge}</span>
              </div>
              <div className="m-card pad">
                <div className="flex aic gap-10" style={{ marginBottom: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--blue)" }} />
                  <b style={{ fontSize: 13 }}>{clubCode(tactical.home.name)}</b>
                  <span className="dim" style={{ fontSize: 11 }}>
                    {tactical.home.formation} · {tactical.home.transitionStyle.toLowerCase()}
                  </span>
                </div>
                <div className="flex aic gap-10" style={{ marginBottom: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--green)" }} />
                  <b style={{ fontSize: 13 }}>{clubCode(tactical.away.name)}</b>
                  <span className="dim" style={{ fontSize: 11 }}>
                    {tactical.away.formation} · {tactical.away.transitionStyle.toLowerCase()}
                  </span>
                </div>
                <Chart
                  style={{ maxWidth: 280, margin: "0 auto" }}
                  signature={id}
                  render={(el) =>
                    IX.radar(el, {
                      size: 280,
                      axes: ["Poss", "Press", "Line", "Transit", "Tempo"],
                      series: [
                        { color: IX.C.blue, values: tacticalRadar(tactical.home) },
                        { color: IX.C.green, values: tacticalRadar(tactical.away) },
                      ],
                    })
                  }
                />
              </div>
            </div>
          )}

          {report && (
            <div className="block">
              <div className="block-hd">
                <h2>
                  <span className="ic">
                    <Icon name="doc" />
                  </span>
                  Match Report
                </h2>
                <span className="badge violet">AI</span>
              </div>
              <div className="m-card pad">
                <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-.01em", marginBottom: 6 }}>
                  {report.headline}
                </div>
                <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.55, marginBottom: 10 }}>
                  {report.summary}
                </div>
                {report.paragraphs.map((p, i) => (
                  <div key={i} style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55, marginBottom: 8 }}>
                    {p}
                  </div>
                ))}
                <div className="dim" style={{ fontSize: 10.5, marginTop: 6, lineHeight: 1.45 }}>
                  {report.disclaimer}
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
                Key Insights
              </h2>
              <span className="badge violet">AI</span>
            </div>
            <div className="m-card pad">
              {pred.explanations.map((t, i) => (
                <div className="xai" key={`e${i}`}>
                  <span className="ic neu">AI</span>
                  <span className="bd">{t}</span>
                </div>
              ))}
              {tactical?.insights.map((t, i) => (
                <div className="xai" key={`t${i}`}>
                  <span className="ic pos">↑</span>
                  <span className="bd">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {(homeProfile || awayProfile) && (
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
                    <Crest name={m.homeTeamName} seed={m.homeTeamId} size="xs" />
                    <b style={{ fontSize: 13 }}>{clubCode(m.homeTeamName)}</b>
                  </div>
                  <FormDots form={homeProfile?.recentForm ?? []} />
                </div>
                <div className="flex aic jcb" style={{ padding: "10px 0 6px", borderTop: "1px solid var(--line)" }}>
                  <div className="flex aic gap-9">
                    <Crest name={m.awayTeamName} seed={m.awayTeamId} size="xs" />
                    <b style={{ fontSize: 13 }}>{clubCode(m.awayTeamName)}</b>
                  </div>
                  <FormDots form={awayProfile?.recentForm ?? []} />
                </div>
              </div>
            </div>
          )}

          {h2h && h2h.played > 0 && (
            <div className="block">
              <div className="block-hd">
                <h2>
                  <span className="ic">
                    <Icon name="history" />
                  </span>
                  Head to Head
                </h2>
                <span className="badge">{h2h.played} meetings</span>
              </div>
              <div className="m-card pad">
                <div className="flex aic jcb" style={{ marginBottom: 12 }}>
                  <div className="center">
                    <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: "var(--blue-2)" }}>{h2h.teamAWins}</div>
                    <div className="dim" style={{ fontSize: 10 }}>{clubCode(m.homeTeamName)}</div>
                  </div>
                  <div className="center">
                    <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: "var(--muted)" }}>{h2h.draws}</div>
                    <div className="dim" style={{ fontSize: 10 }}>Draws</div>
                  </div>
                  <div className="center">
                    <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: "var(--green)" }}>{h2h.teamBWins}</div>
                    <div className="dim" style={{ fontSize: 10 }}>{clubCode(m.awayTeamName)}</div>
                  </div>
                </div>
                <div className="momentum-bar" style={{ height: 8 }}>
                  <i style={{ width: `${(h2h.teamAWins / h2h.played) * 100}%`, background: "var(--blue)" }} />
                  <i style={{ width: `${(h2h.draws / h2h.played) * 100}%`, background: "#54607a" }} />
                  <i style={{ width: `${(h2h.teamBWins / h2h.played) * 100}%`, background: "var(--green)" }} />
                </div>
                <div className="flex jcb" style={{ marginTop: 10, fontSize: 11 }}>
                  <span className="muted">Avg {h2h.avgGoalsPerGame.toFixed(2)} goals</span>
                  <span className="muted">BTTS {Math.round(h2h.bttsRate * 100)}%</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="block">
        <button className="btn btn-primary tappable" style={{ width: "100%" }} onClick={() => nav.pushScreen("premium")}>
          <Icon name="premium" /> See full Premium report
        </button>
      </div>
    </>
  );
}
