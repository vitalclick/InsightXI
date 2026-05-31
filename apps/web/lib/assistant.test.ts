import type { MatchPrediction, MatchView, Team, TeamRatings } from "./types";

// Mock the api client so answerQuery is tested in isolation.
jest.mock("../services/api-client", () => ({
  api: {
    teams: jest.fn(),
    fixtures: jest.fn(),
    prediction: jest.fn(),
    teamRatings: jest.fn(),
    tacticalMatchup: jest.fn(),
  },
}));

import { answerQuery } from "./assistant";
import { api } from "../services/api-client";

const mockApi = api as jest.Mocked<typeof api>;

const teams: Team[] = [
  { id: "ars", name: "Arsenal", shortName: "ARS", leagueId: "epl" },
  { id: "bur", name: "Burnley", shortName: "BUR", leagueId: "epl" },
  { id: "mci", name: "Manchester City", shortName: "MCI", leagueId: "epl" },
];

function fixture(id: string, home: string, away: string): MatchView {
  const t = (x: string) => teams.find((tm) => tm.id === x)!;
  return {
    id,
    leagueId: "epl",
    season: "2025/26",
    matchday: 1,
    utcDate: "2026-06-20T00:00:00.000Z",
    status: "SCHEDULED",
    homeTeamId: home,
    awayTeamId: away,
    homeTeamName: t(home).name,
    awayTeamName: t(away).name,
    homeGoals: null,
    awayGoals: null,
    homeXg: null,
    awayXg: null,
  };
}

function pred(over: Partial<MatchPrediction>): MatchPrediction {
  return {
    matchId: "m",
    outcome: { homeWin: 0.5, draw: 0.25, awayWin: 0.25 },
    expectedGoals: { home: 1.5, away: 1.1 },
    markets: [
      { market: "o25", label: "Over 2.5 Goals", probability: 0.55 },
      { market: "btts", label: "Both Teams To Score", probability: 0.5 },
    ],
    confidenceLevel: "Medium",
    topSelection: { label: "Home Win", probability: 0.5 },
    explanations: ["Stronger recent xG", "Home advantage"],
    modelBackend: "analytical",
    ...over,
  };
}

const ratings: TeamRatings = {
  teamId: "ars",
  name: "Arsenal",
  elo: 1540,
  attackStrength: 1.3,
  defenseStrength: 0.8,
  recentFormPoints: 12,
  avgXgFor: 1.9,
  avgXgAgainst: 0.9,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockApi.teams.mockResolvedValue(teams);
});

describe("answerQuery", () => {
  it("prompts when empty", async () => {
    const a = await answerQuery("   ");
    expect(a.title).toMatch(/ask about/i);
  });

  it("answers a team question from real ratings + next fixture", async () => {
    mockApi.fixtures.mockResolvedValue([fixture("g1", "ars", "bur")]);
    mockApi.prediction.mockResolvedValue(pred({ outcome: { homeWin: 0.7, draw: 0.2, awayWin: 0.1 } }));
    mockApi.teamRatings.mockResolvedValue(ratings);

    const a = await answerQuery("how are Arsenal doing?");
    expect(a.title).toBe("Arsenal");
    expect(a.lines.join(" ")).toMatch(/Elo 1540/);
    expect(a.lines.join(" ")).toMatch(/70% win probability/);
    expect(a.href).toBe("/matches/g1");
  });

  it("returns the top confidence pick by default", async () => {
    mockApi.fixtures.mockResolvedValue([fixture("g1", "ars", "bur"), fixture("g2", "mci", "ars")]);
    mockApi.prediction
      .mockResolvedValueOnce(pred({ topSelection: { label: "Home Win", probability: 0.55 } }))
      .mockResolvedValueOnce(pred({ topSelection: { label: "Home Win", probability: 0.78 } }));

    const a = await answerQuery("top pick today");
    expect(a.title).toMatch(/Top pick/);
    expect(a.lines[0]).toMatch(/78%/);
    expect(a.href).toBe("/matches/g2");
  });

  it("finds the highest-scoring projection", async () => {
    mockApi.fixtures.mockResolvedValue([fixture("g1", "ars", "bur"), fixture("g2", "mci", "ars")]);
    mockApi.prediction
      .mockResolvedValueOnce(pred({ expectedGoals: { home: 1.0, away: 0.8 } }))
      .mockResolvedValueOnce(pred({ expectedGoals: { home: 2.4, away: 1.6 } }));

    const a = await answerQuery("which game has the most goals expected?");
    expect(a.title).toMatch(/Highest-scoring/);
    expect(a.href).toBe("/matches/g2");
  });

  it("degrades gracefully when no predictions are available", async () => {
    mockApi.fixtures.mockResolvedValue([fixture("g1", "ars", "bur")]);
    mockApi.prediction.mockRejectedValue(new Error("AI offline"));

    const a = await answerQuery("top pick today");
    expect(a.note).toMatch(/AI service/i);
  });

  it("compares two named teams and deep-links to /compare", async () => {
    mockApi.fixtures.mockResolvedValue([]);
    mockApi.teamRatings.mockImplementation(async (id: string) =>
      id === "ars"
        ? { ...ratings, teamId: "ars", name: "Arsenal", elo: 1600 }
        : { ...ratings, teamId: "mci", name: "Manchester City", elo: 1500 },
    );

    const a = await answerQuery("compare Arsenal and Manchester City");
    expect(a.title).toBe("Arsenal vs Manchester City");
    expect(a.href).toBe("/compare?a=ars&b=mci");
    // Does not fan out predictions for a comparison.
    expect(mockApi.prediction).not.toHaveBeenCalled();
  });

  it("preserves query order when comparing (X vs Y)", async () => {
    mockApi.fixtures.mockResolvedValue([]);
    mockApi.teamRatings.mockImplementation(async (id: string) => ({ ...ratings, teamId: id, name: id }));

    const a = await answerQuery("Manchester City vs Arsenal");
    expect(a.href).toBe("/compare?a=mci&b=ars");
  });

  it("asks for two teams when a comparison names too few", async () => {
    mockApi.fixtures.mockResolvedValue([]);

    const a = await answerQuery("compare teams");
    expect(a.href).toBe("/compare");
    expect(a.note).toMatch(/name two teams/i);
  });

  it("answers a tactical matchup for two named teams", async () => {
    mockApi.fixtures.mockResolvedValue([]);
    mockApi.tacticalMatchup.mockResolvedValue({
      home: { teamId: "ars", name: "Arsenal", formation: "4-3-3", possession: 58, pressingIntensity: 70, defensiveLine: "High", attackingFlow: "Wing-focused", transitionStyle: "Possession build-up" },
      away: { teamId: "mci", name: "Manchester City", formation: "4-2-3-1", possession: 62, pressingIntensity: 66, defensiveLine: "High", attackingFlow: "Central", transitionStyle: "Possession build-up" },
      tacticalEdge: 12,
      insights: ["Arsenal's high press could disrupt City's build-up", "City should control possession"],
    });

    const a = await answerQuery("how do Arsenal and Manchester City match up tactically?");
    expect(a.title).toBe("Arsenal vs Manchester City — tactical");
    expect(a.href).toBe("/compare?a=ars&b=mci");
    expect(a.lines.join(" ")).toMatch(/tactical edge|edge \(\+12\)|holds the tactical edge/i);
    expect(mockApi.teamRatings).not.toHaveBeenCalled();
  });

  it("routes a single-team tactical query to the team answer", async () => {
    mockApi.fixtures.mockResolvedValue([fixture("g1", "ars", "bur")]);
    mockApi.prediction.mockResolvedValue(pred({}));
    mockApi.teamRatings.mockResolvedValue(ratings);

    const a = await answerQuery("what are Arsenal's tactics?");
    expect(a.title).toBe("Arsenal");
    expect(mockApi.tacticalMatchup).not.toHaveBeenCalled();
  });
});
