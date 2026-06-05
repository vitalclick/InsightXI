import { Test } from "@nestjs/testing";
import { DataModule } from "../../repositories/data.module";
import { FootballRepository } from "../../repositories/football.repository";
import { TournamentService } from "./tournament.service";
import { WORLD_CUP_TOURNAMENT_ID } from "../../data/tournament";

describe("TournamentService (structural projected bracket)", () => {
  let service: TournamentService;
  let repo: FootballRepository;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DataModule],
      providers: [TournamentService],
    }).compile();
    await moduleRef.init();
    service = moduleRef.get(TournamentService);
    repo = moduleRef.get(FootballRepository);
  });

  it("persists the knockout template as first-class fixtures (32 ties)", () => {
    const fixtures = repo.getKnockoutFixtures(WORLD_CUP_TOURNAMENT_ID);
    // 16 + 8 + 4 + 2 + 1 final + 1 third place.
    expect(fixtures).toHaveLength(32);
    const byStage = (s: string) => fixtures.filter((f) => f.stage === s).length;
    expect(byStage("R32")).toBe(16);
    expect(byStage("R16")).toBe(8);
    expect(byStage("QF")).toBe(4);
    expect(byStage("SF")).toBe(2);
    expect(byStage("FINAL")).toBe(1);
    expect(byStage("THIRD_PLACE")).toBe(1);
    // Template participants are slot references, not concrete teams yet.
    expect(fixtures.every((f) => f.homeTeamId === null && f.awayTeamId === null)).toBe(true);
  });

  it("projects all 12 group tables with four ranked teams each", () => {
    const { groups } = service.bracket();
    expect(groups).toHaveLength(12);
    for (const g of groups) {
      expect(g.table).toHaveLength(4);
      expect(g.table.map((r) => r.position)).toEqual([1, 2, 3, 4]);
      for (let i = 1; i < g.table.length; i++) {
        expect(g.table[i - 1].expectedPoints).toBeGreaterThanOrEqual(g.table[i].expectedPoints);
      }
      expect(g.table[0].finish).toBe("winner");
      expect(g.table[1].finish).toBe("runner-up");
    }
  });

  it("qualifies 32 teams: top two per group plus the eight best thirds", () => {
    const b = service.bracket();
    expect(b.qualifiers).toHaveLength(32);
    expect(b.thirdPlaceRanking).toHaveLength(12);
    expect(b.thirdPlaceRanking.filter((t) => t.qualified)).toHaveLength(8);
    expect(b.qualifiers.map((q) => q.seed).sort((a, c) => a - c)).toEqual(
      Array.from({ length: 32 }, (_, i) => i + 1),
    );
  });

  it("resolves the full knockout tree down to one champion", () => {
    const b = service.bracket();
    expect(b.rounds.map((r) => r.name)).toEqual([
      "Round of 32",
      "Round of 16",
      "Quarter-finals",
      "Semi-finals",
      "Final",
    ]);
    expect(b.rounds[0].ties).toHaveLength(16);
    expect(b.rounds[4].ties).toHaveLength(1);
    expect(b.champion).not.toBeNull();
    expect(b.champion!.teamId).toBe(b.rounds[4].ties[0].winnerId);
    expect(b.thirdPlacePlayoff).not.toBeNull();
    expect(b.thirdPlacePlayoff!.winnerId).not.toBeNull();
  });

  it("never pairs two teams from the same group before the semi-finals", () => {
    const b = service.bracket();
    for (const round of b.rounds) {
      if (round.stage === "SF" || round.stage === "FINAL") continue;
      for (const tie of round.ties) {
        if (tie.home && tie.away) {
          expect(tie.home.group).not.toBe(tie.away.group);
        }
      }
    }
  });

  it("keeps every resolved tie's advance probabilities normalised", () => {
    const b = service.bracket();
    for (const round of b.rounds) {
      for (const tie of round.ties) {
        if (!tie.home || !tie.away) continue;
        expect(tie.homeAdvance + tie.awayAdvance).toBeCloseTo(1, 2);
        expect(tie.winnerId === tie.home.teamId || tie.winnerId === tie.away.teamId).toBe(true);
      }
    }
  });
});
