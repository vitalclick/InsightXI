import { Injectable } from "@nestjs/common";
import { League, Match, Team } from "../common/domain";
import { buildSeedData } from "../data/seed";
import { FootballDataProvider } from "./football-data.provider";

/**
 * Offline provider backed by the deterministic seed simulator.
 * Default data source until FOOTBALL_API_KEY is configured for a live feed.
 */
@Injectable()
export class MockFootballProvider implements FootballDataProvider {
  private readonly data = buildSeedData();

  async getLeagues(): Promise<League[]> {
    return this.data.leagues;
  }

  async getTeams(): Promise<Team[]> {
    return this.data.teams;
  }

  async getMatches(): Promise<Match[]> {
    return this.data.matches;
  }
}
