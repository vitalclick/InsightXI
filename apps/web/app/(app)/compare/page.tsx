"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api-client";
import { PageHead } from "../../../components/ui/page-head";
import { Crest } from "../../../components/ui/crest";
import { ChartBox } from "../../../components/charts/chart-box";
import { STRENGTH_AXES, strengthValues, compareRows } from "../../../lib/team-strength";
import * as IX from "../../../lib/ix-charts";
import type { TacticalMatchup } from "../../../lib/types";

function CompareInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: teams = [] } = useQuery({ queryKey: ["teams", "all"], queryFn: () => api.teams() });

  const [a, setA] = useState("");
  const [b, setB] = useState("");

  // Seed selections from ?a=&b=, else the first two teams once loaded.
  useEffect(() => {
    if (!teams.length) return;
    const qa = params.get("a");
    const qb = params.get("b");
    setA((prev) => prev || (qa && teams.some((t) => t.id === qa) ? qa : teams[0].id));
    setB((prev) => prev || (qb && teams.some((t) => t.id === qb) ? qb : teams[1]?.id ?? teams[0].id));
  }, [teams, params]);

  // Keep the URL shareable as selections change.
  useEffect(() => {
    if (!a || !b) return;
    const next = `/compare?a=${a}&b=${b}`;
    if (`${window.location.pathname}${window.location.search}` !== next) {
      router.replace(next, { scroll: false });
    }
  }, [a, b, router]);

  const { data: ra } = useQuery({ queryKey: ["teamRatings", a], queryFn: () => api.teamRatings(a), enabled: !!a, retry: 0 });
  const { data: rb } = useQuery({ queryKey: ["teamRatings", b], queryFn: () => api.teamRatings(b), enabled: !!b, retry: 0 });
  const { data: h2h } = useQuery({
    queryKey: ["h2h", a, b],
    queryFn: () => api.h2h(a, b),
    enabled: !!a && !!b && a !== b,
    retry: 0,
  });
  const { data: tactical } = useQuery({
    queryKey: ["tacticalMatchup", a, b],
    queryFn: () => api.tacticalMatchup(a, b),
    enabled: !!a && !!b && a !== b,
    retry: 0,
  });

  const nameA = teams.find((t) => t.id === a)?.name ?? "";
  const nameB = teams.find((t) => t.id === b)?.name ?? "";
  const rows = useMemo(() => (ra && rb ? compareRows(ra, rb) : []), [ra, rb]);
  const tally = useMemo(() => {
    let av = 0;
    let bv = 0;
    rows.forEach((r) => (r.better === "a" ? av++ : r.better === "b" ? bv++ : null));
    return { av, bv };
  }, [rows]);

  return (
    <>
      <PageHead
        eyebrow="Team Intelligence"
        title="Team Comparison"
        sub="Put two teams side by side — strength radar, head-to-head metrics and meeting history."
      />

      {/* Selectors */}
      <div className="card reveal" style={{ marginBottom: 18 }}>
        <div className="card-bd flex gap-16 aic wrap">
          <TeamSelect label="Team A" value={a} onChange={setA} teams={teams} />
          <span className="dim mono">vs</span>
          <TeamSelect label="Team B" value={b} onChange={setB} teams={teams} />
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => {
              setA(b);
              setB(a);
            }}
            aria-label="Swap teams"
            style={{ marginLeft: "auto" }}
          >
            ⇄ Swap
          </button>
        </div>
      </div>

      {a === b ? (
        <section className="card"><div className="card-bd empty"><p>Pick two different teams to compare.</p></div></section>
      ) : !ra || !rb ? (
        <section className="card"><div className="card-bd empty"><p>Loading team ratings…</p></div></section>
      ) : (
        <>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1.1fr", alignItems: "start" }}>
          {/* Radar */}
          <section className="card reveal">
            <div className="card-hd">
              <h3>Strength profile</h3>
              <div className="flex gap-12" style={{ fontSize: 11.5 }}>
                <span className="flex aic gap-6"><span style={{ width: 9, height: 9, borderRadius: 3, background: "var(--blue)" }} />{nameA}</span>
                <span className="flex aic gap-6"><span style={{ width: 9, height: 9, borderRadius: 3, background: "var(--green)" }} />{nameB}</span>
              </div>
            </div>
            <div className="card-bd flex jcc">
              <ChartBox
                style={{ width: 300 }}
                label={`Strength radar comparing ${nameA} and ${nameB}`}
                deps={[a, b]}
                draw={(el) =>
                  IX.radar(el, {
                    size: 300,
                    axes: [...STRENGTH_AXES],
                    series: [
                      { color: IX.C.blue, values: strengthValues(ra) },
                      { color: IX.C.green, values: strengthValues(rb) },
                    ],
                  })
                }
              />
            </div>
          </section>

          {/* Metric table */}
          <section className="card reveal">
            <div className="card-hd">
              <h3>Head-to-head metrics</h3>
              <span className="badge">{tally.av > tally.bv ? `${nameA} leads ${tally.av}-${tally.bv}` : tally.bv > tally.av ? `${nameB} leads ${tally.bv}-${tally.av}` : `Level ${tally.av}-${tally.bv}`}</span>
            </div>
            <div className="card-bd" style={{ padding: "6px 18px 14px" }}>
              <div className="flex jcb aic" style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                <span className="flex aic gap-8" style={{ flex: 1 }}><Crest name={nameA} seed={a} size="xs" /><b style={{ fontSize: 13 }}>{nameA}</b></span>
                <span className="dim" style={{ fontSize: 11, padding: "0 10px" }}>metric</span>
                <span className="flex aic gap-8" style={{ flex: 1, justifyContent: "flex-end" }}><b style={{ fontSize: 13 }}>{nameB}</b><Crest name={nameB} seed={b} size="xs" /></span>
              </div>
              {rows.map((r) => (
                <div key={r.label} className="flex jcb aic" style={{ padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
                  <span className="mono" style={{ flex: 1, fontWeight: 700, color: r.better === "a" ? "var(--green-2)" : "var(--text-2)" }}>
                    {r.format(r.a)}
                  </span>
                  <span className="dim" style={{ flex: "0 0 130px", textAlign: "center", fontSize: 11.5 }}>{r.label}</span>
                  <span className="mono" style={{ flex: 1, textAlign: "right", fontWeight: 700, color: r.better === "b" ? "var(--green-2)" : "var(--text-2)" }}>
                    {r.format(r.b)}
                  </span>
                </div>
              ))}

              {h2h && h2h.played > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="label-xs" style={{ marginBottom: 8 }}>Recent meetings ({h2h.played})</div>
                  <div className="meter" style={{ height: 9, display: "flex" }}>
                    <i style={{ width: `${(h2h.teamAWins / h2h.played) * 100}%`, background: "var(--blue)", borderRadius: 0 }} />
                    <i style={{ width: `${(h2h.draws / h2h.played) * 100}%`, background: "#54607a", borderRadius: 0 }} />
                    <i style={{ width: `${(h2h.teamBWins / h2h.played) * 100}%`, background: "var(--green)", borderRadius: 0 }} />
                  </div>
                  <div className="flex jcb" style={{ marginTop: 6, fontSize: 11, color: "var(--muted)" }}>
                    <span>{h2h.teamAWins}W</span>
                    <span>{h2h.draws}D · {h2h.avgGoalsPerGame.toFixed(2)} gpg</span>
                    <span>{h2h.teamBWins}W</span>
                  </div>
                </div>
              )}

              <div className="flex gap-10" style={{ marginTop: 16 }}>
                <Link href={`/teams/${a}`} className="btn btn-sm btn-ghost">{nameA} profile →</Link>
                <Link href={`/teams/${b}`} className="btn btn-sm btn-ghost">{nameB} profile →</Link>
              </div>
            </div>
          </section>
        </div>

        {tactical && <TacticalCard m={tactical} nameA={nameA} nameB={nameB} />}
        </>
      )}
    </>
  );
}

function TacticalCard({ m, nameA, nameB }: { m: TacticalMatchup; nameA: string; nameB: string }) {
  const edge = m.tacticalEdge; // -100 (away) .. +100 (home)
  const homePct = 50 + edge / 2; // map to 0..100 share of the bar
  const leader = edge > 4 ? nameA : edge < -4 ? nameB : "Even";
  return (
    <section className="card reveal" style={{ marginTop: 18 }}>
      <div className="card-hd">
        <h3>Tactical matchup</h3>
        <span className="badge">{leader === "Even" ? "Even tactical profile" : `${leader} edge`}</span>
      </div>
      <div className="card-bd">
        {/* Edge bar */}
        <div className="flex jcb" style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 6 }}>
          <span>{nameA}</span>
          <span className="mono">tactical edge {edge > 0 ? "+" : ""}{edge}</span>
          <span>{nameB}</span>
        </div>
        <div style={{ display: "flex", height: 8, borderRadius: 20, overflow: "hidden", background: "var(--surface-3)" }}>
          <i style={{ width: `${homePct}%`, background: "var(--blue)" }} />
          <i style={{ width: `${100 - homePct}%`, background: "var(--green)" }} />
        </div>

        {/* Profiles */}
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 18 }}>
          <TacticalProfileCol p={m.home} accent="var(--blue)" />
          <TacticalProfileCol p={m.away} accent="var(--green)" />
        </div>

        {/* Insights */}
        {m.insights.length > 0 && (
          <ul style={{ margin: "16px 0 0", paddingLeft: 18, fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>
            {m.insights.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}
        <p className="dim" style={{ fontSize: 11, marginTop: 12, marginBottom: 0 }}>
          Heuristic tactical read derived from team ratings — explainable, not tracking data.
        </p>
      </div>
    </section>
  );
}

function TacticalProfileCol({ p, accent }: { p: TacticalMatchup["home"]; accent: string }) {
  return (
    <div style={{ borderLeft: `2px solid ${accent}`, paddingLeft: 12 }}>
      <div className="flex jcb aic">
        <b style={{ fontSize: 13 }}>{p.name}</b>
        <span className="badge mono">{p.formation}</span>
      </div>
      <dl style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--text-2)" }}>
        <Row k="Possession" v={`${p.possession}%`} />
        <Row k="Pressing" v={`${p.pressingIntensity}/100`} />
        <Row k="Defensive line" v={p.defensiveLine} />
        <Row k="Attacking flow" v={p.attackingFlow} />
        <Row k="Transitions" v={p.transitionStyle} />
      </dl>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex jcb" style={{ padding: "3px 0" }}>
      <dt className="dim">{k}</dt>
      <dd style={{ margin: 0, fontWeight: 600, color: "var(--text)" }}>{v}</dd>
    </div>
  );
}

function TeamSelect({
  label,
  value,
  onChange,
  teams,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  teams: { id: string; name: string }[];
}) {
  return (
    <label className="flex col gap-4">
      <span className="label-xs">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="chip"
        style={{ height: 38, paddingRight: 24, background: "var(--surface-1)", color: "var(--text)" }}
        aria-label={label}
      >
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function ComparePage() {
  // useSearchParams() requires a Suspense boundary in the app router.
  return (
    <Suspense fallback={<div className="empty">Loading…</div>}>
      <CompareInner />
    </Suspense>
  );
}
