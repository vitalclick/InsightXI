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
  modelBackend: string;
}

export interface TacticalProfile {
  teamId: string;
  name: string;
  formation: string;
  possession: number;
  pressingIntensity: number;
  defensiveLine: string;
  attackingFlow: string;
  transitionStyle: string;
}

export interface TacticalMatchup {
  home: TacticalProfile;
  away: TacticalProfile;
  tacticalEdge: number;
  insights: string[];
}

export type SubscriptionTier = "FREE" | "PREMIUM";

export interface PublicUser {
  id: string;
  email: string;
  tier: SubscriptionTier;
}

export interface AuthResponse {
  accessToken: string;
  user: PublicUser;
}

export interface H2HSummary {
  teamA: string;
  teamB: string;
  played: number;
  teamAWins: number;
  teamBWins: number;
  draws: number;
  avgGoalsPerGame: number;
  bttsRate: number;
}

export interface SeasonTrend {
  season: string;
  played: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  avgXgFor: number;
  avgXgAgainst: number;
}

export interface ModelMetrics {
  feature_version?: string;
  features?: string[];
  calibrated?: boolean;
  n_train?: number;
  n_test?: number;
  n?: number;
  log_loss?: number;
  brier?: number;
  accuracy?: number;
  ece?: number;
}

export interface EvaluationReport {
  status: string;
  report: ModelMetrics | null;
}

export interface LiveEvent {
  minute: number;
  type: "GOAL" | "KICKOFF" | "FULLTIME";
  teamId?: string;
  text: string;
}

export interface LiveSnapshot {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  minute: number;
  homeGoals: number;
  awayGoals: number;
  momentum: number;
  status: "LIVE" | "FINISHED";
  events: LiveEvent[];
}
