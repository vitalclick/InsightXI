import { DailyPickService } from "./daily-pick.service";
import { InMemoryDailyPickStore } from "./in-memory-daily-pick.store";
import { MatchPrediction, PredictionsService } from "./predictions.service";
import { FootballRepository } from "../../repositories/football.repository";
import { Match } from "../../common/domain";

function match(over: Partial<Match> = {}): Match {
  return {
    id: "m1",
    leagueId: "epl",
    season: "2025/26",
    matchday: 1,
    utcDate: "2099-01-01T15:00:00.000Z",
    status: "SCHEDULED",
    homeTeamId: "h",
    awayTeamId: "a",
    homeGoals: null,
    awayGoals: null,
    homeXg: null,
    awayXg: null,
    ...over,
  };
}

function prediction(over: Partial<MatchPrediction> = {}): MatchPrediction {
  return {
    matchId: "m1",
    homeTeam: "Home FC",
    awayTeam: "Away FC",
    outcome: { homeWin: 0.6, draw: 0.2, awayWin: 0.2 },
    expectedGoals: { home: 1.6, away: 0.9 },
    markets: [],
    confidenceLevel: "Strong",
    topSelection: { label: "Home Win", probability: 0.6 },
    explanations: ["Stronger xG"],
    modelBackend: "ensemble",
    adaptive: false,
    adjustmentTrace: [],
    ...over,
  };
}

/** Fresh, isolated fixtures + stubs for each test. */
function setup() {
  const matches: Record<string, Match> = {
    m1: match({ id: "m1", homeTeamId: "h1", awayTeamId: "a1" }),
    m2: match({ id: "m2", homeTeamId: "h2", awayTeamId: "a2" }),
  };
  const preds: Record<string, MatchPrediction> = {
    m1: prediction({
      matchId: "m1",
      homeTeam: "Riverside",
      awayTeam: "Kingsgate",
      topSelection: { label: "Home Win", probability: 0.62 },
    }),
    m2: prediction({
      matchId: "m2",
      homeTeam: "Northgate",
      awayTeam: "Seaside",
      confidenceLevel: "Very Strong",
      topSelection: { label: "Away Win", probability: 0.81 },
    }),
  };
  const repo = {
    getMatches: (f?: { status?: string }) =>
      Object.values(matches).filter((m) => !f?.status || m.status === f.status),
    getMatch: (id: string) => matches[id],
  } as unknown as FootballRepository;
  const predictions = {
    forMatch: async (id: string) => preds[id],
  } as unknown as PredictionsService;
  const store = new InMemoryDailyPickStore();
  return {
    matches,
    preds,
    store,
    svc: new DailyPickService(repo, predictions, store),
  };
}

describe("DailyPickService", () => {
  it("selects the single highest-confidence headline and locks it", async () => {
    const { svc, preds } = setup();

    const pick = await svc.getToday();
    expect(pick).not.toBeNull();
    // m2 (0.81) beats m1 (0.62); away-win maps to the away team label.
    expect(pick!.matchId).toBe("m2");
    expect(pick!.market).toBe("away_win");
    expect(pick!.label).toBe("Seaside to win");
    expect(pick!.probability).toBeCloseTo(0.81);
    expect(pick!.status).toBe("PENDING");

    // Locked: a later call returns the same pick even if the model shifts.
    preds.m1.topSelection = { label: "Home Win", probability: 0.99 };
    const again = await svc.getToday();
    expect(again!.matchId).toBe("m2");
  });

  it("returns null when no predictions are available", async () => {
    const { store } = setup();
    const offline = {
      forMatch: async () => {
        throw new Error("AI offline");
      },
    } as unknown as PredictionsService;
    const repo = {
      getMatches: () => [match({ id: "m1" })],
      getMatch: () => match({ id: "m1" }),
    } as unknown as FootballRepository;
    const svc = new DailyPickService(repo, offline, store);
    expect(await svc.getToday()).toBeNull();
  });

  it("settles a pending pick once its match has finished", async () => {
    const { svc, matches } = setup();
    const pick = await svc.getToday();
    expect(pick!.matchId).toBe("m2");
    expect(pick!.status).toBe("PENDING");

    // m2 finishes 0-2 (away win) -> the away-win pick HITs.
    matches.m2 = match({
      id: "m2",
      homeTeamId: "h2",
      awayTeamId: "a2",
      status: "FINISHED",
      homeGoals: 0,
      awayGoals: 2,
    });

    const { picks, summary } = await svc.history();
    const settled = picks.find((p) => p.matchId === "m2");
    expect(settled!.status).toBe("HIT");
    expect(settled!.resultNote).toBe("Final 0-2 · away win");
    expect(summary.hits).toBe(1);
    expect(summary.hitRate).toBe(1);
  });
});
