import {
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { FootballRepository } from "../../repositories/football.repository";
import { AnalyticsService } from "../analytics/analytics.service";
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
}

@Injectable()
export class PredictionsService {
  constructor(
    private readonly repo: FootballRepository,
    private readonly analytics: AnalyticsService,
    @Inject(AI_PREDICTION_CLIENT)
    private readonly ai: AiPredictionClient,
  ) {}

  async forMatch(matchId: string): Promise<MatchPrediction> {
    const match = this.repo.getMatch(matchId);
    if (!match) throw new NotFoundException(`Match ${matchId} not found`);

    const home = this.analytics.ratingsForTeam(match.homeTeamId);
    const away = this.analytics.ratingsForTeam(match.awayTeamId);

    let ai: AiPredictionResponse;
    try {
      ai = await this.ai.predict({
        match_id: matchId,
        league_avg_goals: this.analytics.leagueAvgGoals(match.leagueId),
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
    };
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
