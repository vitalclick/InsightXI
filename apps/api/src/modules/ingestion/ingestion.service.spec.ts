import { IngestionService } from "./ingestion.service";
import { FootballDataProvider } from "../../providers/football-data.provider";
import { PgService } from "../../db/pg.service";
import { FootballRepository } from "../../repositories/football.repository";

describe("IngestionService", () => {
  it("upserts provider data into Postgres and reloads the repo", async () => {
    const provider: FootballDataProvider = {
      getLeagues: async () => [{ id: "epl", name: "EPL", country: "England" }],
      getTeams: async () => [
        { id: "ars", name: "Arsenal", shortName: "ARS", leagueId: "epl" },
      ],
      getMatches: async () => [
        {
          id: "m1",
          leagueId: "epl",
          season: "2025/26",
          matchday: 1,
          utcDate: "2025-08-10T14:00:00.000Z",
          status: "FINISHED",
          homeTeamId: "ars",
          awayTeamId: "ars",
          homeGoals: 2,
          awayGoals: 1,
          homeXg: 1.8,
          awayXg: 0.9,
        },
      ],
    };

    const queries: string[] = [];
    const pg = {
      query: jest.fn(async (text: string) => {
        queries.push(text);
        return [];
      }),
    } as unknown as PgService;

    const reload = jest.fn(async () => undefined);
    const repo = { reload } as unknown as FootballRepository;

    const service = new IngestionService(provider, pg, repo);
    const result = await service.ingestAll();

    expect(result).toEqual({ leagues: 1, teams: 1, matches: 1 });
    expect(reload).toHaveBeenCalledTimes(1);
    // One upsert per entity, each an INSERT ... ON CONFLICT.
    expect(queries).toHaveLength(3);
    expect(queries.every((q) => /ON CONFLICT/i.test(q))).toBe(true);
  });
});
