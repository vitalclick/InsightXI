import { TournamentService, bracketSeedOrder } from "./tournament.service";

describe("TournamentService (projected bracket)", () => {
  const service = new TournamentService();
  const bracket = service.bracket();

  it("projects all 12 group tables with four ranked teams each", () => {
    expect(bracket.groups).toHaveLength(12);
    for (const g of bracket.groups) {
      expect(g.table).toHaveLength(4);
      expect(g.table.map((r) => r.position)).toEqual([1, 2, 3, 4]);
      // Expected points are non-increasing down a projected table.
      for (let i = 1; i < g.table.length; i++) {
        expect(g.table[i - 1].expectedPoints).toBeGreaterThanOrEqual(
          g.table[i].expectedPoints,
        );
      }
      expect(g.table[0].finish).toBe("winner");
      expect(g.table[1].finish).toBe("runner-up");
    }
  });

  it("qualifies 32 teams: top two per group plus the eight best thirds", () => {
    expect(bracket.qualifiers).toHaveLength(32);
    const qualifiedThirds = bracket.thirdPlaceRanking.filter((t) => t.qualified);
    expect(bracket.thirdPlaceRanking).toHaveLength(12);
    expect(qualifiedThirds).toHaveLength(8);
    // Seeds are a contiguous 1..32.
    expect(bracket.qualifiers.map((q) => q.seed).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 32 }, (_, i) => i + 1),
    );
  });

  it("builds the full knockout tree down to a single champion", () => {
    expect(bracket.rounds.map((r) => r.name)).toEqual([
      "Round of 32",
      "Round of 16",
      "Quarter-finals",
      "Semi-finals",
      "Final",
    ]);
    expect(bracket.rounds[0].ties).toHaveLength(16);
    expect(bracket.rounds[4].ties).toHaveLength(1);
    expect(bracket.champion).not.toBeNull();
    // The final's winner is the champion.
    const final = bracket.rounds[4].ties[0];
    expect(bracket.champion!.teamId).toBe(final.winnerId);
    // Third-place play-off is contested by the two semi-final losers.
    expect(bracket.thirdPlacePlayoff.winnerId).not.toBeNull();
  });

  it("keeps every tie's advance probabilities normalised", () => {
    for (const round of bracket.rounds) {
      for (const tie of round.ties) {
        expect(tie.homeAdvance + tie.awayAdvance).toBeCloseTo(1, 2);
        expect(tie.winnerId === tie.home?.teamId || tie.winnerId === tie.away?.teamId).toBe(true);
      }
    }
  });

  it("projects an elite side (e.g. one of the top seeds) into the latter stages", () => {
    // The overall top seed should not be eliminated in the Round of 32.
    const topSeed = bracket.qualifiers.find((q) => q.seed === 1)!;
    const r32 = bracket.rounds[0].ties.find(
      (t) => t.home?.teamId === topSeed.teamId || t.away?.teamId === topSeed.teamId,
    )!;
    expect(r32.winnerId).toBe(topSeed.teamId);
  });

  it("generates a standard separated seed order", () => {
    expect(bracketSeedOrder(4)).toEqual([1, 4, 2, 3]);
    expect(bracketSeedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
    expect(bracketSeedOrder(32)).toHaveLength(32);
  });
});
