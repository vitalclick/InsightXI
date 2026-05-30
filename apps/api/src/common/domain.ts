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
