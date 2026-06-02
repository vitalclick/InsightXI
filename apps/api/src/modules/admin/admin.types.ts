/**
 * Typed payloads for the InsightXI admin console. These mirror the screens in
 * the design prototype (design/InsightXI Admin.html) and are produced by the
 * AdminService — real account data where available, deterministic demo data
 * for editorial/support/audit surfaces until those subsystems land.
 */

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
  plan: "Premium" | "Trial" | "Free";
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
  plan: "Premium" | "Trial" | "Free";
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
  plan: "Premium" | "Trial" | "Free";
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

export interface PredictionsView {
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
