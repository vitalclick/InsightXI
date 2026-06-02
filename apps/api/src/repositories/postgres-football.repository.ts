import { Inject, Injectable, Logger } from "@nestjs/common";
import { League, Match } from "../common/domain";
import { PgService } from "../db/pg.service";
import {
  FOOTBALL_DATA_PROVIDER,
  FootballDataProvider,
} from "../providers/football-data.provider";
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
  private readonly logger = new Logger(PostgresFootballRepository.name);

  constructor(
    private readonly pg: PgService,
    @Inject(FOOTBALL_DATA_PROVIDER)
    private readonly provider: FootballDataProvider,
  ) {
    super();
  }

  protected async load(): Promise<FootballDataset> {
    await this.seedIfEmpty();
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

  /**
   * Populate leagues/teams/matches from the configured data provider the first
   * time the database is empty (idempotent: only seeds when no leagues exist).
   * Keeps a fresh Postgres/Neon DB fully populated so fixtures, predictions,
   * standings and the live simulator have data to work with.
   */
  private async seedIfEmpty(): Promise<void> {
    const [{ count }] = await this.pg.query<{ count: string }>(
      "SELECT COUNT(*)::int AS count FROM leagues",
    );
    if (Number(count) > 0) {
      this.logger.log(
        `Football tables already populated (${count} leagues); skipping seed. ` +
          `TRUNCATE leagues/teams/matches (or POST /ingestion/run) to refresh from the provider.`,
      );
      return;
    }

    const [leagues, teams, matches] = await Promise.all([
      this.provider.getLeagues(),
      this.provider.getTeams(),
      this.provider.getMatches(),
    ]);

    for (const l of leagues) {
      await this.pg.query(
        "INSERT INTO leagues (id, name, country) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        [l.id, l.name, l.country],
      );
    }
    for (const t of teams) {
      await this.pg.query(
        "INSERT INTO teams (id, name, short_name, league_id) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
        [t.id, t.name, t.shortName, t.leagueId],
      );
    }
    for (const m of matches) {
      await this.pg.query(
        `INSERT INTO matches (id, league_id, season, matchday, utc_date, status,
                              home_team_id, away_team_id, home_goals, away_goals, home_xg, away_xg)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT DO NOTHING`,
        [
          m.id, m.leagueId, m.season, m.matchday, m.utcDate, m.status,
          m.homeTeamId, m.awayTeamId, m.homeGoals, m.awayGoals, m.homeXg, m.awayXg,
        ],
      );
    }
    this.logger.log(
      `Seeded football data: ${leagues.length} leagues, ${teams.length} teams, ${matches.length} matches`,
    );
  }
}
