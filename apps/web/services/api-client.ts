/**
 * Thin fetch wrapper for the InsightXI API.
 * All UI data access goes through services like this one.
 */
import type {
  League,
  MatchPrediction,
  MatchView,
  StandingRow,
} from "../lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  leagues: () => apiGet<League[]>("/leagues"),
  fixtures: (league?: string) =>
    apiGet<MatchView[]>(`/matches/fixtures${league ? `?league=${league}` : ""}`),
  results: (league?: string) =>
    apiGet<MatchView[]>(`/matches/results${league ? `?league=${league}` : ""}`),
  match: (id: string) => apiGet<MatchView>(`/matches/${id}`),
  standings: (leagueId: string, season?: string) =>
    apiGet<StandingRow[]>(
      `/statistics/standings/${leagueId}${season ? `?season=${season}` : ""}`,
    ),
  prediction: (matchId: string) =>
    apiGet<MatchPrediction>(`/predictions/match/${matchId}`),
};
