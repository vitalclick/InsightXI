import {
  mapFixture,
  mapStatus,
  parseMatchday,
  seasonLabel,
} from "./api-football.mapper";
import { ApiFootballProvider, FetchLike } from "./api-football.provider";

describe("api-football mapper", () => {
  it("maps status codes to domain statuses", () => {
    expect(mapStatus("NS")).toBe("SCHEDULED");
    expect(mapStatus("1H")).toBe("LIVE");
    expect(mapStatus("HT")).toBe("LIVE");
    expect(mapStatus("FT")).toBe("FINISHED");
    expect(mapStatus("PEN")).toBe("FINISHED");
  });

  it("parses matchday from a round label", () => {
    expect(parseMatchday("Regular Season - 12")).toBe(12);
    expect(parseMatchday("Group A - 3")).toBe(3);
    expect(parseMatchday("Final")).toBe(0);
  });

  it("builds a season label from the start year", () => {
    expect(seasonLabel(2025)).toBe("2025/26");
    expect(seasonLabel(2009)).toBe("2009/10");
  });

  it("maps a finished fixture with goals, scheduled with null", () => {
    const finished = mapFixture({
      fixture: { id: 1, date: "2025-08-10T14:00:00+00:00", status: { short: "FT" } },
      league: { id: 39, season: 2025, round: "Regular Season - 1" },
      teams: { home: { id: 42 }, away: { id: 49 } },
      goals: { home: 2, away: 1 },
    });
    expect(finished).toMatchObject({
      id: "1",
      leagueId: "39",
      season: "2025/26",
      matchday: 1,
      status: "FINISHED",
      homeTeamId: "42",
      awayTeamId: "49",
      homeGoals: 2,
      awayGoals: 1,
    });

    const scheduled = mapFixture({
      fixture: { id: 2, date: "2026-01-10T14:00:00+00:00", status: { short: "NS" } },
      league: { id: 39, season: 2025, round: "Regular Season - 20" },
      teams: { home: { id: 42 }, away: { id: 50 } },
      goals: { home: null, away: null },
    });
    expect(scheduled.status).toBe("SCHEDULED");
    expect(scheduled.homeGoals).toBeNull();
  });
});

describe("ApiFootballProvider", () => {
  function fakeFetch(byPath: Record<string, unknown>): FetchLike {
    return async (url: string) => {
      const path = url.replace(/^https?:\/\/[^/]+/, "");
      const key = Object.keys(byPath).find((p) => path.startsWith(p));
      return {
        ok: true,
        status: 200,
        json: async () => byPath[key ?? ""] ?? { response: [] },
      };
    };
  }

  it("fetches and maps fixtures using the injected fetch + api key header", async () => {
    let sentKey: string | undefined;
    const fetchImpl: FetchLike = async (url, init) => {
      sentKey = init?.headers?.["x-apisports-key"];
      const inner = fakeFetch({
        "/fixtures": {
          response: [
            {
              fixture: { id: 7, date: "2025-08-10T14:00:00+00:00", status: { short: "FT" } },
              league: { id: 39, season: 2025, round: "Regular Season - 1" },
              teams: { home: { id: 42 }, away: { id: 49 } },
              goals: { home: 3, away: 0 },
            },
          ],
        },
      });
      return inner(url, init);
    };

    const provider = new ApiFootballProvider({
      apiKey: "test-key",
      leagueIds: [39],
      seasons: [2025],
      fetchImpl,
    });

    const matches = await provider.getMatches();
    expect(sentKey).toBe("test-key");
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ id: "7", homeGoals: 3, status: "FINISHED" });
  });

  it("throws on a non-ok response", async () => {
    const provider = new ApiFootballProvider({
      apiKey: "k",
      leagueIds: [39],
      seasons: [2025],
      fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({}) }),
    });
    await expect(provider.getLeagues()).rejects.toThrow(/429/);
  });
});
