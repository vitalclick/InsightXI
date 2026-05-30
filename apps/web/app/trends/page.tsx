"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api, ApiError } from "../../services/api-client";
import { useAuthStore } from "../../store/auth-store";
import { Sparkline } from "../../components/charts/sparkline";
import type { SeasonTrend } from "../../lib/types";

function TrendCards({ data }: { data: SeasonTrend[] }) {
  const points = data.map((t) => t.points);
  const gd = data.map((t) => t.goalDifference);
  const xgFor = data.map((t) => t.avgXgFor);
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <TrendCard label="Points" value={points.at(-1)} series={points} color="#22c55e" />
      <TrendCard label="Goal difference" value={gd.at(-1)} series={gd} color="#3b82f6" />
      <TrendCard label="Avg xG for" value={xgFor.at(-1)} series={xgFor} color="#a855f7" />
    </div>
  );
}

function TrendCard({
  label,
  value,
  series,
  color,
}: {
  label: string;
  value: number | undefined;
  series: number[];
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-wide text-white/50">{label}</div>
      <div className="mt-1 flex items-end justify-between">
        <span className="text-2xl font-bold tabular-nums">{value ?? "—"}</span>
        <Sparkline values={series} color={color} />
      </div>
      <div className="mt-1 text-[11px] text-white/40">latest season · trend</div>
    </div>
  );
}

export default function TrendsPage() {
  const { token, user } = useAuthStore();
  const [teamId, setTeamId] = useState("ars");

  const { data, isLoading, error } = useQuery({
    queryKey: ["trends", teamId, token],
    queryFn: () => api.trends(teamId, token ?? ""),
    enabled: Boolean(token),
    retry: 0,
  });

  const forbidden =
    error instanceof ApiError && (error.status === 403 || error.status === 401);

  return (
    <main className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Historical Trends</h1>
        <span className="rounded-full bg-signal/20 px-3 py-1 text-xs font-semibold text-signal">
          PREMIUM
        </span>
      </div>

      {!token && (
        <UpgradeNotice
          title="Sign in to view historical trends"
          body="Multi-season trend analysis is part of InsightXI Premium."
        />
      )}

      {token && forbidden && (
        <UpgradeNotice
          title="Premium subscription required"
          body={`You're signed in as ${user?.email} (${user?.tier}). Upgrade to Premium to unlock multi-season trends.`}
        />
      )}

      {token && !forbidden && (
        <>
          <input
            value={teamId}
            onChange={(e) => setTeamId(e.target.value.toLowerCase())}
            placeholder="Team id (e.g. ars, mci, rma)"
            className="max-w-xs rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-insight"
          />
          {isLoading ? (
            <p className="text-white/40">Loading…</p>
          ) : data && data.length > 0 ? (
            <>
            <TrendCards data={data} />
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-left text-xs uppercase text-white/50">
                  <tr>
                    <th className="px-3 py-2">Season</th>
                    <th className="px-2 py-2 text-center">P</th>
                    <th className="px-2 py-2 text-center">Pts</th>
                    <th className="px-2 py-2 text-center">GF</th>
                    <th className="px-2 py-2 text-center">GA</th>
                    <th className="px-2 py-2 text-center">GD</th>
                    <th className="px-2 py-2 text-center">xGF</th>
                    <th className="px-2 py-2 text-center">xGA</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((t) => (
                    <tr key={t.season} className="border-t border-white/5">
                      <td className="px-3 py-2 font-medium">{t.season}</td>
                      <td className="px-2 py-2 text-center">{t.played}</td>
                      <td className="px-2 py-2 text-center font-bold">
                        {t.points}
                      </td>
                      <td className="px-2 py-2 text-center">{t.goalsFor}</td>
                      <td className="px-2 py-2 text-center">{t.goalsAgainst}</td>
                      <td className="px-2 py-2 text-center tabular-nums">
                        {t.goalDifference > 0
                          ? `+${t.goalDifference}`
                          : t.goalDifference}
                      </td>
                      <td className="px-2 py-2 text-center text-white/60">
                        {t.avgXgFor}
                      </td>
                      <td className="px-2 py-2 text-center text-white/60">
                        {t.avgXgAgainst}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          ) : null}
        </>
      )}
    </main>
  );
}

function UpgradeNotice({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-insight/30 bg-insight/10 p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-white/60">{body}</p>
      <Link
        href="/account"
        className="mt-4 inline-block rounded-lg bg-insight px-4 py-2 text-sm font-medium"
      >
        Go to account
      </Link>
    </div>
  );
}
