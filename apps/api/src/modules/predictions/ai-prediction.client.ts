import { Injectable, Logger } from "@nestjs/common";

/** Request payload sent to the AI service /predict endpoint (snake_case). */
export interface AiPredictionRequest {
  match_id: string;
  /** League bucket for adaptive weighting / calibration / experience memory. */
  league_id?: string;
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
  /** Adaptive Intelligence Engine fields (present when ADAPTIVE_ENABLED). */
  adaptive?: boolean;
  adjustment_trace?: string[];
}

/** Actual result of a finished match, fed back into Experience Memory. */
export interface AiFeedbackRequest {
  match_id: string;
  league_id?: string;
  outcome: 0 | 1 | 2; // 0 home win, 1 draw, 2 away win
  home_goals?: number;
  away_goals?: number;
}

export interface AiPredictionClient {
  predict(req: AiPredictionRequest): Promise<AiPredictionResponse>;
  /** Record a finished match's result (idempotent). */
  feedback(req: AiFeedbackRequest): Promise<void>;
  /** Match ids the AI service predicted but hasn't seen a result for. */
  getPendingMatchIds(): Promise<string[]>;
  /** Rebuild the adaptive state from accumulated experience. */
  recompute(): Promise<void>;
}

export const AI_PREDICTION_CLIENT = Symbol("AI_PREDICTION_CLIENT");

/** Calls the FastAPI AI service over HTTP. */
@Injectable()
export class HttpAiPredictionClient implements AiPredictionClient {
  private readonly logger = new Logger(HttpAiPredictionClient.name);
  private readonly baseUrl =
    process.env.AI_SERVICE_URL ?? "http://localhost:8000";
  // Shared secret for service-to-service auth; the AI service rejects calls
  // without it when AI_SERVICE_TOKEN is set (no-op when unset → sandbox).
  private readonly internalToken = process.env.AI_SERVICE_TOKEN;

  private async request<T>(
    path: string,
    init: RequestInit,
    timeoutMs = 5000,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(this.internalToken ? { "x-internal-key": this.internalToken } : {}),
          ...(init.headers ?? {}),
        },
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`AI service responded ${res.status}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      this.logger.warn(`AI service request ${path} failed: ${(err as Error).message}`);
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  predict(req: AiPredictionRequest): Promise<AiPredictionResponse> {
    return this.request<AiPredictionResponse>("/predict", {
      method: "POST",
      body: JSON.stringify(req),
    });
  }

  async feedback(req: AiFeedbackRequest): Promise<void> {
    await this.request("/feedback", { method: "POST", body: JSON.stringify(req) });
  }

  async getPendingMatchIds(): Promise<string[]> {
    const body = await this.request<{ match_ids: string[] }>("/feedback/pending", {
      method: "GET",
    });
    return body.match_ids ?? [];
  }

  async recompute(): Promise<void> {
    // Recompute can be heavier than a single prediction; give it more headroom.
    await this.request("/adaptive/recompute", { method: "POST" }, 20000);
  }
}
