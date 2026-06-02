/**
 * Thin fetch wrapper for the InsightXI API.
 * All UI data access goes through services like this one.
 */
import type {
  AdminFixture,
  AdminOverview,
  AdminTransaction,
  AdminUser,
  AppNotification,
  AuditEntry,
  AuthResponse,
  CheckoutSession,
  ConfirmResult,
  ContentPost,
  EvaluationReport,
  FeatureFlag,
  H2HSummary,
  League,
  MatchPrediction,
  MatchView,
  PaymentProvider,
  PlanResponse,
  PredictionsAdminView,
  PublicUser,
  SeasonTrend,
  SettingsView,
  StandingRow,
  SubscriptionsView,
  SupportTicket,
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

async function apiSend<T>(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body: unknown,
  token?: string,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!res.ok) {
    throw new ApiError(res.status, `API ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

const apiPost = <T>(path: string, body: unknown, token?: string) =>
  apiSend<T>("POST", path, body, token);
const apiPatch = <T>(path: string, body: unknown, token?: string) =>
  apiSend<T>("PATCH", path, body, token);
const apiDelete = <T>(path: string, token?: string) =>
  apiSend<T>("DELETE", path, undefined, token);

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

  // Admin console — every route requires an ADMIN bearer token.
  admin: {
    overview: (token: string) => apiGet<AdminOverview>("/admin/overview", token),
    users: (token: string) => apiGet<AdminUser[]>("/admin/users", token),
    subscriptions: (token: string) =>
      apiGet<SubscriptionsView>("/admin/subscriptions", token),
    predictions: (token: string) =>
      apiGet<PredictionsAdminView>("/admin/predictions", token),
    fixtures: (token: string) => apiGet<AdminFixture[]>("/admin/fixtures", token),
    content: (token: string) => apiGet<ContentPost[]>("/admin/content", token),
    support: (token: string) => apiGet<SupportTicket[]>("/admin/support", token),
    audit: (token: string) => apiGet<AuditEntry[]>("/admin/audit", token),
    settings: (token: string) => apiGet<SettingsView>("/admin/settings", token),

    // Write actions
    updateUser: (
      id: string,
      patch: { role?: AdminUser["role"]; plan?: AdminUser["plan"]; status?: AdminUser["status"] },
      token: string,
    ) => apiPatch<AdminUser>(`/admin/users/${id}`, patch, token),
    deleteUser: (id: string, token: string) =>
      apiDelete<{ deleted: boolean }>(`/admin/users/${id}`, token),
    setFlag: (key: string, enabled: boolean, token: string) =>
      apiPatch<FeatureFlag>(`/admin/settings/flags/${key}`, { enabled }, token),
    updateTicket: (
      id: string,
      patch: { status?: SupportTicket["status"]; assignee?: string },
      token: string,
    ) => apiPatch<SupportTicket>(`/admin/support/${id}`, patch, token),
    createPost: (input: { title: string; category?: string }, token: string) =>
      apiPost<ContentPost>("/admin/content", input, token),
    updatePost: (id: string, patch: { status?: ContentPost["status"] }, token: string) =>
      apiPatch<ContentPost>(`/admin/content/${id}`, patch, token),
    deletePost: (id: string, token: string) =>
      apiDelete<{ deleted: boolean }>(`/admin/content/${id}`, token),
    refundTransaction: (id: string, token: string) =>
      apiPost<AdminTransaction>(`/admin/subscriptions/${id}/refund`, {}, token),
  },
};

export const API_URL_PUBLIC = API_URL;
