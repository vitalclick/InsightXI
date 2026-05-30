/**
 * Minimal subset of API-Football (v3) response shapes that we consume.
 * https://www.api-football.com/documentation-v3
 */

export interface AfEnvelope<T> {
  response: T[];
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
