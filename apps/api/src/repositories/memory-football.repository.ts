import { Inject, Injectable } from "@nestjs/common";
import {
  FOOTBALL_DATA_PROVIDER,
  FootballDataProvider,
} from "../providers/football-data.provider";
import { FootballDataset, FootballRepository } from "./football.repository";

/** Default backend: loads from the configured FootballDataProvider. */
@Injectable()
export class MemoryFootballRepository extends FootballRepository {
  constructor(
    @Inject(FOOTBALL_DATA_PROVIDER)
    private readonly provider: FootballDataProvider,
  ) {
    super();
  }

  protected async load(): Promise<FootballDataset> {
    const [leagues, teams, matches, knockoutFixtures] = await Promise.all([
      this.provider.getLeagues(),
      this.provider.getTeams(),
      this.provider.getMatches(),
      this.provider.getKnockoutFixtures?.() ?? Promise.resolve([]),
    ]);
    return { leagues, teams, matches, knockoutFixtures };
  }
}
