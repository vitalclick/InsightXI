// Web-side view of the API domain model (kept light; mirrors @insightxi/api).

export type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED";

export interface League {
  id: string;
  name: string;
  country: string;
}

export interface MatchView {
  id: string;
  leagueId: string;
  season: string;
  matchday: number;
  utcDate: string;
  status: MatchStatus;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeGoals: number | null;
  awayGoals: number | null;
  homeXg: number | null;
  awayXg: number | null;
}

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
  form: string[];
}

export interface MarketProbability {
  market: string;
  label: string;
  probability: number;
}

export interface MatchPrediction {
  matchId: string;
  outcome: { homeWin: number; draw: number; awayWin: number };
  expectedGoals: { home: number; away: number };
  markets: MarketProbability[];
  confidenceLevel: string;
  topSelection: { label: string; probability: number };
  explanations: string[];
}
