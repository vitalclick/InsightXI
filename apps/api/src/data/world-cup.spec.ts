import { Test } from "@nestjs/testing";
import { DataModule } from "../repositories/data.module";
import { FootballRepository } from "../repositories/football.repository";
import { AnalyticsService } from "../modules/analytics/analytics.service";
import { StandingsService } from "../modules/statistics/standings.service";
import { buildSeedData, CURRENT_SEASON } from "./seed";
import { WORLD_CUP_GROUPS } from "./world-cup";

describe("FIFA World Cup 2026 seed", () => {
  let repo: FootballRepository;
  let analytics: AnalyticsService;
  let standings: StandingsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DataModule],
      providers: [AnalyticsService, StandingsService],
    }).compile();
    await moduleRef.init();
    repo = moduleRef.get(FootballRepository);
    analytics = moduleRef.get(AnalyticsService);
    standings = moduleRef.get(StandingsService);
  });

  it("seeds all 12 groups (48 nations) as competitions", () => {
    const seed = buildSeedData();
    const wcLeagues = seed.leagues.filter((l) => l.country === "FIFA World Cup 2026");
    expect(wcLeagues).toHaveLength(12);

    for (const group of WORLD_CUP_GROUPS) {
      const league = wcLeagues.find((l) => l.id === `wc26-${group.code.toLowerCase()}`);
      expect(league).toBeDefined();
      expect(repo.getTeams(league!.id)).toHaveLength(4);
    }
  });

  it("schedules each group stage as a single round-robin in June 2026", () => {
    for (const group of WORLD_CUP_GROUPS) {
      const leagueId = `wc26-${group.code.toLowerCase()}`;
      const fixtures = repo.getMatches({
        leagueId,
        season: CURRENT_SEASON,
        status: "SCHEDULED",
      });
      // 4 teams, each plays the other three once → 6 matches.
      expect(fixtures).toHaveLength(6);
      for (const m of fixtures) {
        expect(m.utcDate.startsWith("2026-06")).toBe(true);
        expect(m.homeGoals).toBeNull();
      }
    }
  });

  it("plays out pre-tournament form so the table starts empty but the engine has signal", () => {
    const groupC = "wc26-c";
    // Group standings (current season) are empty until the tournament kicks off.
    const table = standings.table(groupC, CURRENT_SEASON);
    expect(table).toHaveLength(4);
    expect(table.every((r) => r.played === 0)).toBe(true);

    // But finished form results exist from earlier cycles.
    const finished = repo.getMatches({ leagueId: groupC, status: "FINISHED" });
    expect(finished.length).toBeGreaterThan(0);
  });

  it("ranks a stronger nation above a weaker one via learned Elo", () => {
    // Group C: Brazil (elite priors) should out-rate Haiti (modest priors).
    const brazil = analytics.ratingsForTeam("wc-bra");
    const haiti = analytics.ratingsForTeam("wc-hai");
    expect(brazil.elo).toBeGreaterThan(haiti.elo);
    expect(brazil.attackStrength).toBeGreaterThan(haiti.attackStrength);
  });
});
