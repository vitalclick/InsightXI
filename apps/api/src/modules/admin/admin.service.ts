import { Injectable, NotFoundException } from "@nestjs/common";
import { UsersService } from "../auth/users.service";
import { MatchesService } from "../matches/matches.service";
import {
  AdminFixture,
  AdminOverview,
  AdminTransaction,
  AdminUser,
  AuditEntry,
  ContentPost,
  FeatureFlag,
  ModelPick,
  PredictionsView,
  SettingsView,
  SubscriptionsView,
  SupportTicket,
} from "./admin.types";

/** Deterministic [0,1) pseudo-random from an integer seed (matches the design prototype). */
function rng(s: number): number {
  const x = Math.sin(s) * 10000;
  return x - Math.floor(x);
}
function pick<T>(arr: readonly T[], s: number): T {
  return arr[Math.floor(rng(s) * arr.length)];
}
/** A fixed "now" so the seeded dataset is stable across requests. */
const NOW = new Date("2026-05-31T12:00:00Z");
function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * 86_400_000).toISOString();
}
function minsAgo(n: number): string {
  return new Date(NOW.getTime() - n * 60_000).toISOString();
}

const FIRST = [
  "Liam", "Olivia", "Noah", "Emma", "Arjun", "Priya", "Wei", "Mei", "Sofia",
  "Mateo", "Yuki", "Aisha", "Omar", "Lucas", "Chloe", "Ethan", "Ava", "Zara",
  "Ravi", "Ananya", "Diego", "Camila", "Elena", "Felix", "Nora", "Idris",
  "Fatima", "Kwame", "Sven", "Ingrid", "Marco", "Giulia", "Hassan", "Layla",
];
const LAST = [
  "Patel", "Smith", "Nguyen", "Kim", "Garcia", "Rossi", "Tanaka", "Khan",
  "Mueller", "Silva", "Johnson", "Wang", "Okafor", "Andersson", "Costa",
  "Haddad", "Dubois", "Ivanov", "Santos", "Reyes", "Park", "Bauer", "Larsen",
  "Romano", "Yilmaz", "Novak", "Walsh", "Mensah", "Cohen", "Fischer",
];
const COUNTRIES: [string, string][] = [
  ["GB", "United Kingdom"], ["US", "United States"], ["IN", "India"],
  ["NG", "Nigeria"], ["BR", "Brazil"], ["DE", "Germany"], ["JP", "Japan"],
  ["ES", "Spain"], ["FR", "France"], ["ZA", "South Africa"], ["AU", "Australia"],
  ["CA", "Canada"], ["NL", "Netherlands"], ["IT", "Italy"], ["AE", "UAE"],
];

/** Partial change set the admin UI can apply to an account row. */
export interface UserPatch {
  role?: AdminUser["role"];
  plan?: AdminUser["plan"];
  status?: AdminUser["status"];
}

/**
 * Admin console backend. Read models blend real account/match data with a
 * deterministic demo dataset; write actions mutate session-scoped state and
 * append to a live audit log (real accounts persist through UsersService).
 *
 * The demo collections are cached on construction so that edits made during a
 * session stick (they reset when the process restarts — the same offline-seed
 * contract the rest of the platform uses until a database is wired in).
 */
@Injectable()
export class AdminService {
  private readonly demoCohort: AdminUser[];
  private readonly tickets: SupportTicket[];
  private readonly posts: ContentPost[];
  private readonly flags: FeatureFlag[];
  private readonly transactions: AdminTransaction[];
  private readonly auditLog: AuditEntry[];

  constructor(
    private readonly users: UsersService,
    private readonly matches: MatchesService,
  ) {
    this.demoCohort = this.buildDemoUsers();
    this.tickets = this.buildTickets(this.demoCohort);
    this.posts = this.buildPosts();
    this.flags = this.buildFlags();
    this.transactions = this.buildTransactions(this.demoCohort);
    this.auditLog = this.buildAudit();
  }

  // ── Seed builders (run once) ────────────────────────────────────────────
  private buildDemoUsers(): AdminUser[] {
    const plans = ["Free", "Free", "Free", "Premium", "Premium", "Trial"] as const;
    const statuses = ["Active", "Active", "Active", "Active", "Pending", "Suspended"] as const;
    const roles = ["User", "User", "User", "User", "Analyst", "Admin"] as const;
    const domains = ["gmail.com", "outlook.com", "proton.me", "icloud.com", "yahoo.com"];
    const out: AdminUser[] = [];
    for (let i = 0; i < 48; i++) {
      const s = i * 13 + 7;
      const fn = pick(FIRST, s);
      const ln = pick(LAST, s * 2 + 1);
      const name = `${fn} ${ln}`;
      const plan = pick(plans, s * 3 + 2);
      const status = pick(statuses, s * 5 + 3);
      const role = pick(roles, s * 7 + 4);
      const [cc, country] = pick(COUNTRIES, s * 11 + 5);
      const signupDays = 2 + Math.floor(rng(s * 17 + 6) * 700);
      const lastMins =
        status === "Suspended"
          ? 1440 * (8 + Math.floor(rng(s) * 40))
          : Math.floor(rng(s * 19 + 7) * 1440 * 6);
      const predictions = Math.floor(rng(s * 23 + 8) * (plan === "Free" ? 90 : 540)) + 4;
      const logins = Math.floor(rng(s * 29 + 9) * 220) + 3;
      const spend = plan === "Premium" ? (rng(s * 31) > 0.6 ? 79 : 9.99) : 0;
      out.push({
        id: `usr_${1042 + i}`,
        name,
        email:
          `${fn}.${ln}`.toLowerCase().replace(/[^a-z.]/g, "") +
          "@" +
          pick(domains, s),
        plan,
        status,
        role,
        country,
        cc,
        verified: rng(s * 43) > 0.12,
        predictions,
        logins,
        spend: +spend.toFixed(2),
        flagged: rng(s * 37 + 11) > 0.88,
        signup: daysAgo(signupDays),
        lastSeen: minsAgo(lastMins),
      });
    }
    return out;
  }

  private buildTickets(allUsers: AdminUser[]): SupportTicket[] {
    const subjects: [string, string, SupportTicket["priority"]][] = [
      ["Premium not unlocking after payment", "Billing", "High"],
      ["Confidence board not loading on iOS", "Bug", "High"],
      ["Request: export picks to CSV", "Feature", "Low"],
      ["Wrong scoreline shown for live match", "Data", "Medium"],
      ["Cancel subscription and refund", "Billing", "Medium"],
      ["Login link expired", "Account", "Low"],
      ["Push notifications not arriving", "Bug", "Medium"],
      ["Annual plan discount not applied", "Billing", "High"],
      ["Add La Liga coverage", "Feature", "Low"],
      ["Radar chart overlaps on tablet", "Bug", "Low"],
      ["Duplicate charge this month", "Billing", "High"],
      ["How is model accuracy calculated?", "Question", "Low"],
    ];
    const assignees = ["Alex Mercer", "Priya Raman", "Daniel Cole", "Sara Lindqvist"];
    const closed = ["Open", "Pending", "Closed"] as const;
    return subjects.map((t, i) => {
      const s = i * 17 + 3;
      const requester = allUsers[(i * 5 + 2) % allUsers.length];
      return {
        id: `TKT-${2100 + i}`,
        subject: t[0],
        category: t[1],
        priority: t[2],
        status: i < 7 ? pick(["Open", "Pending", "Open"] as const, s) : pick(closed, s),
        requester: requester?.name ?? "Unknown",
        assignee: i % 3 === 0 ? "Unassigned" : assignees[i % assignees.length],
        date: daysAgo(Math.floor(rng(s) * 12)),
      };
    });
  }

  private buildPosts(): ContentPost[] {
    const posts: [string, string, ContentPost["status"], number][] = [
      ["The pressing revolution: how counter-press wins titles", "Tactical", "Published", 18_400],
      ["xG explained: reading the model behind the numbers", "Analytics", "Published", 24_100],
      ["Five clubs overperforming their underlying data", "Trends", "Published", 12_800],
      ["Set-piece intelligence: the hidden 41%", "Tactical", "Scheduled", 0],
      ["Fatigue modelling and the congested fixture list", "Analytics", "Draft", 0],
      ["Matchday 31 preview: every confidence pick", "Preview", "Published", 9_600],
      ["How we calibrate confidence at InsightXI", "Product", "Draft", 0],
      ["Transition defence: the metric nobody tracks", "Tactical", "Published", 7_300],
    ];
    const authors = ["Alex Mercer", "Priya Raman", "Daniel Cole", "Sara Lindqvist"];
    return posts.map((p, i) => ({
      id: `post_${300 + i}`,
      title: p[0],
      category: p[1],
      status: p[2],
      views: p[3],
      author: authors[i % authors.length],
      date: daysAgo(Math.floor(rng(i * 7 + 2) * 40)),
    }));
  }

  private buildFlags(): FeatureFlag[] {
    return [
      { key: "live_winprob", name: "Live win-probability tracker", description: "Real-time stacked win-prob on live matches", enabled: true },
      { key: "mobile_pwa", name: "Mobile PWA install prompt", description: "Show add-to-home-screen banner", enabled: true },
      { key: "confidence_v2", name: "Confidence board v2", description: "New confidence ranking algorithm", enabled: false },
      { key: "laliga", name: "La Liga coverage", description: "Enable Spanish top-flight fixtures", enabled: false },
      { key: "ai_assistant", name: "AI match assistant (beta)", description: "Conversational match intel", enabled: true },
    ];
  }

  private buildTransactions(allUsers: AdminUser[]): AdminTransaction[] {
    const paying = allUsers.filter((u) => u.plan === "Premium" || u.plan === "Trial");
    const methods = ["Visa ··4291", "Mastercard ··8830", "PayPal", "Apple Pay"];
    const statuses = ["Paid", "Paid", "Paid", "Paid", "Failed", "Refunded"] as const;
    const out: AdminTransaction[] = paying.slice(0, 24).map((u, i) => {
      const s = i * 9 + 3;
      const annual = rng(s) > 0.6;
      return {
        id: `in_${9100 + i}`,
        userName: u.name,
        email: u.email,
        plan: annual ? "Annual" : "Monthly",
        amount: annual ? 79 : 9.99,
        status: pick(statuses, s * 3 + 1),
        method: pick(methods, s),
        date: daysAgo(Math.floor(rng(s * 5) * 60)),
      };
    });
    out.sort((a, b) => b.date.localeCompare(a.date));
    return out;
  }

  private buildAudit(): AuditEntry[] {
    const actions: [string, string][] = [
      ["suspended user", "usr_1058"],
      ["changed plan to Premium", "usr_1071"],
      ["published post", "post_300"],
      ["refunded invoice", "in_9104"],
      ["edited fixture", "RVS v KGT"],
      ["featured match of the day", "RVS v KGT"],
      ["invited team member", "sara@insightxi.app"],
      ["updated role to Analyst", "usr_1063"],
      ["closed ticket", "TKT-2103"],
      ["exported users CSV", "64 records"],
      ["toggled feature flag", "live_winprob"],
      ["deleted draft", "post_307"],
      ["sent broadcast", "12,480 users"],
      ["impersonated user", "usr_1049"],
      ["retrained model", "v4.2"],
    ];
    const admins = ["Alex Mercer", "Priya Raman", "Daniel Cole"];
    return actions.map((a, i) => ({
      id: `log_${i}`,
      actor: admins[i % admins.length],
      action: a[0],
      target: a[1],
      ip: `102.0.${10 + i}.${(i * 7) % 250}`,
      at: minsAgo(i * 47 + Math.floor(rng(i * 3) * 40)),
    }));
  }

  /** Prepends an entry to the live audit log. */
  private recordAudit(actor: string, action: string, target: string): AuditEntry {
    const entry: AuditEntry = {
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      actor,
      action,
      target,
      ip: "internal",
      at: new Date().toISOString(),
    };
    this.auditLog.unshift(entry);
    return entry;
  }

  /** Real registered accounts mapped into the admin row shape. */
  private async realUsers(): Promise<AdminUser[]> {
    const accounts = await this.users.listPublic();
    return accounts.map((u, i) => ({
      id: u.id,
      name: u.name ?? u.email.split("@")[0],
      email: u.email,
      plan: u.tier === "PREMIUM" ? "Premium" : "Free",
      status: u.suspended ? "Suspended" : "Active",
      role: u.role === "ADMIN" ? "Admin" : "User",
      country: "—",
      cc: "",
      verified: u.emailVerified,
      predictions: 0,
      logins: 1,
      spend: 0,
      flagged: false,
      signup: daysAgo(i),
      lastSeen: minsAgo(i * 3),
    }));
  }

  async listUsers(): Promise<AdminUser[]> {
    return [...(await this.realUsers()), ...this.demoCohort];
  }

  // ── Read models ─────────────────────────────────────────────────────────
  async overview(): Promise<AdminOverview> {
    const all = await this.listUsers();
    const premium = all.filter((u) => u.plan === "Premium").length;
    const trialing = all.filter((u) => u.plan === "Trial").length;
    const free = all.length - premium - trialing;
    const totalUsers = 12_480 + (all.length - this.demoCohort.length);
    const mrr = 28_400;

    const recentSignups = [...all]
      .sort((a, b) => b.signup.localeCompare(a.signup))
      .slice(0, 6)
      .map((u) => ({ id: u.id, name: u.name, email: u.email, plan: u.plan }));

    return {
      kpis: {
        totalUsers,
        premium: 3210,
        trialing: 412,
        free: totalUsers - 3210 - 412,
        mrr,
        arr: mrr * 12,
        accuracy: 73.4,
        activeNow: 842,
        churn: 2.1,
        arpu: 8.85,
        dau: 4120,
        openTickets: this.tickets.filter((t) => t.status !== "Closed").length,
        picksToday: 24,
      },
      series: {
        userGrowth: [820, 905, 980, 1120, 1240, 1390, 1510, 1680, 1820, 2010, 2240, 2480],
        revenue: [9.2, 11.0, 12.4, 13.1, 14.8, 16.2, 17.9, 19.4, 21.2, 23.8, 26.1, 28.4],
        accuracy: [69.1, 70.2, 69.8, 71.4, 70.9, 72.1, 71.8, 72.9, 73.0, 72.6, 73.2, 73.4],
        activeHourly: [120, 90, 60, 48, 70, 180, 320, 480, 540, 610, 720, 842, 790, 700, 640],
      },
      planDistribution: [
        { plan: "Premium", count: premium, pct: Math.round((premium / all.length) * 100) },
        { plan: "Trial", count: trialing, pct: Math.round((trialing / all.length) * 100) },
        { plan: "Free", count: free, pct: Math.round((free / all.length) * 100) },
      ],
      recentSignups,
      recentActivity: this.auditLog.slice(0, 6),
      health: [
        { label: "Model API", value: "200 OK", status: "ok" },
        { label: "Prediction latency", value: "142 ms", status: "info" },
        { label: "Live data feed", value: "Connected", status: "ok" },
        { label: "Background jobs", value: "3 running", status: "info" },
        { label: "Last model run", value: "v4.2 · 2h ago", status: "info" },
        { label: "Error rate (24h)", value: "0.04%", status: "ok" },
      ],
    };
  }

  subscriptions(): SubscriptionsView {
    return {
      summary: {
        mrr: 28_400,
        arr: 340_800,
        activeSubs: 3210,
        trialing: 412,
        churn: 2.1,
        arpu: 8.85,
      },
      transactions: this.transactions,
    };
  }

  predictions(): PredictionsView {
    const markets = ["Match result", "Over 2.5", "BTTS", "Double chance", "Over 1.5"];
    const results = ["Hit", "Hit", "Hit", "Miss", "Pending", "Pending"] as const;
    const fixtures = this.matches.results(undefined, 18);
    const picks: ModelPick[] = fixtures.slice(0, 18).map((m, i) => {
      const s = i * 11 + 5;
      const conf = 55 + Math.floor(rng(s * 3 + 2) * 32);
      return {
        id: `pk_${4400 + i}`,
        home: m.homeTeamName,
        away: m.awayTeamName,
        market: pick(markets, s * 7 + 4),
        pick: rng(s) > 0.5 ? m.homeTeamName : "Yes",
        confidence: conf,
        result: i < 4 ? "Pending" : pick(results, s * 5 + 3),
        model: "v4.2",
        date: daysAgo(Math.floor(rng(s * 13) * 14)),
      };
    });
    return {
      model: {
        version: "v4.2",
        accuracy: 73.4,
        brier: 0.187,
        logLoss: 0.561,
        lastTrained: minsAgo(120),
        picksToday: 24,
      },
      picks,
    };
  }

  fixtures(): AdminFixture[] {
    const upcoming = this.matches.fixtures(undefined, 14);
    const recent = this.matches.results(undefined, 6);
    const toRow = (
      m: ReturnType<MatchesService["fixtures"]>[number],
      i: number,
    ): AdminFixture => ({
      id: m.id,
      league: m.leagueId.toUpperCase(),
      home: m.homeTeamName,
      away: m.awayTeamName,
      kickoff: m.utcDate,
      status: m.status,
      featured: i === 0,
    });
    return [...upcoming.map(toRow), ...recent.map((m, i) => toRow(m, i + 100))];
  }

  content(): ContentPost[] {
    return this.posts;
  }

  support(): SupportTicket[] {
    return this.tickets;
  }

  audit(): AuditEntry[] {
    return this.auditLog;
  }

  settings(): SettingsView {
    return {
      team: [
        { name: "Alex Mercer", email: "alex@insightxi.app", role: "Owner", lastSeen: minsAgo(0) },
        { name: "Priya Raman", email: "priya@insightxi.app", role: "Admin", lastSeen: minsAgo(120) },
        { name: "Daniel Cole", email: "daniel@insightxi.app", role: "Editor", lastSeen: minsAgo(1440) },
        { name: "Sara Lindqvist", email: "sara@insightxi.app", role: "Analyst", lastSeen: daysAgo(3) },
        { name: "Marco Romano", email: "marco@insightxi.app", role: "Support", lastSeen: minsAgo(300) },
      ],
      flags: this.flags,
    };
  }

  // ── Write actions ───────────────────────────────────────────────────────
  /** Update an account's role/plan/status. Real accounts persist; demo rows are session-scoped. */
  async updateUser(actor: string, id: string, patch: UserPatch): Promise<AdminUser> {
    const demo = this.demoCohort.find((u) => u.id === id);
    if (demo) {
      if (patch.role) demo.role = patch.role;
      if (patch.plan) demo.plan = patch.plan;
      if (patch.status) demo.status = patch.status;
      this.auditFor(actor, patch, id);
      return demo;
    }
    // Real account → persist through UsersService.
    const updated = await this.users.adminUpdate(id, {
      role: patch.role === "Admin" ? "ADMIN" : patch.role ? "USER" : undefined,
      tier: patch.plan === "Premium" ? "PREMIUM" : patch.plan ? "FREE" : undefined,
      suspended:
        patch.status === "Suspended" ? true : patch.status === "Active" ? false : undefined,
    });
    if (!updated) throw new NotFoundException(`User ${id} not found`);
    this.auditFor(actor, patch, id);
    return {
      id: updated.id,
      name: updated.name ?? updated.email.split("@")[0],
      email: updated.email,
      plan: updated.tier === "PREMIUM" ? "Premium" : "Free",
      status: updated.suspended ? "Suspended" : "Active",
      role: updated.role === "ADMIN" ? "Admin" : "User",
      country: "—",
      cc: "",
      verified: updated.emailVerified,
      predictions: 0,
      logins: 1,
      spend: 0,
      flagged: false,
      signup: daysAgo(0),
      lastSeen: minsAgo(0),
    };
  }

  private auditFor(actor: string, patch: UserPatch, id: string): void {
    if (patch.status === "Suspended") this.recordAudit(actor, "suspended user", id);
    else if (patch.status === "Active") this.recordAudit(actor, "reactivated user", id);
    if (patch.plan) this.recordAudit(actor, `changed plan to ${patch.plan}`, id);
    if (patch.role) this.recordAudit(actor, `updated role to ${patch.role}`, id);
  }

  /** Permanently delete an account (real or demo). */
  async deleteUser(actor: string, id: string): Promise<{ deleted: boolean }> {
    const idx = this.demoCohort.findIndex((u) => u.id === id);
    if (idx >= 0) {
      this.demoCohort.splice(idx, 1);
      this.recordAudit(actor, "deleted user", id);
      return { deleted: true };
    }
    const deleted = await this.users.remove(id);
    if (!deleted) throw new NotFoundException(`User ${id} not found`);
    this.recordAudit(actor, "deleted user", id);
    return { deleted: true };
  }

  setFlag(actor: string, key: string, enabled: boolean): FeatureFlag {
    const flag = this.flags.find((f) => f.key === key);
    if (!flag) throw new NotFoundException(`Flag ${key} not found`);
    flag.enabled = enabled;
    this.recordAudit(actor, `${enabled ? "enabled" : "disabled"} feature flag`, key);
    return flag;
  }

  updateTicket(
    actor: string,
    id: string,
    patch: { status?: SupportTicket["status"]; assignee?: string },
  ): SupportTicket {
    const ticket = this.tickets.find((t) => t.id === id);
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    if (patch.status) {
      ticket.status = patch.status;
      this.recordAudit(actor, `${patch.status.toLowerCase()} ticket`, id);
    }
    if (patch.assignee) {
      ticket.assignee = patch.assignee;
      this.recordAudit(actor, "reassigned ticket", id);
    }
    ticket.date = new Date().toISOString();
    return ticket;
  }

  createPost(actor: string, input: { title: string; category?: string }): ContentPost {
    const post: ContentPost = {
      id: `post_${Date.now()}`,
      title: input.title,
      category: input.category ?? "Product",
      status: "Draft",
      author: actor,
      views: 0,
      date: new Date().toISOString(),
    };
    this.posts.unshift(post);
    this.recordAudit(actor, "created draft", post.id);
    return post;
  }

  updatePost(actor: string, id: string, patch: { status?: ContentPost["status"] }): ContentPost {
    const post = this.posts.find((p) => p.id === id);
    if (!post) throw new NotFoundException(`Post ${id} not found`);
    if (patch.status) {
      post.status = patch.status;
      this.recordAudit(actor, `${patch.status.toLowerCase()} post`, id);
    }
    return post;
  }

  deletePost(actor: string, id: string): { deleted: boolean } {
    const idx = this.posts.findIndex((p) => p.id === id);
    if (idx < 0) throw new NotFoundException(`Post ${id} not found`);
    this.posts.splice(idx, 1);
    this.recordAudit(actor, "deleted post", id);
    return { deleted: true };
  }

  refundTransaction(actor: string, id: string): AdminTransaction {
    const txn = this.transactions.find((t) => t.id === id);
    if (!txn) throw new NotFoundException(`Transaction ${id} not found`);
    txn.status = "Refunded";
    this.recordAudit(actor, "refunded invoice", id);
    return txn;
  }
}
