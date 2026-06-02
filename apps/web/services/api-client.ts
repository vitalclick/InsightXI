/**
 * Thin fetch wrapper for the InsightXI API.
 * All UI data access goes through services like this one.
 */
import type {
  AppNotification,
  AuthResponse,
  CheckoutSession,
  ConfirmResult,
  EvaluationReport,
  H2HSummary,
  League,
  MatchPrediction,
  MatchView,
  PaymentProvider,
  PlanResponse,
  PublicUser,
  SeasonTrend,
  StandingRow,
  TacticalMatchup,
  Team,
  TeamProfile,
  TeamRatings,
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

async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(res.status, `API ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function apiDelete<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `API ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/** Optional currency/country hints for localized pricing. */
function planQuery(hints?: { currency?: string; country?: string }): string {
  const params = new URLSearchParams();
  if (hints?.currency) params.set("currency", hints.currency);
  if (hints?.country) params.set("country", hints.country);
  const q = params.toString();
  return q ? `?${q}` : "";
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
  tacticalMatchup: (home: string, away: string) =>
    apiGet<TacticalMatchup>(`/tactical/matchup?home=${home}&away=${away}`),
  teams: (league?: string) =>
    apiGet<Team[]>(`/teams${league ? `?league=${league}` : ""}`),
  teamProfile: (id: string) => apiGet<TeamProfile>(`/teams/${id}`),
  ratings: (leagueId: string) => apiGet<TeamRatings[]>(`/analytics/ratings/${leagueId}`),
  teamRatings: (teamId: string) => apiGet<TeamRatings>(`/analytics/team/${teamId}`),
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
  oauthGoogle: (idToken: string) =>
    apiPost<AuthResponse>("/auth/oauth/google", { idToken }),
  oauthApple: (idToken: string, name?: string) =>
    apiPost<AuthResponse>("/auth/oauth/apple", { idToken, name }),
  me: (token: string) => apiGet<PublicUser>("/auth/me", token),
  exportAccount: (token: string) =>
    apiGet<Record<string, unknown>>("/auth/account/export", token),
  deleteAccount: (token: string) =>
    apiDelete<{ deleted: true }>("/auth/account", token),

  // In-app notifications (all require a bearer token).
  notifications: (token: string) =>
    apiGet<AppNotification[]>("/notifications", token),
  notificationsUnread: (token: string) =>
    apiGet<{ count: number }>("/notifications/unread-count", token),
  markNotificationRead: (id: string, token: string) =>
    apiPost<{ ok: boolean }>(`/notifications/${id}/read`, {}, token),
  markAllNotificationsRead: (token: string) =>
    apiPost<{ ok: true }>("/notifications/read-all", {}, token),

  refresh: (refreshToken: string) =>
    apiPost<AuthResponse>("/auth/refresh", { refreshToken }),
  verifyEmail: (token: string) =>
    apiPost<{ verified: boolean; user: PublicUser }>("/auth/verify-email", { token }),
  resendVerification: (token: string) =>
    apiPost<{ sent: boolean; alreadyVerified: boolean }>(
      "/auth/resend-verification",
      {},
      token,
    ),
  forgotPassword: (email: string) =>
    apiPost<{ ok: true }>("/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    apiPost<AuthResponse>("/auth/reset-password", { token, password }),

  // Billing — localized Premium pricing + checkout (PayPal/Paystack/Flutterwave).
  plan: (hints?: { currency?: string; country?: string }) =>
    apiGet<PlanResponse>(`/payments/plan${planQuery(hints)}`),
  checkout: (
    provider: PaymentProvider,
    token: string,
    hints?: { currency?: string; country?: string },
  ) => apiPost<CheckoutSession>("/payments/checkout", { provider, ...hints }, token),
  confirmPayment: (provider: PaymentProvider, reference: string, token: string) =>
    apiPost<ConfirmResult>("/payments/confirm", { provider, reference }, token),
};

export const API_URL_PUBLIC = API_URL;
