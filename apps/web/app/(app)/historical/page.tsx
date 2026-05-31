"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api-client";
import { useAuthStore } from "../../../store/auth-store";
import { PageHead } from "../../../components/ui/page-head";
import { Crest } from "../../../components/ui/crest";
import { Icon } from "../../../components/ui/icon";
import { ChartBox } from "../../../components/charts/chart-box";
import * as IX from "../../../lib/ix-charts";

export default function HistoricalPage() {
  const { token, user } = useAuthStore();
  const isPremium = user?.tier === "PREMIUM";

  const { data: teams = [] } = useQuery({ queryKey: ["teams", "epl"], queryFn: () => api.teams("epl") });
  const [homeId, setHomeId] = useState("");
  const [awayId, setAwayId] = useState("");

  useEffect(() => {
    if (teams.length >= 2 && !homeId) {
      setHomeId(teams[0].id);
      setAwayId(teams[1].id);
    }
  }, [teams, homeId]);

  const { data: h2h } = useQuery({
    queryKey: ["h2h", homeId, awayId],
    queryFn: () => api.h2h(homeId, awayId),
    enabled: Boolean(homeId && awayId && homeId !== awayId),
    retry: 0,
  });

  const { data: trends = [] } = useQuery({
    queryKey: ["trends", homeId, token],
    queryFn: () => api.trends(homeId, token ?? ""),
    enabled: Boolean(homeId && token && isPremium),
    retry: 0,
  });

  const homeName = teams.find((t) => t.id === homeId)?.name ?? "";
  const awayName = teams.find((t) => t.id === awayId)?.name ?? "";

  return (
    <>
      <PageHead
        eyebrow="Historical Analytics"
        title="A decade of context"
        sub="Head-to-head records and multi-season team trends — turning history into an edge."
      />

      {/* Selectors */}
      <div className="card reveal" style={{ marginBottom: 18 }}>
        <div className="card-bd flex gap-16 aic wrap">
          <TeamSelect label="Team A" value={homeId} onChange={setHomeId} teams={teams} />
          <span className="dim mono">vs</span>
          <TeamSelect label="Team B" value={awayId} onChange={setAwayId} teams={teams} />
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1.4fr", alignItems: "start" }}>
        {/* H2H */}
        <section className="card reveal">
          <div className="card-hd"><h3>Head to Head</h3><span className="badge">{h2h?.played ?? 0} meetings</span></div>
          <div className="card-bd">
            {homeId === awayId ? (
              <div className="empty"><p>Pick two different teams.</p></div>
            ) : h2h && h2h.played > 0 ? (
              <>
                <div className="flex jcb aic" style={{ marginBottom: 14 }}>
                  <div className="flex col aic gap-8" style={{ flex: 1 }}>
                    <Crest name={homeName} seed={homeId} size="md" />
                    <div className="stat-val" style={{ color: "var(--blue-2)" }}>{h2h.teamAWins}</div>
                    <div className="stat-lab">wins</div>
                  </div>
                  <div className="center"><div className="stat-val" style={{ color: "var(--muted)" }}>{h2h.draws}</div><div className="stat-lab">draws</div></div>
                  <div className="flex col aic gap-8" style={{ flex: 1 }}>
                    <Crest name={awayName} seed={awayId} size="md" />
                    <div className="stat-val" style={{ color: "var(--green)" }}>{h2h.teamBWins}</div>
                    <div className="stat-lab">wins</div>
                  </div>
                </div>
                <div className="meter" style={{ height: 9, display: "flex" }}>
                  <i style={{ width: `${(h2h.teamAWins / h2h.played) * 100}%`, background: "var(--blue)", borderRadius: 0 }} />
                  <i style={{ width: `${(h2h.draws / h2h.played) * 100}%`, background: "#54607a", borderRadius: 0 }} />
                  <i style={{ width: `${(h2h.teamBWins / h2h.played) * 100}%`, background: "var(--green)", borderRadius: 0 }} />
                </div>
                <div className="flex jcb" style={{ marginTop: 16 }}>
                  <div className="stat"><div className="stat-val" style={{ fontSize: 19 }}>{h2h.avgGoalsPerGame.toFixed(2)}</div><div className="stat-lab">Avg goals/game</div></div>
                  <div className="stat"><div className="stat-val" style={{ fontSize: 19, color: "var(--green)" }}>{Math.round(h2h.bttsRate * 100)}%</div><div className="stat-lab">BTTS rate</div></div>
                </div>
              </>
            ) : (
              <div className="empty"><p>No recorded meetings between these teams yet.</p></div>
            )}
          </div>
        </section>

        {/* Season trends (premium) */}
        <section className="card reveal">
          <div className="card-hd">
            <h3><span className="ic"><Icon name="history" size={16} /></span> Season Trends · {homeName}</h3>
            <span className="badge gold">Premium</span>
          </div>
          <div className="card-bd">
            {!isPremium ? (
              <div className="empty">
                <div className="em-ic"><Icon name="premium" size={26} /></div>
                <h4>Premium analytics</h4>
                <p>Multi-season points, goals and expected-goals trends are part of the Premium intelligence layer.</p>
                <Link href="/premium" className="btn btn-sm btn-gold" style={{ marginTop: 14 }}>Upgrade Premium</Link>
              </div>
            ) : trends.length === 0 ? (
              <div className="empty"><p>No trend data available for this team.</p></div>
            ) : (
              <>
                <ChartBox
                  deps={[homeId, trends.length]}
                  draw={(el) =>
                    IX.line(el, {
                      w: 540,
                      h: 180,
                      yLabels: true,
                      gy: 4,
                      xLabels: trends.map((t) => t.season.replace("20", "")),
                      xMax: trends.length - 1,
                      yMax: Math.max(...trends.map((t) => t.points)) * 1.15,
                      series: [{ color: IX.C.gold, area: true, endDot: true, data: trends.map((t, x) => ({ x, y: t.points })) }],
                    })
                  }
                />
                {(() => {
                  const t = trends[trends.length - 1];
                  return (
                    <div className="flex jcb" style={{ marginTop: 12 }}>
                      <div className="stat"><div className="stat-val" style={{ fontSize: 19 }}>{t.goalsFor}</div><div className="stat-lab">Goals for</div></div>
                      <div className="stat"><div className="stat-val" style={{ fontSize: 19, color: "var(--blue-2)" }}>{t.avgXgFor.toFixed(2)}</div><div className="stat-lab">Avg xG for</div></div>
                      <div className="stat"><div className="stat-val" style={{ fontSize: 19, color: "var(--green)" }}>{t.goalDifference > 0 ? "+" : ""}{t.goalDifference}</div><div className="stat-lab">Goal diff</div></div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </section>
      </div>
    </>
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
