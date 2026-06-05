import { Logger } from "@nestjs/common";
import { KnockoutFixture, League, Match, Team } from "../common/domain";
import { FootballDataProvider } from "./football-data.provider";

/**
 * Resilience wrapper: serves data from a primary provider (e.g. API-Football)
 * and transparently falls back to a secondary provider (the deterministic mock
 * seed) when the primary errors or returns nothing.
 *
 * This protects the boot path — API-Football's free tier often restricts the
 * current season, and any upstream outage would otherwise crash startup. With
 * the fallback the platform always has data to serve.
 */
export class FallbackFootballProvider implements FootballDataProvider {
  private readonly logger = new Logger("FallbackFootballProvider");

  constructor(
    private readonly primary: FootballDataProvider,
    private readonly fallback: FootballDataProvider,
  ) {}

  getLeagues(): Promise<League[]> {
    return this.guard("leagues", () => this.primary.getLeagues(), () =>
      this.fallback.getLeagues(),
    );
  }

  getTeams(): Promise<Team[]> {
    return this.guard("teams", () => this.primary.getTeams(), () =>
      this.fallback.getTeams(),
    );
  }

  getMatches(): Promise<Match[]> {
    return this.guard("matches", () => this.primary.getMatches(), () =>
      this.fallback.getMatches(),
    );
  }

  /**
   * Knockout template. Live providers (API-Football) don't model a bracket, so
   * this serves the fallback (seed) template directly.
   */
  async getKnockoutFixtures(): Promise<KnockoutFixture[]> {
    const primary = await this.primary.getKnockoutFixtures?.();
    if (primary && primary.length > 0) return primary;
    return (await this.fallback.getKnockoutFixtures?.()) ?? [];
  }

  private async guard<T>(
    label: string,
    primary: () => Promise<T[]>,
    fallback: () => Promise<T[]>,
  ): Promise<T[]> {
    try {
      const result = await primary();
      if (result.length > 0) return result;
      this.logger.warn(
        `Primary provider returned no ${label}; falling back to seed data.`,
      );
    } catch (err) {
      this.logger.warn(
        `Primary provider failed for ${label} (${(err as Error).message}); ` +
          "falling back to seed data.",
      );
    }
    return fallback();
  }
}
