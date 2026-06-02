// Web-side view of the API domain model (kept light; mirrors @insightxi/api).

export type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED";

export interface League {
  id: string;
  name: string;
  country: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  leagueId: string;
}

export interface TeamProfile extends Team {
  recentForm: string[];
  played: number;
  goalsFor: number;
  goalsAgainst: number;
  avgXgFor: number;
  avgXgAgainst: number;
}

export interface TeamRatings {
  teamId: string;
  name: string;
  elo: number;
  attackStrength: number;
  defenseStrength: number;
  recentFormPoints: number;
  avgXgFor: number;
  avgXgAgainst: number;
}

export interface MatchView {
  id: string;
  leagueId: string;
  season: string;
  matchday: number;
  utcDate: string;
  status: MatchStatus;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeGoals: number | null;
  awayGoals: number | null;
  homeXg: number | null;
  awayXg: number | null;
}

export interface StandingRow {
  position: number;
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];
}

export interface MarketProbability {
  market: string;
  label: string;
  probability: number;
}

export interface MatchPrediction {
  matchId: string;
  outcome: { homeWin: number; draw: number; awayWin: number };
  expectedGoals: { home: number; away: number };
  markets: MarketProbability[];
  confidenceLevel: string;
  topSelection: { label: string; probability: number };
  explanations: string[];
  modelBackend: string;
  /** Whether the Adaptive Intelligence Engine shaped this prediction. */
  adaptive?: boolean;
  /** Human-readable record of any learned blend/calibration adjustments. */
  adjustmentTrace?: string[];
}

export interface TacticalProfile {
  teamId: string;
  name: string;
  formation: string;
  possession: number;
  pressingIntensity: number;
  defensiveLine: string;
  attackingFlow: string;
  transitionStyle: string;
}

export interface TacticalMatchup {
  home: TacticalProfile;
  away: TacticalProfile;
  tacticalEdge: number;
  insights: string[];
}

export type SubscriptionTier = "FREE" | "PREMIUM";
export type AuthProvider = "email" | "google" | "apple";
export type SubscriptionStatus = "none" | "active" | "expired" | "canceled";
export type UserRole = "USER" | "ADMIN";

export interface PublicUser {
  id: string;
  email: string;
  tier: SubscriptionTier;
  role: UserRole;
  suspended: boolean;
  name: string | null;
  avatarUrl: string | null;
  provider: AuthProvider;
  emailVerified: boolean;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

export type NotificationType = "welcome" | "premium" | "system" | "match";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export type PaymentProvider = "paypal" | "paystack" | "flutterwave";

export interface LocalizedPrice {
  amount: number;
  currency: string;
  symbol: string;
  display: string;
  estimated: boolean;
}

export interface LocalizedPlan {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  interval: string;
  periodDays: number;
  features: string[];
  capabilities: string[];
  country: string;
  base: LocalizedPrice;
  local: LocalizedPrice;
}

export interface PlanResponse {
  plan: LocalizedPlan;
  providers: Record<PaymentProvider, boolean>;
  paypalClientId: string | null;
}

export interface CheckoutSession {
  provider: PaymentProvider;
  reference: string;
  authorizationUrl: string | null;
  providerReference?: string;
  amount: number;
  currency: string;
  sandbox: boolean;
  display: string;
}

export interface ConfirmResult {
  status: "active" | "pending";
  auth?: AuthResponse;
}

export interface H2HSummary {
  teamA: string;
  teamB: string;
  played: number;
  teamAWins: number;
  teamBWins: number;
  draws: number;
  avgGoalsPerGame: number;
  bttsRate: number;
}

export interface SeasonTrend {
  season: string;
  played: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  avgXgFor: number;
  avgXgAgainst: number;
}

export interface ModelMetrics {
  feature_version?: string;
  features?: string[];
  calibrated?: boolean;
  n_train?: number;
  n_test?: number;
  n?: number;
  log_loss?: number;
  brier?: number;
  accuracy?: number;
  ece?: number;
  reliability?: ReliabilityBin[];
}

export interface ReliabilityBin {
  /** Mean predicted (top-class) confidence in the bin. */
  confidence: number;
  /** Empirical accuracy of predictions in the bin. */
  accuracy: number;
  /** Number of predictions in the bin. */
  count: number;
}

export interface EvaluationReport {
  status: string;
  report: ModelMetrics | null;
}

export interface LiveEvent {
  minute: number;
  type: "GOAL" | "KICKOFF" | "FULLTIME";
  teamId?: string;
  text: string;
}

export interface LiveSnapshot {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  minute: number;
  homeGoals: number;
  awayGoals: number;
  homeXg: number;
  awayXg: number;
  momentum: number;
  status: "LIVE" | "FINISHED";
  events: LiveEvent[];
}

// ── Admin console (mirrors apps/api admin.types.ts) ──────────────────────────
export type AdminPlan = "Premium" | "Trial" | "Free";

export interface AdminKpis {
  totalUsers: number;
  premium: number;
  trialing: number;
  free: number;
  mrr: number;
  arr: number;
  accuracy: number;
  activeNow: number;
  churn: number;
  arpu: number;
  dau: number;
  openTickets: number;
  picksToday: number;
}

export interface AdminSeries {
  userGrowth: number[];
  revenue: number[];
  accuracy: number[];
  activeHourly: number[];
}

export interface PlanSlice {
  plan: AdminPlan;
  count: number;
  pct: number;
}

export interface HealthRow {
  label: string;
  value: string;
  status: "ok" | "warn" | "down" | "info";
}

export interface AdminSignup {
  id: string;
  name: string;
  email: string;
  plan: AdminPlan;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  ip: string;
  at: string;
}

export interface AdminOverview {
  kpis: AdminKpis;
  series: AdminSeries;
  planDistribution: PlanSlice[];
  recentSignups: AdminSignup[];
  recentActivity: AuditEntry[];
  health: HealthRow[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  plan: AdminPlan;
  status: "Active" | "Pending" | "Suspended";
  role: "User" | "Analyst" | "Admin";
  country: string;
  cc: string;
  verified: boolean;
  predictions: number;
  logins: number;
  spend: number;
  flagged: boolean;
  signup: string;
  lastSeen: string;
}

export interface AdminTransaction {
  id: string;
  userName: string;
  email: string;
  plan: "Monthly" | "Annual";
  amount: number;
  status: "Paid" | "Failed" | "Refunded";
  method: string;
  date: string;
}

export interface SubscriptionsView {
  summary: {
    mrr: number;
    arr: number;
    activeSubs: number;
    trialing: number;
    churn: number;
    arpu: number;
  };
  transactions: AdminTransaction[];
}

export interface ModelPick {
  id: string;
  home: string;
  away: string;
  market: string;
  pick: string;
  confidence: number;
  result: "Hit" | "Miss" | "Pending";
  model: string;
  date: string;
}

export interface PredictionsAdminView {
  model: {
    version: string;
    accuracy: number;
    brier: number;
    logLoss: number;
    lastTrained: string;
    picksToday: number;
  };
  picks: ModelPick[];
}

export interface AdminFixture {
  id: string;
  league: string;
  home: string;
  away: string;
  kickoff: string;
  status: string;
  featured: boolean;
}

export interface ContentPost {
  id: string;
  title: string;
  category: string;
  status: "Published" | "Scheduled" | "Draft";
  author: string;
  views: number;
  date: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  status: "Open" | "Pending" | "Closed";
  requester: string;
  assignee: string;
  date: string;
}

export interface TeamMember {
  name: string;
  email: string;
  role: string;
  lastSeen: string;
}

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface SettingsView {
  team: TeamMember[];
  flags: FeatureFlag[];
}
