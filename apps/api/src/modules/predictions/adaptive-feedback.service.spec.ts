import { Test } from "@nestjs/testing";
import { DataModule } from "../../repositories/data.module";
import { FootballRepository } from "../../repositories/football.repository";
import { AdaptiveFeedbackService } from "./adaptive-feedback.service";
import {
  AI_PREDICTION_CLIENT,
  AiFeedbackRequest,
  AiPredictionClient,
  AiPredictionRequest,
} from "./ai-prediction.client";

class FakeAiClient implements AiPredictionClient {
  feedbacks: AiFeedbackRequest[] = [];
  pending: string[] = [];
  recomputed = 0;

  async predict(req: AiPredictionRequest) {
    return {
      match_id: req.match_id,
      outcome: { home_win: 0.5, draw: 0.3, away_win: 0.2 },
      expected_goals: { home: 1.5, away: 1.0 },
      markets: [],
      confidence_level: "Medium",
      top_selection: { label: "Home Win", probability: 0.5 },
      explanations: [],
      model_backend: "analytical",
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

describe("AdaptiveFeedbackService", () => {
  let service: AdaptiveFeedbackService;
  let fake: FakeAiClient;
  let repo: FootballRepository;

  beforeEach(async () => {
    fake = new FakeAiClient();
    const moduleRef = await Test.createTestingModule({
      imports: [DataModule],
      providers: [
        AdaptiveFeedbackService,
        { provide: AI_PREDICTION_CLIENT, useValue: fake },
      ],
    }).compile();
    await moduleRef.init();
    service = moduleRef.get(AdaptiveFeedbackService);
    repo = moduleRef.get(FootballRepository);
  });

  it("feeds back finished pending matches and recomputes once", async () => {
    const finished = repo.getMatches({ status: "FINISHED" }).slice(0, 3);
    fake.pending = finished.map((m) => m.id);

    const result = await service.reconcileAndRecompute();

    expect(result.resolved).toBe(3);
    expect(fake.feedbacks).toHaveLength(3);
    // Outcome encoding is derived from the actual goals.
    const first = finished[0];
    const expected =
      first.homeGoals! > first.awayGoals!
        ? 0
        : first.homeGoals! === first.awayGoals!
          ? 1
          : 2;
    const fb = fake.feedbacks.find((f) => f.match_id === first.id);
    expect(fb?.outcome).toBe(expected);
    expect(fb?.league_id).toBe(first.leagueId);
    expect(fake.recomputed).toBe(1); // one recompute after the batch
  });

  it("skips unplayed matches and does not recompute when nothing resolves", async () => {
    const scheduled = repo.getMatches({ status: "SCHEDULED" }).slice(0, 2);
    fake.pending = scheduled.map((m) => m.id);

    const result = await service.reconcileAndRecompute();

    expect(result.resolved).toBe(0);
    expect(fake.feedbacks).toHaveLength(0);
    expect(fake.recomputed).toBe(0);
  });

  it("is a safe no-op when the AI service is unreachable", async () => {
    fake.getPendingMatchIds = async () => {
      throw new Error("offline");
    };
    const result = await service.reconcileAndRecompute();
    expect(result).toEqual({ resolved: 0, pending: 0 });
  });
});
