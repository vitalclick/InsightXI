import { Injectable } from "@nestjs/common";
import { PgService } from "../../db/pg.service";
import {
  DailyPick,
  DailyPickStatus,
  DailyPickStore,
} from "./daily-pick.store";

interface Row {
  pick_date: string;
  match_id: string;
  league_id: string;
  home_team: string;
  away_team: string;
  kickoff: string;
  market: string;
  label: string;
  probability: string | number;
  confidence_level: string;
  explanations: string;
  model_backend: string;
  status: DailyPickStatus;
  result_note: string | null;
  created_at: string;
  settled_at: string | null;
}

function toPick(r: Row): DailyPick {
  let explanations: string[] = [];
  try {
    explanations = JSON.parse(r.explanations) as string[];
  } catch {
    explanations = [];
  }
  return {
    date: r.pick_date,
    matchId: r.match_id,
    leagueId: r.league_id,
    homeTeam: r.home_team,
    awayTeam: r.away_team,
    kickoff: r.kickoff,
    market: r.market,
    label: r.label,
    probability:
      typeof r.probability === "string"
        ? parseFloat(r.probability)
        : r.probability,
    confidenceLevel: r.confidence_level,
    explanations,
    modelBackend: r.model_backend,
    status: r.status,
    resultNote: r.result_note,
    createdAt: r.created_at,
    settledAt: r.settled_at,
  };
}

/** Postgres-backed daily-pick store (DATA_BACKEND=postgres). */
@Injectable()
export class PostgresDailyPickStore extends DailyPickStore {
  constructor(private readonly pg: PgService) {
    super();
  }

  async getByDate(date: string): Promise<DailyPick | undefined> {
    const rows = await this.pg.query<Row>(
      "SELECT * FROM daily_picks WHERE pick_date = $1",
      [date],
    );
    return rows[0] ? toPick(rows[0]) : undefined;
  }

  async save(pick: DailyPick): Promise<DailyPick> {
    // ON CONFLICT DO NOTHING keeps the day's pick locked to the first write;
    // RETURNING is empty on conflict, so re-read to return the locked row.
    await this.pg.query(
      `INSERT INTO daily_picks (pick_date, match_id, league_id, home_team, away_team,
         kickoff, market, label, probability, confidence_level, explanations,
         model_backend, status, result_note, created_at, settled_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (pick_date) DO NOTHING`,
      [
        pick.date, pick.matchId, pick.leagueId, pick.homeTeam, pick.awayTeam,
        pick.kickoff, pick.market, pick.label, pick.probability,
        pick.confidenceLevel, JSON.stringify(pick.explanations),
        pick.modelBackend, pick.status, pick.resultNote, pick.createdAt,
        pick.settledAt,
      ],
    );
    return (await this.getByDate(pick.date)) ?? pick;
  }

  async list(limit: number): Promise<DailyPick[]> {
    const rows = await this.pg.query<Row>(
      "SELECT * FROM daily_picks ORDER BY pick_date DESC LIMIT $1",
      [limit],
    );
    return rows.map(toPick);
  }

  async settle(
    date: string,
    status: DailyPickStatus,
    resultNote: string,
    settledAt: string,
  ): Promise<void> {
    await this.pg.query(
      "UPDATE daily_picks SET status = $2, result_note = $3, settled_at = $4 WHERE pick_date = $1",
      [date, status, resultNote, settledAt],
    );
  }
}
