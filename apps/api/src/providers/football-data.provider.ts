import { KnockoutFixture, League, Match, Team } from "../common/domain";

/**
 * Abstraction over a football data source. The mock provider serves seeded
 * data offline; an ApiFootballProvider can implement the same contract to
 * pull from API-Football without changing any service code.
 */
export interface FootballDataProvider {
  getLeagues(): Promise<League[]>;
  getTeams(): Promise<Team[]>;
  getMatches(): Promise<Match[]>;
  /**
   * Knockout bracket template (optional). Live providers that don't model a
   * tournament bracket can omit this; the repository treats it as empty.
   */
  getKnockoutFixtures?(): Promise<KnockoutFixture[]>;
}

/** DI token for the provider. */
export const FOOTBALL_DATA_PROVIDER = Symbol("FOOTBALL_DATA_PROVIDER");
