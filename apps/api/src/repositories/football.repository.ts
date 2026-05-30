import { OnModuleInit } from "@nestjs/common";
import { League, Match, Team } from "../common/domain";

export interface FootballDataset {
  leagues: League[];
  teams: Team[];
  matches: Match[];
}

/**
 * Abstract in-memory-indexed read repository over the football data source.
 *
 * Repository pattern (per coding standards): services depend on this abstract
 * type, not on the backing store. Concrete subclasses only implement load():
 *   - MemoryFootballRepository  (provider-backed seed/live data)
 *   - PostgresFootballRepository (Neon/Postgres via pg)
 *
 * Reads are served synchronously from in-memory indexes (data volumes are a
 * few leagues), so swapping the backend never ripples into service code.
 */
export abstract class FootballRepository implements OnModuleInit {
  private leagues: League[] = [];
  private teams: Team[] = [];
  private matches: Match[] = [];
  private teamsById = new Map<string, Team>();

  /** Load the full dataset from the backing store. */
  protected abstract load(): Promise<FootballDataset>;

  async onModuleInit(): Promise<void> {
    await this.reload();
  }

  /** (Re)load data into the in-memory indexes — call after ingestion. */
  async reload(): Promise<void> {
    const data = await this.load();
    this.leagues = data.leagues;
    this.teams = data.teams;
    this.matches = data.matches;
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

  getMatches(
    filter: {
      leagueId?: string;
      season?: string;
      status?: Match["status"];
      teamId?: string;
    } = {},
  ): Match[] {
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
