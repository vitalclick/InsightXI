/**
 * Minimal subset of API-Football (v3) response shapes that we consume.
 * https://www.api-football.com/documentation-v3
 */

export interface AfEnvelope<T> {
  response: T[];
  /**
   * API-Football returns HTTP 200 even for misconfigured requests; the reason
   * (e.g. "season not available for your plan", bad token, rate limit) lives
   * here. Empty array when OK; an object keyed by field when there's a problem.
   */
  errors?: Record<string, string> | string[];
}

export interface AfLeagueResponse {
  league: { id: number; name: string; type?: string };
  country: { name: string };
}

export interface AfTeamResponse {
  team: { id: number; name: string; code: string | null };
}

export interface AfFixtureResponse {
  fixture: { id: number; date: string; status: { short: string } };
  league: { id: number; season: number; round: string };
  teams: { home: { id: number }; away: { id: number } };
  goals: { home: number | null; away: number | null };
}
