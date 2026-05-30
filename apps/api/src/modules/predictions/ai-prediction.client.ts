import { Injectable, Logger } from "@nestjs/common";

/** Request payload sent to the AI service /predict endpoint (snake_case). */
export interface AiPredictionRequest {
  match_id: string;
  league_avg_goals: number;
  home: AiTeamRating;
  away: AiTeamRating;
}

export interface AiTeamRating {
  name: string;
  elo: number;
  attack_strength: number;
  defense_strength: number;
  recent_form_points: number;
  avg_xg_for: number;
  avg_xg_against: number;
}

/** Response shape from the AI service (snake_case). */
export interface AiPredictionResponse {
  match_id: string;
  outcome: { home_win: number; draw: number; away_win: number };
  expected_goals: { home: number; away: number };
  markets: Array<{ market: string; label: string; probability: number }>;
  confidence_level: string;
  top_selection: { label: string; probability: number };
  explanations: string[];
  model_backend: string;
}

export interface AiPredictionClient {
  predict(req: AiPredictionRequest): Promise<AiPredictionResponse>;
}

export const AI_PREDICTION_CLIENT = Symbol("AI_PREDICTION_CLIENT");

/** Calls the FastAPI AI service over HTTP. */
@Injectable()
export class HttpAiPredictionClient implements AiPredictionClient {
  private readonly logger = new Logger(HttpAiPredictionClient.name);
  private readonly baseUrl =
    process.env.AI_SERVICE_URL ?? "http://localhost:8000";

  async predict(req: AiPredictionRequest): Promise<AiPredictionResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`${this.baseUrl}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`AI service responded ${res.status}`);
      }
      return (await res.json()) as AiPredictionResponse;
    } catch (err) {
      this.logger.warn(`AI service unreachable: ${(err as Error).message}`);
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}
