"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../../services/api-client";
import { PageHead } from "../../../../components/ui/page-head";
import { Crest } from "../../../../components/ui/crest";
import { FormDots } from "../../../../components/ui/form-dots";
import { ChartBox } from "../../../../components/charts/chart-box";
import * as IX from "../../../../lib/ix-charts";

export default function TeamProfilePage({ params }: { params: { id: string } }) {
  const { data: team, isLoading } = useQuery({ queryKey: ["team", params.id], queryFn: () => api.teamProfile(params.id) });
  const { data: ratings } = useQuery({ queryKey: ["teamRatings", params.id], queryFn: () => api.teamRatings(params.id), retry: 0 });

  if (isLoading) return <div className="empty">Loading team…</div>;
  if (!team) return <div className="empty"><h4>Team not found</h4></div>;

  const clamp = (n: number) => Math.max(6, Math.min(100, n));

  return (
    <>
      <div className="flex aic gap-8 reveal" style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14 }}>
        <Link href="/teams" style={{ color: "var(--blue-2)" }}>Teams</Link>
        <span>›</span>
        <span style={{ color: "var(--text)" }}>{team.name}</span>
      </div>

      <section className="card reveal" style={{ marginBottom: 18 }}>
        <div className="card-bd flex aic gap-20 wrap">
          <Crest name={team.name} shortName={team.shortName} seed={team.id} size="xl" />
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 className="page-title">{team.name}</h1>
            <div className="page-sub">{team.played} matches played · current season</div>
            <div style={{ marginTop: 10 }}>
              <FormDots form={team.recentForm} />
            </div>
          </div>
          <div className="flex gap-24 wrap">
            <div className="stat"><div className="stat-val" style={{ fontSize: 22 }}>{ratings ? Math.round(ratings.elo) : "—"}</div><div className="stat-lab">Elo rating</div></div>
            <div className="stat"><div className="stat-val" style={{ fontSize: 22, color: "var(--green)" }}>{team.goalsFor}</div><div className="stat-lab">Goals for</div></div>
            <div className="stat"><div className="stat-val" style={{ fontSize: 22, color: "var(--red)" }}>{team.goalsAgainst}</div><div className="stat-lab">Goals against</div></div>
          </div>
        </div>
      </section>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
        <section className="card reveal">
          <div className="card-hd"><h3>Strength profile</h3>{ratings && <span className="badge blue">Form {ratings.recentFormPoints}/15</span>}</div>
          <div className="card-bd flex jcc">
            {ratings ? (
              <ChartBox
                style={{ width: 260 }}
                deps={[team.id]}
                draw={(el) =>
                  IX.radar(el, {
                    size: 260,
                    axes: ["Attack", "Defense", "Form", "xG For", "xG Block"],
                    series: [
                      {
                        color: IX.C.blue,
                        values: [
                          clamp(ratings.attackStrength * 55),
                          clamp(110 - ratings.defenseStrength * 55),
                          clamp((ratings.recentFormPoints / 15) * 100),
                          clamp(ratings.avgXgFor * 42),
                          clamp(110 - ratings.avgXgAgainst * 42),
                        ],
                      },
                    ],
                  })
                }
              />
            ) : (
              <div className="empty"><p>Ratings unavailable.</p></div>
            )}
          </div>
        </section>

        <section className="card reveal">
          <div className="card-hd"><h3>Expected goals</h3><span className="badge">Per match</span></div>
          <div className="card-bd">
            <Metric label="Avg xG for" value={team.avgXgFor.toFixed(2)} pct={Math.min(100, team.avgXgFor * 42)} green />
            <Metric label="Avg xG against" value={team.avgXgAgainst.toFixed(2)} pct={Math.min(100, team.avgXgAgainst * 42)} />
            <Metric label="Goals for" value={String(team.goalsFor)} pct={Math.min(100, (team.goalsFor / Math.max(1, team.played)) * 30)} green />
            <Metric label="Goals against" value={String(team.goalsAgainst)} pct={Math.min(100, (team.goalsAgainst / Math.max(1, team.played)) * 30)} />
          </div>
        </section>
      </div>
    </>
  );
}

function Metric({ label, value, pct, green }: { label: string; value: string; pct: number; green?: boolean }) {
  return (
    <div className="flex aic gap-12" style={{ marginBottom: 14 }}>
      <span style={{ width: 120, fontSize: 13, color: "var(--text-2)" }}>{label}</span>
      <span className={`meter${green ? " green" : ""}`} style={{ flex: 1 }}>
        <i style={{ width: `${pct}%` }} />
      </span>
      <span className="mono" style={{ width: 40, textAlign: "right", fontWeight: 700, fontSize: 13 }}>{value}</span>
    </div>
  );
}
