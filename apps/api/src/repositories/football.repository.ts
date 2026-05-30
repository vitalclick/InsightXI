import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { League, Match, Team } from "../common/domain";
import {
  FOOTBALL_DATA_PROVIDER,
  FootballDataProvider,
} from "../providers/football-data.provider";

/**
 * In-memory read repository over the football data source.
 *
 * Repository pattern (per coding standards): services depend on this, not on
 * the provider or storage. Swapping the in-memory index for Postgres/Prisma
 * later means reimplementing these methods only.
 */
@Injectable()
export class FootballRepository implements OnModuleInit {
  private leagues: League[] = [];
  private teams: Team[] = [];
  private matches: Match[] = [];
  private teamsById = new Map<string, Team>();

  constructor(
    @Inject(FOOTBALL_DATA_PROVIDER)
    private readonly provider: FootballDataProvider,
  ) {}

  async onModuleInit(): Promise<void> {
    [this.leagues, this.teams, this.matches] = await Promise.all([
      this.provider.getLeagues(),
      this.provider.getTeams(),
      this.provider.getMatches(),
    ]);
    this.teamsById = new Map(this.teams.map((t) => [t.id, t]));
  }

  getLeagues(): League[] {
    return this.leagues;
  }

  getLeague(id: string): League | undefined {
    return this.leagues.find((l) => l.id === id);
  }

  getTeams(leagueId?: string): Team[] {
    return leagueId
      ? this.teams.filter((t) => t.leagueId === leagueId)
      : this.teams;
  }

  getTeam(id: string): Team | undefined {
    return this.teamsById.get(id);
  }

  teamName(id: string): string {
    return this.teamsById.get(id)?.name ?? id;
  }

  getMatches(filter: {
    leagueId?: string;
    season?: string;
    status?: Match["status"];
    teamId?: string;
  } = {}): Match[] {
    return this.matches.filter((m) => {
      if (filter.leagueId && m.leagueId !== filter.leagueId) return false;
      if (filter.season && m.season !== filter.season) return false;
      if (filter.status && m.status !== filter.status) return false;
      if (
        filter.teamId &&
        m.homeTeamId !== filter.teamId &&
        m.awayTeamId !== filter.teamId
      ) {
        return false;
      }
      return true;
    });
  }

  getMatch(id: string): Match | undefined {
    return this.matches.find((m) => m.id === id);
  }

  /** Head-to-head finished matches between two teams, newest first. */
  getHeadToHead(teamA: string, teamB: string): Match[] {
    return this.matches
      .filter(
        (m) =>
          m.status === "FINISHED" &&
          ((m.homeTeamId === teamA && m.awayTeamId === teamB) ||
            (m.homeTeamId === teamB && m.awayTeamId === teamA)),
      )
      .sort((a, b) => b.utcDate.localeCompare(a.utcDate));
  }
}
