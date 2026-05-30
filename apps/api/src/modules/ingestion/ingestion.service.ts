import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  FOOTBALL_DATA_PROVIDER,
  FootballDataProvider,
} from "../../providers/football-data.provider";
import { PgService } from "../../db/pg.service";
import { FootballRepository } from "../../repositories/football.repository";
import { buildBatchInsert, chunkRows } from "./batch";

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

    // Batched upserts: one statement per table (chunked under the 65535-param
    // cap) instead of one round trip per row. Keeps a managed/remote Postgres
    // refresh to a couple of round trips rather than hundreds.
    await this.upsert(
      "leagues",
      `INSERT INTO leagues (id, name, country) VALUES %ROWS%
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, country = EXCLUDED.country`,
      3,
      leagues.map((l) => [l.id, l.name, l.country]),
    );

    await this.upsert(
      "teams",
      `INSERT INTO teams (id, name, short_name, league_id) VALUES %ROWS%
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name,
         short_name = EXCLUDED.short_name, league_id = EXCLUDED.league_id`,
      4,
      teams.map((t) => [t.id, t.name, t.shortName, t.leagueId]),
    );

    await this.upsert(
      "matches",
      `INSERT INTO matches (id, league_id, season, matchday, utc_date, status,
         home_team_id, away_team_id, home_goals, away_goals, home_xg, away_xg)
       VALUES %ROWS%
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status,
         matchday = EXCLUDED.matchday, home_goals = EXCLUDED.home_goals,
         away_goals = EXCLUDED.away_goals, home_xg = EXCLUDED.home_xg,
         away_xg = EXCLUDED.away_xg`,
      12,
      matches.map((m) => [
        m.id, m.leagueId, m.season, m.matchday, m.utcDate, m.status,
        m.homeTeamId, m.awayTeamId, m.homeGoals, m.awayGoals, m.homeXg, m.awayXg,
      ]),
    );

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

  /**
   * Run a chunked, batched upsert. `sql` must contain a `%ROWS%` token where the
   * generated `($1,$2,...),(...)` placeholder groups are spliced in. Empty input
   * is a no-op (no query issued).
   */
  private async upsert(
    table: string,
    sql: string,
    colsPerRow: number,
    rows: unknown[][],
  ): Promise<void> {
    if (rows.length === 0) return;
    for (const chunk of chunkRows(rows, colsPerRow)) {
      const { placeholders, values } = buildBatchInsert(chunk);
      await this.pg.query(sql.replace("%ROWS%", placeholders), values);
    }
  }
}
