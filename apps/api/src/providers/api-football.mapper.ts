/**
 * Pure mapping functions from API-Football response shapes to our domain.
 * Kept side-effect free so they are trivially unit-testable.
 */
import { League, Match, MatchStatus, Team } from "../common/domain";
import {
  AfFixtureResponse,
  AfLeagueResponse,
  AfTeamResponse,
} from "./api-football.types";

const FINISHED_CODES = new Set(["FT", "AET", "PEN", "WO"]);
const LIVE_CODES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT", "SUSP"]);

/** API-Football uses a start-year integer (2025) -> "2025/26". */
export function seasonLabel(year: number): string {
  const next = (year + 1) % 100;
  return `${year}/${next.toString().padStart(2, "0")}`;
}

export function mapStatus(short: string): MatchStatus {
  if (FINISHED_CODES.has(short)) return "FINISHED";
  if (LIVE_CODES.has(short)) return "LIVE";
  return "SCHEDULED";
}

/** "Regular Season - 12" -> 12; falls back to 0 when no number present. */
export function parseMatchday(round: string): number {
  const m = round.match(/(\d+)\s*$/);
  return m ? Number(m[1]) : 0;
}

export function mapLeague(r: AfLeagueResponse): League {
  return {
    id: String(r.league.id),
    name: r.league.name,
    country: r.country?.name ?? "",
  };
}

export function mapTeam(r: AfTeamResponse, leagueId: string): Team {
  return {
    id: String(r.team.id),
    name: r.team.name,
    shortName: r.team.code ?? r.team.name.slice(0, 3).toUpperCase(),
    leagueId,
  };
}

export function mapFixture(r: AfFixtureResponse): Match {
  const status = mapStatus(r.fixture.status.short);
  const played = status === "FINISHED";
  return {
    id: String(r.fixture.id),
    leagueId: String(r.league.id),
    season: seasonLabel(r.league.season),
    matchday: parseMatchday(r.league.round),
    utcDate: r.fixture.date,
    status,
    homeTeamId: String(r.teams.home.id),
    awayTeamId: String(r.teams.away.id),
    homeGoals: played ? (r.goals.home ?? 0) : null,
    awayGoals: played ? (r.goals.away ?? 0) : null,
    // xG is not part of the base fixtures feed; left null until enriched.
    homeXg: null,
    awayXg: null,
  };
}
