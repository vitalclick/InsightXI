/**
 * Core domain types for the Football Data Hub.
 * Kept framework-agnostic so providers, repositories and services share one model.
 */

export type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED";

export interface League {
  id: string;
  name: string;
  country: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  leagueId: string;
}

export interface Match {
  id: string;
  leagueId: string;
  /** Season label, e.g. "2025/26". */
  season: string;
  /** Matchday / round number within the season. */
  matchday: number;
  /** ISO datetime (UTC). */
  utcDate: string;
  status: MatchStatus;
  homeTeamId: string;
  awayTeamId: string;
  /** Full-time goals; null until the match has a result. */
  homeGoals: number | null;
  awayGoals: number | null;
  /** Expected goals (model/feed input); null for unplayed matches. */
  homeXg: number | null;
  awayXg: number | null;
}

// ---- Tournament / knockout bracket -----------------------------------------

/** Knockout stages, from the 32-team Round of 32 through to the Final. */
export type TournamentStage =
  | "GROUP"
  | "R32"
  | "R16"
  | "QF"
  | "SF"
  | "THIRD_PLACE"
  | "FINAL";

/**
 * How a knockout slot is filled. Group positions resolve from the group
 * standings; MATCH_* slots resolve from an earlier tie's result. This lets a
 * bracket be defined statically (a template) and resolved as results arrive.
 */
export type BracketSlotKind =
  | "GROUP_WINNER"
  | "GROUP_RUNNER_UP"
  | "THIRD_PLACE"
  | "MATCH_WINNER"
  | "MATCH_LOSER";

export interface BracketSlot {
  kind: BracketSlotKind;
  /** Group letter for GROUP_WINNER / GROUP_RUNNER_UP. */
  group?: string;
  /** 1-based rank among the qualifying third-placed teams (THIRD_PLACE). */
  thirdRank?: number;
  /** Source fixture id for MATCH_WINNER / MATCH_LOSER. */
  sourceMatchId?: string;
  /** Human-readable origin, e.g. "Winner Group A". */
  label: string;
}

/**
 * A single knockout tie. Stored as a static template (slot references + date);
 * `homeTeamId` / `awayTeamId` and goals stay null until the tie is resolvable
 * from group standings / earlier results.
 */
export interface KnockoutFixture {
  id: string;
  tournamentId: string;
  stage: TournamentStage;
  /** Slot order within the stage; drives the bracket tree. */
  order: number;
  utcDate: string;
  home: BracketSlot;
  away: BracketSlot;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
}

/** A single row in a computed league table. */
export interface StandingRow {
  position: number;
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  /** Most-recent-first results, e.g. ["W","D","L"]. */
  form: string[];
}
