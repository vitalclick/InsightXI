import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  FOOTBALL_DATA_PROVIDER,
  FootballDataProvider,
} from "../../providers/football-data.provider";
import { PgService } from "../../db/pg.service";
import { FootballRepository } from "../../repositories/football.repository";

export interface IngestResult {
  leagues: number;
  teams: number;
  matches: number;
}

/**
 * Pulls the full dataset from the configured provider and upserts it into
 * Postgres, then reloads the repository's in-memory cache. Intended for the
 * postgres backend (the source of truth); the BullMQ refresh job and the
 * admin endpoint both call ingestAll().
 */
@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    @Inject(FOOTBALL_DATA_PROVIDER)
    private readonly provider: FootballDataProvider,
    private readonly pg: PgService,
    private readonly repo: FootballRepository,
  ) {}

  async ingestAll(): Promise<IngestResult> {
    const [leagues, teams, matches] = await Promise.all([
      this.provider.getLeagues(),
      this.provider.getTeams(),
      this.provider.getMatches(),
    ]);

    for (const l of leagues) {
      await this.pg.query(
        `INSERT INTO leagues (id, name, country) VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, country = EXCLUDED.country`,
        [l.id, l.name, l.country],
      );
    }

    for (const t of teams) {
      await this.pg.query(
        `INSERT INTO teams (id, name, short_name, league_id) VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name,
           short_name = EXCLUDED.short_name, league_id = EXCLUDED.league_id`,
        [t.id, t.name, t.shortName, t.leagueId],
      );
    }

    for (const m of matches) {
      await this.pg.query(
        `INSERT INTO matches (id, league_id, season, matchday, utc_date, status,
           home_team_id, away_team_id, home_goals, away_goals, home_xg, away_xg)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status,
           matchday = EXCLUDED.matchday, home_goals = EXCLUDED.home_goals,
           away_goals = EXCLUDED.away_goals, home_xg = EXCLUDED.home_xg,
           away_xg = EXCLUDED.away_xg`,
        [
          m.id, m.leagueId, m.season, m.matchday, m.utcDate, m.status,
          m.homeTeamId, m.awayTeamId, m.homeGoals, m.awayGoals, m.homeXg, m.awayXg,
        ],
      );
    }

    await this.repo.reload();
    const result: IngestResult = {
      leagues: leagues.length,
      teams: teams.length,
      matches: matches.length,
    };
    this.logger.log(
      `Ingested ${result.leagues} leagues, ${result.teams} teams, ${result.matches} matches`,
    );
    return result;
  }
}
