"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api-client";
import { PageHead } from "../../../components/ui/page-head";
import { Crest } from "../../../components/ui/crest";
import { Icon } from "../../../components/ui/icon";
import { usePredictions, confColor } from "../../../hooks/use-predictions";
import { clubCode } from "../../../lib/club";
import { availableMarkets, boardViews, pickCode, type BoardEntry, type BoardView } from "../../../lib/board";

const pickClass = { "1": "h", X: "d", "2": "a" } as const;

const CONFIDENCE_TIERS = [
  { label: "All", value: 0 },
  { label: "Strong 66%+", value: 66 },
  { label: "Very strong 80%+", value: 80 },
  { label: "Elite 90%+", value: 90 },
] as const;

const VALID_CONF = new Set(CONFIDENCE_TIERS.map((t) => t.value));

function BoardInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: fixtures = [] } = useQuery({ queryKey: ["fixtures", ""], queryFn: () => api.fixtures() });
  const { data: leagues = [] } = useQuery({ queryKey: ["leagues"], queryFn: api.leagues });
  const preds = usePredictions(fixtures.map((m) => m.id));

  // Seed filter state from the URL so a filtered board is shareable.
  const initConf = Number(params.get("conf"));
  const [minConfidence, setMinConfidence] = useState(VALID_CONF.has(initConf) ? initConf : 0);
  const [market, setMarket] = useState<string | null>(params.get("market") || null);

  // Keep the URL in sync with the active filters.
  useEffect(() => {
    const qs = new URLSearchParams();
    if (minConfidence) qs.set("conf", String(minConfidence));
    if (market) qs.set("market", market);
    const next = qs.toString() ? `/board?${qs.toString()}` : "/board";
    if (`${window.location.pathname}${window.location.search}` !== next) {
      router.replace(next, { scroll: false });
    }
  }, [minConfidence, market, router]);

  const entries: BoardEntry[] = useMemo(
    () => fixtures.map((m) => ({ m, p: preds[m.id] })),
    [fixtures, preds],
  );
  const markets = useMemo(() => availableMarkets(entries), [entries]);
  const views = useMemo(() => boardViews(entries, { minConfidence, market }), [entries, minConfidence, market]);

  const motd = views[0];
  const leagueName = (id: string) => leagues.find((l) => l.id === id)?.name ?? id.toUpperCase();

  // Group the filtered, ranked views by league for the board list.
  const grouped = useMemo(() => {
    const g: Record<string, BoardView[]> = {};
    views.forEach((v) => {
      (g[v.m.leagueId] ??= []).push(v);
    });
    return g;
  }, [views]);

  return (
    <>
      <PageHead
        eyebrow="Today's intelligence board"
        title="Confidence Board"
        sub="Every fixture, ranked by model confidence — with the day's standout read up top."
        actions={
          <Link href="/fixtures" className="btn btn-sm btn-primary">
            View all fixtures →
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex aic gap-12 wrap reveal" style={{ marginBottom: 18 }}>
        <div className="chip-row">
          {CONFIDENCE_TIERS.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`chip${minConfidence === t.value ? " active" : ""}`}
              onClick={() => setMinConfidence(t.value)}
              aria-pressed={minConfidence === t.value}
            >
              {t.label}
            </button>
          ))}
        </div>
        {markets.length > 0 && (
          <label className="flex aic gap-6" style={{ marginLeft: "auto" }}>
            <span className="label-xs">Rank by</span>
            <select
              value={market ?? ""}
              onChange={(e) => setMarket(e.target.value || null)}
              className="chip"
              style={{ height: 34, paddingRight: 24, background: "var(--surface-1)", color: "var(--text)" }}
              aria-label="Rank board by market"
            >
              <option value="">Top pick (1X2)</option>
              {markets.map((mk) => (
                <option key={mk.key} value={mk.key}>
                  {mk.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="grid board-grid" style={{ gridTemplateColumns: "1fr 1.35fr", gap: 22, alignItems: "start" }}>
        {/* Match of the Day */}
        <div className="card reveal">
          <div className="board-hd">Match of the Day</div>
          <div className="card-bd">
            {motd ? (
              <>
                <div className="flex jcb aic" style={{ margin: "6px 0 20px" }}>
                  <div className="flex col aic gap-10" style={{ flex: 1 }}>
                    <Crest name={motd.m.homeTeamName} seed={motd.m.homeTeamId} size="lg" />
                    <div style={{ fontWeight: 700, textAlign: "center", fontSize: 14 }}>{motd.m.homeTeamName}</div>
                  </div>
                  <div className="flex col aic" style={{ flexShrink: 0, padding: "0 10px" }}>
                    <span className="dim mono" style={{ fontSize: 12, letterSpacing: ".1em" }}>VS</span>
                    <span className="badge blue" style={{ marginTop: 8 }}>AI {Math.round(motd.prob * 100)}%</span>
                    <span className="dim" style={{ fontSize: 10.5, marginTop: 6, textAlign: "center" }}>{motd.label}</span>
                  </div>
                  <div className="flex col aic gap-10" style={{ flex: 1 }}>
                    <Crest name={motd.m.awayTeamName} seed={motd.m.awayTeamId} size="lg" />
                    <div style={{ fontWeight: 700, textAlign: "center", fontSize: 14 }}>{motd.m.awayTeamName}</div>
                  </div>
                </div>
                <div className="flex gap-8">
                  <ProbPill label="Home" value={Math.round(motd.p.outcome.homeWin * 100)} fav={pickCode(motd.p) === "1"} />
                  <ProbPill label="Draw" value={Math.round(motd.p.outcome.draw * 100)} fav={pickCode(motd.p) === "X"} />
                  <ProbPill label="Away" value={Math.round(motd.p.outcome.awayWin * 100)} fav={pickCode(motd.p) === "2"} />
                </div>
                <div className="flex jcb aic" style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                  <div className="flex aic gap-9">
                    <div className="tb-avatar" style={{ width: 30, height: 30, fontSize: 11, borderRadius: 9 }}>IX</div>
                    <div style={{ fontSize: 12 }}>
                      <span className="dim">Analysis by</span> <b>{motd.p.modelBackend}</b>
                    </div>
                  </div>
                  <Link href={`/matches/${motd.m.id}`} className="btn btn-sm btn-primary">View Intel →</Link>
                </div>
              </>
            ) : (
              <div className="empty"><p>Predictions load when the AI service is reachable.</p></div>
            )}
          </div>
        </div>

        {/* Confidence board list */}
        <div className="card reveal">
          <div className="board-hd">AI Picks · Confidence Board</div>
          <div className="card-bd" style={{ paddingTop: 4 }}>
            {Object.entries(grouped).map(([lid, rows]) => (
              <div key={lid}>
                <div className="league-row">
                  <span className="badge blue" style={{ fontSize: 9 }}>{lid.toUpperCase().slice(0, 3)}</span>
                  {leagueName(lid)}
                </div>
                {rows.map(({ m, prob, pick }) => (
                  <Link key={m.id} href={`/matches/${m.id}`} className="board-row" style={{ color: "inherit" }}>
                    <span className="mono dim" style={{ width: 50, fontSize: 12, flexShrink: 0 }}>
                      {new Date(m.utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div className="flex aic gap-7" style={{ flex: 1, justifyContent: "flex-end", fontSize: 13, fontWeight: 600, minWidth: 0 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clubCode(m.homeTeamName)}</span>
                      <Crest name={m.homeTeamName} seed={m.homeTeamId} size="xs" />
                    </div>
                    <span className="dim" style={{ fontSize: 11, flexShrink: 0 }}>:</span>
                    <div className="flex aic gap-7" style={{ flex: 1, fontSize: 13, fontWeight: 600, minWidth: 0 }}>
                      <Crest name={m.awayTeamName} seed={m.awayTeamId} size="xs" />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clubCode(m.awayTeamName)}</span>
                    </div>
                    <span
                      className="mono"
                      style={{
                        fontSize: 11,
                        color: confColor(Math.round(prob * 100)),
                        width: 34,
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {Math.round(prob * 100)}%
                    </span>
                    <span className={`pick-badge ${pickClass[pick]}`} title="AI predicted outcome">
                      {pick}
                    </span>
                  </Link>
                ))}
              </div>
            ))}
            {views.length === 0 && (
              <div className="empty">
                <p>{entries.some((e) => e.p) ? "No fixtures match the current filters." : "Predictions load when the AI service is reachable."}</p>
              </div>
            )}
          </div>
          <div className="board-ft" style={{ justifyContent: "flex-end" }}>
            <span className="muted" style={{ fontSize: 12, marginRight: "auto" }}>
              <Icon name="bolt" size={12} /> Confidence-ranked · probabilistic, for analytical use only
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default function BoardPage() {
  // useSearchParams() requires a Suspense boundary in the app router.
  return (
    <Suspense fallback={<div className="empty">Loading board…</div>}>
      <BoardInner />
    </Suspense>
  );
}

function ProbPill({ label, value, fav }: { label: string; value: number; fav: boolean }) {
  return (
    <div className={`prob-pill${fav ? " fav" : ""}`}>
      <b>{value}%</b>
      <span className="lbl">{label}</span>
    </div>
  );
}
