import { Injectable } from "@nestjs/common";
import { League, Match } from "../common/domain";
import { PgService } from "../db/pg.service";
import { FootballDataset, FootballRepository } from "./football.repository";

interface TeamRow {
  id: string;
  name: string;
  short_name: string;
  league_id: string;
}

interface MatchRow {
  id: string;
  league_id: string;
  season: string;
  matchday: number;
  utc_date: string;
  status: Match["status"];
  home_team_id: string;
  away_team_id: string;
  home_goals: number | null;
  away_goals: number | null;
  home_xg: number | null;
  away_xg: number | null;
}

/** Postgres-backed backend (DATA_BACKEND=postgres). */
@Injectable()
export class PostgresFootballRepository extends FootballRepository {
  constructor(private readonly pg: PgService) {
    super();
  }

  protected async load(): Promise<FootballDataset> {
    const leagues = await this.pg.query<League>(
      "SELECT id, name, country FROM leagues ORDER BY name",
    );
    const teamRows = await this.pg.query<TeamRow>(
      "SELECT id, name, short_name, league_id FROM teams",
    );
    const matchRows = await this.pg.query<MatchRow>(
      `SELECT id, league_id, season, matchday, utc_date, status,
              home_team_id, away_team_id, home_goals, away_goals, home_xg, away_xg
       FROM matches`,
    );

    return {
      leagues,
      teams: teamRows.map((t) => ({
        id: t.id,
        name: t.name,
        shortName: t.short_name,
        leagueId: t.league_id,
      })),
      matches: matchRows.map((m) => ({
        id: m.id,
        leagueId: m.league_id,
        season: m.season,
        matchday: m.matchday,
        utcDate: m.utc_date,
        status: m.status,
        homeTeamId: m.home_team_id,
        awayTeamId: m.away_team_id,
        homeGoals: m.home_goals,
        awayGoals: m.away_goals,
        homeXg: m.home_xg,
        awayXg: m.away_xg,
      })),
    };
  }
}
