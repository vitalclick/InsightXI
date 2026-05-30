import { Global, Logger, Module } from "@nestjs/common";
import { FOOTBALL_DATA_PROVIDER } from "./football-data.provider";
import { MockFootballProvider } from "./mock-football.provider";
import { ApiFootballProvider } from "./api-football.provider";

/** Parse "39,140" -> [39, 140]; defaults to EPL + La Liga. */
export function parseLeagueIds(value?: string): number[] {
  if (!value) return [39, 140];
  return value
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n));
}

/**
 * Selects the football data source:
 *  - FOOTBALL_API_KEY present -> ApiFootballProvider (live API-Football)
 *  - otherwise               -> MockFootballProvider (deterministic seed)
 * No service code changes between the two — they share one contract.
 */
@Global()
@Module({
  providers: [
    {
      provide: FOOTBALL_DATA_PROVIDER,
      useFactory: () => {
        const logger = new Logger("ProvidersModule");
        const apiKey = process.env.FOOTBALL_API_KEY;
        if (apiKey) {
          logger.log("Football data: API-Football (live)");
          return new ApiFootballProvider({
            apiKey,
            baseUrl: process.env.FOOTBALL_API_BASE_URL,
            leagueIds: parseLeagueIds(process.env.FOOTBALL_LEAGUE_IDS),
            season: Number(
              process.env.FOOTBALL_SEASON ?? new Date().getFullYear(),
            ),
          });
        }
        logger.log(
          "Football data: mock seed (set FOOTBALL_API_KEY to use live data)",
        );
        return new MockFootballProvider();
      },
    },
  ],
  exports: [FOOTBALL_DATA_PROVIDER],
})
export class ProvidersModule {}
