import {
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { FootballRepository } from "../../repositories/football.repository";
import { AnalyticsService } from "../analytics/analytics.service";
import { WORLD_CUP_TOURNAMENT_ID } from "../../data/tournament";
import { TournamentService } from "../tournament/tournament.service";
import {
  AI_PREDICTION_CLIENT,
  AiPredictionClient,
  AiPredictionResponse,
} from "./ai-prediction.client";

/** Web-facing prediction shape (camelCase). */
export interface MatchPrediction {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  outcome: { homeWin: number; draw: number; awayWin: number };
  expectedGoals: { home: number; away: number };
  markets: Array<{ market: string; label: string; probability: number }>;
  confidenceLevel: string;
  topSelection: { label: string; probability: number };
  explanations: string[];
  modelBackend: string;
  /** Whether the Adaptive Intelligence Engine shaped this prediction. */
  adaptive: boolean;
  /** Human-readable record of any learned blend/calibration adjustments. */
  adjustmentTrace: string[];
}

@Injectable()
export class PredictionsService {
  constructor(
    private readonly repo: FootballRepository,
    private readonly analytics: AnalyticsService,
    private readonly tournament: TournamentService,
    @Inject(AI_PREDICTION_CLIENT)
    private readonly ai: AiPredictionClient,
  ) {}

  async forMatch(matchId: string): Promise<MatchPrediction> {
    const match = this.repo.getMatch(matchId);
    if (match) {
      return this.predictPair(
        match.homeTeamId,
        match.awayTeamId,
        matchId,
        match.leagueId,
        this.analytics.leagueAvgGoals(match.leagueId),
      );
    }

    // Fall back to a projected World Cup knockout tie (cross-group, neutral).
    const tie = this.tournament.resolvedTie(matchId);
    if (tie?.home && tie?.away) {
      return this.predictPair(
        tie.home.teamId,
        tie.away.teamId,
        matchId,
        WORLD_CUP_TOURNAMENT_ID,
        this.neutralLeagueAvg(tie.home.teamId, tie.away.teamId),
      );
    }

    throw new NotFoundException(`Match ${matchId} not found`);
  }

  /** Predict any two teams (a real fixture or a projected knockout tie). */
  private async predictPair(
    homeTeamId: string,
    awayTeamId: string,
    matchId: string,
    leagueId: string,
    leagueAvgGoals: number,
  ): Promise<MatchPrediction> {
    const home = this.analytics.ratingsForTeam(homeTeamId);
    const away = this.analytics.ratingsForTeam(awayTeamId);

    let ai: AiPredictionResponse;
    try {
      ai = await this.ai.predict({
        match_id: matchId,
        league_id: leagueId,
        league_avg_goals: leagueAvgGoals,
        home: toAiRating(home),
        away: toAiRating(away),
      });
    } catch {
      throw new ServiceUnavailableException(
        "Match intelligence is temporarily unavailable (AI service offline)",
      );
    }

    return {
      matchId: ai.match_id,
      homeTeam: home.name,
      awayTeam: away.name,
      outcome: {
        homeWin: ai.outcome.home_win,
        draw: ai.outcome.draw,
        awayWin: ai.outcome.away_win,
      },
      expectedGoals: ai.expected_goals,
      markets: ai.markets,
      confidenceLevel: ai.confidence_level,
      topSelection: ai.top_selection,
      explanations: ai.explanations,
      modelBackend: ai.model_backend,
      adaptive: ai.adaptive ?? false,
      adjustmentTrace: ai.adjustment_trace ?? [],
    };
  }

  /** Blend the two sides' group baselines for a neutral knockout tie. */
  private neutralLeagueAvg(homeTeamId: string, awayTeamId: string): number {
    const leagueOf = (id: string) => this.repo.getTeam(id)?.leagueId;
    const avgs = [homeTeamId, awayTeamId]
      .map(leagueOf)
      .filter((l): l is string => Boolean(l))
      .map((l) => this.analytics.leagueAvgGoals(l));
    if (avgs.length === 0) return 1.4;
    return avgs.reduce((s, a) => s + a, 0) / avgs.length;
  }
}

function toAiRating(r: {
  name: string;
  elo: number;
  attackStrength: number;
  defenseStrength: number;
  recentFormPoints: number;
  avgXgFor: number;
  avgXgAgainst: number;
}) {
  return {
    name: r.name,
    elo: r.elo,
    // Strengths must be > 0 for the model; clamp tiny/zero values.
    attack_strength: Math.max(0.2, r.attackStrength),
    defense_strength: Math.max(0.2, r.defenseStrength),
    recent_form_points: r.recentFormPoints,
    avg_xg_for: r.avgXgFor,
    avg_xg_against: r.avgXgAgainst,
  };
}
