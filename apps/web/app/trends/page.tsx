"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api, ApiError } from "../../services/api-client";
import { useAuthStore } from "../../store/auth-store";

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
          ) : data ? (
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
