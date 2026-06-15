/** Settlement state of a daily pick once its match has finished. */
export type DailyPickStatus = "PENDING" | "HIT" | "MISS" | "VOID";

/**
 * A single locked "Pick of the Day": the highest-confidence selection across
 * the day's fixtures, snapshotted once and kept stable so it can be tracked.
 */
export interface DailyPick {
  /** 'YYYY-MM-DD' (UTC). One pick per day; this is the lock key. */
  date: string;
  matchId: string;
  leagueId: string;
  homeTeam: string;
  awayTeam: string;
  /** ISO kickoff (the fixture's utcDate). */
  kickoff: string;
  /** Market code, e.g. "home_win", "over_2_5". */
  market: string;
  /** Human-readable selection, e.g. "Arsenal to win". */
  label: string;
  probability: number;
  confidenceLevel: string;
  explanations: string[];
  modelBackend: string;
  status: DailyPickStatus;
  /** Why it settled the way it did (e.g. "Final 2-1: home win"). */
  resultNote: string | null;
  createdAt: string;
  settledAt: string | null;
}

/** Aggregate track record over settled picks — backs the "reliable" claim. */
export interface DailyPickSummary {
  settled: number;
  hits: number;
  misses: number;
  voided: number;
  /** Hit rate over settled (excl. void), 0..1; null when nothing settled. */
  hitRate: number | null;
}

/**
 * Persistence boundary for the daily pick. In-memory (default) or Postgres,
 * selected by DATA_BACKEND — the service stays storage-agnostic.
 */
export abstract class DailyPickStore {
  /** The locked pick for a UTC date, if one exists. */
  abstract getByDate(date: string): Promise<DailyPick | undefined>;
  /** Persist a new pick. No-op if one already exists for that date (locked). */
  abstract save(pick: DailyPick): Promise<DailyPick>;
  /** Most recent picks first. */
  abstract list(limit: number): Promise<DailyPick[]>;
  /** Update a settled pick's status/result. */
  abstract settle(
    date: string,
    status: DailyPickStatus,
    resultNote: string,
    settledAt: string,
  ): Promise<void>;
}
