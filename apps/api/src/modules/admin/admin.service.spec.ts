import { AdminService } from "./admin.service";
import { InMemoryAdminStore } from "./in-memory-admin.store";
import { UsersService } from "../auth/users.service";
import { MatchesService } from "../matches/matches.service";
import { PublicUser } from "../auth/user.store";

function publicUser(over: Partial<PublicUser> = {}): PublicUser {
  return {
    id: "u1",
    email: "a@b.dev",
    tier: "PREMIUM",
    role: "USER",
    suspended: false,
    name: "Test User",
    avatarUrl: null,
    provider: "email",
    emailVerified: true,
    subscriptionStatus: "active",
    currentPeriodEnd: null,
    ...over,
  };
}

describe("AdminService", () => {
  const usersStub = {
    listPublic: async () => [
      publicUser({ id: "u1", email: "admin@insightxi.dev", role: "ADMIN" }),
      publicUser({ id: "u2", email: "free@insightxi.dev", tier: "FREE" }),
    ],
  } as unknown as UsersService;

  const match = {
    id: "m1",
    leagueId: "epl",
    homeTeamName: "Riverside",
    awayTeamName: "Kingsgate",
    utcDate: "2026-06-01T15:00:00Z",
    status: "FINISHED",
  };
  const matchesStub = {
    fixtures: () => [{ ...match, status: "SCHEDULED" }],
    results: () => [match],
  } as unknown as MatchesService;

  const admin = new AdminService(usersStub, matchesStub, new InMemoryAdminStore());

  it("merges real accounts into the user listing", async () => {
    const users = await admin.listUsers();
    expect(users.some((u) => u.email === "admin@insightxi.dev")).toBe(true);
    expect(users.find((u) => u.email === "admin@insightxi.dev")?.role).toBe("Admin");
    // demo cohort is appended on top of the real accounts
    expect(users.length).toBeGreaterThan(2);
  });

  it("builds an overview with a consistent plan distribution", async () => {
    const ov = await admin.overview();
    const sum = ov.planDistribution.reduce((s, p) => s + p.count, 0);
    const users = await admin.listUsers();
    expect(sum).toBe(users.length);
    expect(ov.kpis.openTickets).toBeGreaterThanOrEqual(0);
    expect(ov.series.userGrowth.length).toBe(12);
  });

  it("derives picks from real match results", () => {
    const view = admin.predictions();
    expect(view.model.version).toBe("v4.2");
    expect(view.picks.length).toBeGreaterThan(0);
    expect(view.picks[0].home).toBe("Riverside");
  });

  it("lists feature flags and team members in settings", async () => {
    const s = await admin.settings();
    expect(s.team.length).toBeGreaterThan(0);
    expect(s.flags.every((f) => typeof f.enabled === "boolean")).toBe(true);
  });

  it("toggles a feature flag and records an audit entry", async () => {
    const before = (await admin.audit()).length;
    const flag = await admin.setFlag("admin@insightxi.dev", "laliga", true);
    expect(flag.enabled).toBe(true);
    expect((await admin.settings()).flags.find((f) => f.key === "laliga")?.enabled).toBe(true);
    const after = await admin.audit();
    expect(after.length).toBe(before + 1);
    expect(after[0].action).toContain("feature flag");
  });

  it("updates a demo user's plan in place", async () => {
    const users = await admin.listUsers();
    const demo = users.find((u) => u.id.startsWith("usr_"))!;
    const updated = await admin.updateUser("admin@insightxi.dev", demo.id, {
      plan: "Premium",
      status: "Suspended",
    });
    expect(updated.plan).toBe("Premium");
    expect(updated.status).toBe("Suspended");
    const again = await admin.listUsers();
    expect(again.find((u) => u.id === demo.id)?.plan).toBe("Premium");
  });

  it("publishes and deletes content", async () => {
    const post = await admin.createPost("admin@insightxi.dev", { title: "Scaffold test post" });
    expect(post.status).toBe("Draft");
    const published = await admin.updatePost("admin@insightxi.dev", post.id, { status: "Published" });
    expect(published.status).toBe("Published");
    expect((await admin.deletePost("admin@insightxi.dev", post.id)).deleted).toBe(true);
    expect((await admin.content()).find((p) => p.id === post.id)).toBeUndefined();
  });

  it("refunds a paid transaction", async () => {
    const paid = (await admin.subscriptions()).transactions.find((t) => t.status === "Paid");
    if (paid) {
      const refunded = await admin.refundTransaction("admin@insightxi.dev", paid.id);
      expect(refunded.status).toBe("Refunded");
    }
  });

  it("throws NotFound for unknown write targets", async () => {
    await expect(admin.deleteUser("a", "nope")).rejects.toThrow();
    await expect(admin.setFlag("a", "nope", true)).rejects.toThrow();
  });
});
