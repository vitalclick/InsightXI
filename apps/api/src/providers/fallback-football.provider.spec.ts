import { FallbackFootballProvider } from "./fallback-football.provider";
import { FootballDataProvider } from "./football-data.provider";
import { League, Match, Team } from "../common/domain";

const league = (id: string): League => ({ id, name: id, country: "X" });

function fakeProvider(
  over: Partial<Record<keyof FootballDataProvider, unknown>>,
): FootballDataProvider {
  return {
    getLeagues: async () => (over.getLeagues as () => League[])?.() ?? [],
    getTeams: async () => (over.getTeams as () => Team[])?.() ?? [],
    getMatches: async () => (over.getMatches as () => Match[])?.() ?? [],
  };
}

describe("FallbackFootballProvider", () => {
  it("returns primary data when the primary succeeds with results", async () => {
    const primary = fakeProvider({ getLeagues: () => [league("live")] });
    const fallback = fakeProvider({ getLeagues: () => [league("seed")] });
    const p = new FallbackFootballProvider(primary, fallback);
    expect(await p.getLeagues()).toEqual([league("live")]);
  });

  it("falls back when the primary throws", async () => {
    const primary: FootballDataProvider = {
      getLeagues: async () => {
        throw new Error("API-Football responded 403");
      },
      getTeams: async () => [],
      getMatches: async () => [],
    };
    const fallback = fakeProvider({ getLeagues: () => [league("seed")] });
    const p = new FallbackFootballProvider(primary, fallback);
    expect(await p.getLeagues()).toEqual([league("seed")]);
  });

  it("falls back when the primary returns an empty set", async () => {
    const primary = fakeProvider({ getMatches: () => [] });
    const seedMatch = { id: "m1" } as unknown as Match;
    const fallback = fakeProvider({ getMatches: () => [seedMatch] });
    const p = new FallbackFootballProvider(primary, fallback);
    expect(await p.getMatches()).toEqual([seedMatch]);
  });
});
