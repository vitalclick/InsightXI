import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  BracketSlot,
  BracketSlotKind,
  KnockoutFixture,
  League,
  Match,
  TournamentStage,
} from "../common/domain";
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

interface KnockoutRow {
  id: string;
  tournament_id: string;
  stage: TournamentStage;
  ord: number;
  utc_date: string;
  home_kind: BracketSlotKind;
  home_group: string | null;
  home_third_rank: number | null;
  home_source_match: string | null;
  home_label: string;
  away_kind: BracketSlotKind;
  away_group: string | null;
  away_third_rank: number | null;
  away_source_match: string | null;
  away_label: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_goals: number | null;
  away_goals: number | null;
}

function slotFromRow(
  kind: BracketSlotKind,
  group: string | null,
  thirdRank: number | null,
  sourceMatch: string | null,
  label: string,
): BracketSlot {
  return {
    kind,
    ...(group !== null ? { group } : {}),
    ...(thirdRank !== null ? { thirdRank } : {}),
    ...(sourceMatch !== null ? { sourceMatchId: sourceMatch } : {}),
    label,
  };
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
    const knockoutRows = await this.pg.query<KnockoutRow>(
      `SELECT id, tournament_id, stage, ord, utc_date,
              home_kind, home_group, home_third_rank, home_source_match, home_label,
              away_kind, away_group, away_third_rank, away_source_match, away_label,
              home_team_id, away_team_id, home_goals, away_goals
       FROM knockout_fixtures ORDER BY stage, ord`,
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
      knockoutFixtures: knockoutRows.map(
        (k): KnockoutFixture => ({
          id: k.id,
          tournamentId: k.tournament_id,
          stage: k.stage,
          order: k.ord,
          utcDate: k.utc_date,
          home: slotFromRow(
            k.home_kind,
            k.home_group,
            k.home_third_rank,
            k.home_source_match,
            k.home_label,
          ),
          away: slotFromRow(
            k.away_kind,
            k.away_group,
            k.away_third_rank,
            k.away_source_match,
            k.away_label,
          ),
          homeTeamId: k.home_team_id,
          awayTeamId: k.away_team_id,
          homeGoals: k.home_goals,
          awayGoals: k.away_goals,
        }),
      ),
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

    const [leagues, teams, matches, knockoutFixtures] = await Promise.all([
      this.provider.getLeagues(),
      this.provider.getTeams(),
      this.provider.getMatches(),
      this.provider.getKnockoutFixtures?.() ?? Promise.resolve([]),
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
    for (const k of knockoutFixtures) {
      await this.pg.query(
        `INSERT INTO knockout_fixtures (
            id, tournament_id, stage, ord, utc_date,
            home_kind, home_group, home_third_rank, home_source_match, home_label,
            away_kind, away_group, away_third_rank, away_source_match, away_label,
            home_team_id, away_team_id, home_goals, away_goals)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         ON CONFLICT DO NOTHING`,
        [
          k.id, k.tournamentId, k.stage, k.order, k.utcDate,
          k.home.kind, k.home.group ?? null, k.home.thirdRank ?? null, k.home.sourceMatchId ?? null, k.home.label,
          k.away.kind, k.away.group ?? null, k.away.thirdRank ?? null, k.away.sourceMatchId ?? null, k.away.label,
          k.homeTeamId, k.awayTeamId, k.homeGoals, k.awayGoals,
        ],
      );
    }
    this.logger.log(
      `Seeded football data: ${leagues.length} leagues, ${teams.length} teams, ` +
        `${matches.length} matches, ${knockoutFixtures.length} knockout fixtures`,
    );
  }
}
