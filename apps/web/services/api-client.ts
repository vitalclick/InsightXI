/**
 * Thin fetch wrapper for the InsightXI API.
 * All UI data access goes through services like this one.
 */
import type {
  AuthResponse,
  EvaluationReport,
  H2HSummary,
  League,
  MatchPrediction,
  MatchView,
  SeasonTrend,
  StandingRow,
  TacticalMatchup,
} from "../lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Error carrying the HTTP status so callers can branch on 401/403. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new ApiError(res.status, `API ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(res.status, `API ${res.status}: ${res.statusText}`);
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
  tactical: (matchId: string) =>
    apiGet<TacticalMatchup>(`/tactical/match/${matchId}`),
  h2h: (home: string, away: string) =>
    apiGet<H2HSummary>(`/historical/h2h?home=${home}&away=${away}`),
  // Premium — requires a PREMIUM bearer token.
  trends: (teamId: string, token: string) =>
    apiGet<SeasonTrend[]>(`/historical/trends/${teamId}`, token),
  modelEvaluation: (token: string) =>
    apiGet<EvaluationReport>("/model-health/evaluation", token),
  login: (email: string, password: string) =>
    apiPost<AuthResponse>("/auth/login", { email, password }),
  register: (email: string, password: string) =>
    apiPost<AuthResponse>("/auth/register", { email, password }),
};

export const API_URL_PUBLIC = API_URL;
