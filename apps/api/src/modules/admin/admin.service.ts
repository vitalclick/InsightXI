import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { UsersService } from "../auth/users.service";
import { MatchesService } from "../matches/matches.service";
import { AdminStore } from "./admin.store";
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
/** A fixed "now" so the seeded cohort is stable across requests. */
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
 * deterministic demo dataset; the ticket/content/flag/transaction/audit
 * subsystems persist through AdminStore (in-memory or Postgres per
 * DATA_BACKEND), and real accounts persist through UsersService.
 *
 * The demo user cohort is generated once on construction — it populates the
 * users table visually alongside real registered accounts.
 */
@Injectable()
export class AdminService implements OnModuleInit {
  private readonly demoCohort: AdminUser[];

  constructor(
    private readonly users: UsersService,
    private readonly matches: MatchesService,
    private readonly store: AdminStore,
  ) {
    this.demoCohort = this.buildDemoUsers();
  }

  async onModuleInit(): Promise<void> {
    // Runs after DataModule's MigrationService has created the tables.
    await this.store.seedIfEmpty();
  }

  // ── Demo cohort (in-memory, session-scoped) ─────────────────────────────
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
          `${fn}.${ln}`.toLowerCase().replace(/[^a-z.]/g, "") + "@" + pick(domains, s),
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

  /** Prepends an entry to the audit log via the store. */
  private async recordAudit(actor: string, action: string, target: string): Promise<void> {
    await this.store.appendAudit({
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      actor,
      action,
      target,
      ip: "internal",
      at: new Date().toISOString(),
    });
  }

  // ── Read models ─────────────────────────────────────────────────────────
  async overview(): Promise<AdminOverview> {
    const all = await this.listUsers();
    const tickets = await this.store.listTickets();
    const audit = await this.store.listAudit();
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
        openTickets: tickets.filter((t) => t.status !== "Closed").length,
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
      recentActivity: audit.slice(0, 6),
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

  async subscriptions(): Promise<SubscriptionsView> {
    return {
      summary: {
        mrr: 28_400,
        arr: 340_800,
        activeSubs: 3210,
        trialing: 412,
        churn: 2.1,
        arpu: 8.85,
      },
      transactions: await this.store.listTransactions(),
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

  content(): Promise<ContentPost[]> {
    return this.store.listPosts();
  }

  support(): Promise<SupportTicket[]> {
    return this.store.listTickets();
  }

  audit(): Promise<AuditEntry[]> {
    return this.store.listAudit();
  }

  async settings(): Promise<SettingsView> {
    return {
      team: [
        { name: "Alex Mercer", email: "alex@insightxi.app", role: "Owner", lastSeen: minsAgo(0) },
        { name: "Priya Raman", email: "priya@insightxi.app", role: "Admin", lastSeen: minsAgo(120) },
        { name: "Daniel Cole", email: "daniel@insightxi.app", role: "Editor", lastSeen: minsAgo(1440) },
        { name: "Sara Lindqvist", email: "sara@insightxi.app", role: "Analyst", lastSeen: daysAgo(3) },
        { name: "Marco Romano", email: "marco@insightxi.app", role: "Support", lastSeen: minsAgo(300) },
      ],
      flags: await this.store.listFlags(),
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
      await this.auditUserChange(actor, patch, id);
      return demo;
    }
    const updated = await this.users.adminUpdate(id, {
      role: patch.role === "Admin" ? "ADMIN" : patch.role ? "USER" : undefined,
      tier: patch.plan === "Premium" ? "PREMIUM" : patch.plan ? "FREE" : undefined,
      suspended:
        patch.status === "Suspended" ? true : patch.status === "Active" ? false : undefined,
    });
    if (!updated) throw new NotFoundException(`User ${id} not found`);
    await this.auditUserChange(actor, patch, id);
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

  private async auditUserChange(actor: string, patch: UserPatch, id: string): Promise<void> {
    if (patch.status === "Suspended") await this.recordAudit(actor, "suspended user", id);
    else if (patch.status === "Active") await this.recordAudit(actor, "reactivated user", id);
    if (patch.plan) await this.recordAudit(actor, `changed plan to ${patch.plan}`, id);
    if (patch.role) await this.recordAudit(actor, `updated role to ${patch.role}`, id);
  }

  /** Permanently delete an account (real or demo). */
  async deleteUser(actor: string, id: string): Promise<{ deleted: boolean }> {
    const idx = this.demoCohort.findIndex((u) => u.id === id);
    if (idx >= 0) {
      this.demoCohort.splice(idx, 1);
      await this.recordAudit(actor, "deleted user", id);
      return { deleted: true };
    }
    const deleted = await this.users.remove(id);
    if (!deleted) throw new NotFoundException(`User ${id} not found`);
    await this.recordAudit(actor, "deleted user", id);
    return { deleted: true };
  }

  async setFlag(actor: string, key: string, enabled: boolean): Promise<FeatureFlag> {
    const flag = await this.store.setFlag(key, enabled);
    if (!flag) throw new NotFoundException(`Flag ${key} not found`);
    await this.recordAudit(actor, `${enabled ? "enabled" : "disabled"} feature flag`, key);
    return flag;
  }

  async updateTicket(
    actor: string,
    id: string,
    patch: { status?: SupportTicket["status"]; assignee?: string },
  ): Promise<SupportTicket> {
    const ticket = await this.store.updateTicket(id, { ...patch, date: new Date().toISOString() });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    if (patch.status) await this.recordAudit(actor, `${patch.status.toLowerCase()} ticket`, id);
    if (patch.assignee) await this.recordAudit(actor, "reassigned ticket", id);
    return ticket;
  }

  async createPost(actor: string, input: { title: string; category?: string }): Promise<ContentPost> {
    const post = await this.store.insertPost({
      id: `post_${Date.now()}`,
      title: input.title,
      category: input.category ?? "Product",
      status: "Draft",
      author: actor,
      views: 0,
      date: new Date().toISOString(),
    });
    await this.recordAudit(actor, "created draft", post.id);
    return post;
  }

  async updatePost(
    actor: string,
    id: string,
    patch: { status?: ContentPost["status"] },
  ): Promise<ContentPost> {
    const post = await this.store.updatePost(id, patch);
    if (!post) throw new NotFoundException(`Post ${id} not found`);
    if (patch.status) await this.recordAudit(actor, `${patch.status.toLowerCase()} post`, id);
    return post;
  }

  async deletePost(actor: string, id: string): Promise<{ deleted: boolean }> {
    const deleted = await this.store.deletePost(id);
    if (!deleted) throw new NotFoundException(`Post ${id} not found`);
    await this.recordAudit(actor, "deleted post", id);
    return { deleted: true };
  }

  async refundTransaction(actor: string, id: string): Promise<AdminTransaction> {
    const txn = await this.store.refundTransaction(id);
    if (!txn) throw new NotFoundException(`Transaction ${id} not found`);
    await this.recordAudit(actor, "refunded invoice", id);
    return txn;
  }
}
