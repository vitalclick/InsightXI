import { Test } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { DataModule } from "../../repositories/data.module";
import { WORLD_CUP_TOURNAMENT_ID } from "../../data/tournament";
import { AnalyticsService } from "../analytics/analytics.service";
import { MatchesService } from "../matches/matches.service";
import { PredictionsService } from "../predictions/predictions.service";
import { TacticalService } from "../tactical/tactical.service";
import { TacticalController } from "../tactical/tactical.controller";
import { TournamentService } from "./tournament.service";
import {
  AI_PREDICTION_CLIENT,
  AiPredictionClient,
  AiPredictionRequest,
} from "../predictions/ai-prediction.client";

/** Minimal AI stub so the prediction path resolves without the FastAPI service. */
class StubAi implements AiPredictionClient {
  last?: AiPredictionRequest;
  async predict(req: AiPredictionRequest) {
    this.last = req;
    return {
      match_id: req.match_id,
      outcome: { home_win: 0.6, draw: 0.25, away_win: 0.15 },
      expected_goals: { home: 1.7, away: 1.1 },
      markets: [{ market: "home_win", label: "Home Win", probability: 0.6 }],
      confidence_level: "Medium",
      top_selection: { label: "Home Win", probability: 0.6 },
      explanations: ["stub"],
      model_backend: "analytical",
    };
  }
  async feedback() {}
  async getPendingMatchIds() {
    return [];
  }
  async recompute() {}
}

describe("World Cup knockout ties are wired into the match surfaces", () => {
  let matches: MatchesService;
  let predictions: PredictionsService;
  let tactical: TacticalController;
  let tieId: string;
  let playoffId: string;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DataModule],
      controllers: [TacticalController],
      providers: [
        MatchesService,
        PredictionsService,
        TournamentService,
        AnalyticsService,
        TacticalService,
        { provide: AI_PREDICTION_CLIENT, useValue: new StubAi() },
      ],
    }).compile();
    await moduleRef.init();

    matches = moduleRef.get(MatchesService);
    predictions = moduleRef.get(PredictionsService);
    tactical = moduleRef.get(TacticalController);

    const bracket = moduleRef.get(TournamentService).bracket();
    tieId = bracket.rounds[2].ties[0].id; // a quarter-final tie
    playoffId = bracket.thirdPlacePlayoff!.id;
  });

  it("resolves a knockout tie id through GET /matches/:id", () => {
    const view = matches.byId(tieId);
    expect(view.id).toBe(tieId);
    expect(view.leagueId).toBe(WORLD_CUP_TOURNAMENT_ID);
    expect(view.homeTeamName).toBeTruthy();
    expect(view.awayTeamName).toBeTruthy();
    // The third-place play-off resolves too.
    expect(matches.byId(playoffId).id).toBe(playoffId);
  });

  it("predicts a knockout tie through the prediction engine", async () => {
    const pred = await predictions.forMatch(tieId);
    expect(pred.homeTeam).toBeTruthy();
    expect(pred.awayTeam).toBeTruthy();
    expect(pred.outcome.homeWin + pred.outcome.draw + pred.outcome.awayWin).toBeCloseTo(1, 5);
  });

  it("produces a tactical matchup for a knockout tie", () => {
    const matchup = tactical.match(tieId);
    expect(matchup.home).toBeTruthy();
    expect(matchup.away).toBeTruthy();
  });

  it("still 404s for an unknown id", () => {
    expect(() => matches.byId("not-a-real-match")).toThrow(NotFoundException);
  });
});
