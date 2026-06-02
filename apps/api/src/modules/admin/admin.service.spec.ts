import { AdminService } from "./admin.service";
import { UsersService } from "../auth/users.service";
import { MatchesService } from "../matches/matches.service";
import { PublicUser } from "../auth/user.store";

function publicUser(over: Partial<PublicUser> = {}): PublicUser {
  return {
    id: "u1",
    email: "a@b.dev",
    tier: "PREMIUM",
    role: "USER",
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

  const admin = new AdminService(usersStub, matchesStub);

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

  it("lists feature flags and team members in settings", () => {
    const s = admin.settings();
    expect(s.team.length).toBeGreaterThan(0);
    expect(s.flags.every((f) => typeof f.enabled === "boolean")).toBe(true);
  });
});
