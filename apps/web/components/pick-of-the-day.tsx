"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api-client";
import { Crest } from "./ui/crest";
import { Icon } from "./ui/icon";
import { confColor } from "../hooks/use-predictions";
import { clubCode } from "../lib/club";
import type { DailyPickStatus } from "../lib/types";

const STATUS: Record<DailyPickStatus, { label: string; cls: string }> = {
  PENDING: { label: "Locked", cls: "" },
  HIT: { label: "Won", cls: "green" },
  MISS: { label: "Lost", cls: "red" },
  VOID: { label: "Void", cls: "" },
};

/**
 * The single highest-confidence "Pick of the Day" — InsightXI's quality-over-
 * quantity headline. Framed as a probabilistic confidence call (never a "sure
 * win"), with the model's reasoning and an honest, settled track record.
 */
export function PickOfTheDay() {
  const { data: pick, isLoading } = useQuery({
    queryKey: ["daily-pick"],
    queryFn: () => api.dailyPick(),
    retry: 0,
    staleTime: 5 * 60_000,
  });
  const { data: history } = useQuery({
    queryKey: ["daily-pick-history"],
    queryFn: () => api.dailyPickHistory(30),
    retry: 0,
    staleTime: 5 * 60_000,
  });

  if (isLoading) return null;

  if (!pick) {
    return (
      <section className="card reveal" style={{ marginBottom: 6 }}>
        <div className="card-hd">
          <h3>
            <span className="ic">
              <Icon name="bolt" size={16} />
            </span>{" "}
            Pick of the Day
          </h3>
          <span className="badge">Highest confidence</span>
        </div>
        <div className="card-bd dim" style={{ padding: "18px", fontSize: 13 }}>
          Today&apos;s pick appears once fixtures are scheduled and the model is
          reachable.
        </div>
      </section>
    );
  }

  const conf = Math.round(pick.probability * 100);
  const status = STATUS[pick.status];
  const rec = history?.summary;
  const ko = pick.kickoff ? new Date(pick.kickoff) : null;
  const kickoff = ko
    ? ko.toLocaleString(undefined, {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <section
      className="card reveal"
      style={{
        marginBottom: 6,
        borderColor: "color-mix(in srgb, var(--gold) 40%, var(--line))",
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--gold) 6%, var(--surface-1)), var(--surface-1))",
      }}
    >
      <div className="card-hd">
        <h3>
          <span className="ic" style={{ color: "var(--gold)" }}>
            <Icon name="bolt" size={16} />
          </span>{" "}
          Pick of the Day
        </h3>
        <span className={`badge ${status.cls}`}>{status.label}</span>
      </div>

      <div
        className="card-bd grid"
        style={{ gridTemplateColumns: "1.25fr 1fr", gap: 20, padding: "18px" }}
      >
        {/* The pick */}
        <div>
          <div className="flex aic gap-9" style={{ marginBottom: 12 }}>
            <Crest name={pick.homeTeam} seed={pick.homeTeam} size="sm" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {clubCode(pick.homeTeam)}
            </span>
            <span className="dim" style={{ fontSize: 11 }}>
              v
            </span>
            <Crest name={pick.awayTeam} seed={pick.awayTeam} size="sm" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {clubCode(pick.awayTeam)}
            </span>
            {kickoff && (
              <span className="dim" style={{ fontSize: 11, marginLeft: 4 }}>
                · {kickoff}
              </span>
            )}
          </div>

          <div className="flex aic gap-12">
            <div
              className="mono"
              style={{ fontSize: 40, fontWeight: 800, color: confColor(conf), lineHeight: 1 }}
            >
              {conf}%
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{pick.label}</div>
              <div className="dim" style={{ fontSize: 12 }}>
                {pick.confidenceLevel} · model {pick.modelBackend}
              </div>
            </div>
          </div>

          <div className="flex aic gap-10" style={{ marginTop: 14 }}>
            <Link href={`/matches/${pick.matchId}`} className="btn btn-primary">
              View match intel
            </Link>
            {pick.resultNote && (
              <span className="dim" style={{ fontSize: 12 }}>
                {pick.resultNote}
              </span>
            )}
          </div>
        </div>

        {/* Reasoning + honest track record */}
        <div style={{ borderLeft: "1px solid var(--line)", paddingLeft: 18 }}>
          <div className="stat-lab" style={{ marginBottom: 8 }}>
            Why this pick
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6 }}>
            {pick.explanations.slice(0, 4).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
            {pick.explanations.length === 0 && <li>Model headline selection.</li>}
          </ul>

          {rec && rec.settled > 0 && (
            <div
              className="flex aic gap-8"
              style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" }}
            >
              <span className="badge green">Track record</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>
                {rec.hits}/{rec.hits + rec.misses}
              </span>
              <span className="dim" style={{ fontSize: 11 }}>
                {rec.hitRate != null ? `${Math.round(rec.hitRate * 100)}% hit rate` : ""} · last{" "}
                {rec.settled} settled
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        className="dim"
        style={{ fontSize: 10.5, padding: "0 18px 12px", color: "var(--muted)" }}
      >
        A statistical confidence call from the model — probabilistic, not a guaranteed outcome.
      </div>
    </section>
  );
}
