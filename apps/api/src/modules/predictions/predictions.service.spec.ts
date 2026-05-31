import { Test } from "@nestjs/testing";
import { DataModule } from "../../repositories/data.module";
import { AnalyticsService } from "../analytics/analytics.service";
import { PredictionsService } from "./predictions.service";
import {
  AI_PREDICTION_CLIENT,
  AiFeedbackRequest,
  AiPredictionClient,
  AiPredictionRequest,
} from "./ai-prediction.client";

/** Fake AI client: echoes a deterministic response and captures the request. */
class FakeAiClient implements AiPredictionClient {
  lastRequest?: AiPredictionRequest;
  feedbacks: AiFeedbackRequest[] = [];
  pending: string[] = [];
  recomputed = 0;

  async predict(req: AiPredictionRequest) {
    this.lastRequest = req;
    return {
      match_id: req.match_id,
      outcome: { home_win: 0.55, draw: 0.25, away_win: 0.2 },
      expected_goals: { home: 1.8, away: 1.0 },
      markets: [{ market: "home_win", label: "Home Win", probability: 0.55 }],
      confidence_level: "Medium",
      top_selection: { label: "Home Win", probability: 0.55 },
      explanations: ["test reason"],
      model_backend: "analytical",
      adaptive: true,
      adjustment_trace: ["EPL: blend tilted — elo 0.40→0.50 (+0.10)"],
    };
  }

  async feedback(req: AiFeedbackRequest) {
    this.feedbacks.push(req);
  }

  async getPendingMatchIds() {
    return this.pending;
  }

  async recompute() {
    this.recomputed++;
  }
}

describe("PredictionsService", () => {
  let service: PredictionsService;
  let fake: FakeAiClient;
  let matchId: string;

  beforeEach(async () => {
    fake = new FakeAiClient();
    const moduleRef = await Test.createTestingModule({
      imports: [DataModule],
      providers: [
        PredictionsService,
        AnalyticsService,
        { provide: AI_PREDICTION_CLIENT, useValue: fake },
      ],
    }).compile();
    await moduleRef.init();
    service = moduleRef.get(PredictionsService);
    // Grab any finished match id from the seed.
    const { FootballRepository } = await import(
      "../../repositories/football.repository"
    );
    const repo = moduleRef.get(FootballRepository);
    matchId = repo.getMatches({ status: "FINISHED" })[0].id;
  });

  it("builds AI features and maps the response to camelCase", async () => {
    const result = await service.forMatch(matchId);

    // Request was built with positive strengths and an Elo for each side.
    expect(fake.lastRequest?.home.elo).toBeGreaterThan(0);
    expect(fake.lastRequest?.home.attack_strength).toBeGreaterThan(0);
    expect(fake.lastRequest?.league_avg_goals).toBeGreaterThan(0);

    // League id is forwarded for adaptive bucketing.
    expect(fake.lastRequest?.league_id).toBeTruthy();

    // Response mapped correctly.
    expect(result.outcome.homeWin).toBe(0.55);
    expect(result.confidenceLevel).toBe("Medium");
    expect(result.modelBackend).toBe("analytical");
    expect(result.explanations).toContain("test reason");

    // Adaptive fields surface through to the web shape.
    expect(result.adaptive).toBe(true);
    expect(result.adjustmentTrace.length).toBeGreaterThan(0);
  });
});
