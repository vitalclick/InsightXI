import { buildMatchReport } from "./match-report";
import type { H2HSummary, MatchPrediction } from "./types";

function pred(over: Partial<MatchPrediction> = {}): MatchPrediction {
  return {
    matchId: "m1",
    outcome: { homeWin: 0.52, draw: 0.26, awayWin: 0.22 },
    expectedGoals: { home: 1.8, away: 1.1 },
    markets: [
      { market: "over_2_5", label: "Over 2.5 Goals", probability: 0.58 },
      { market: "btts", label: "Both Teams To Score", probability: 0.61 },
    ],
    confidenceLevel: "Strong",
    topSelection: { label: "Home Win", probability: 0.52 },
    explanations: ["Stronger home xG differential over the last six games."],
    modelBackend: "ensemble",
    ...over,
  };
}

describe("buildMatchReport", () => {
  it("grounds the summary in the model's own figures", () => {
    const r = buildMatchReport({ homeName: "Riverside", awayName: "Kingsgate", pred: pred() });
    expect(r.summary).toContain("Home Win");
    expect(r.summary).toContain("52%");
    expect(r.summary).toContain("1.8–1.1");
    // Headline names the favoured side when there's a clear edge.
    expect(r.headline).toContain("Riverside");
  });

  it("calls out a balanced game when home/away are close and the draw is live", () => {
    const r = buildMatchReport({
      homeName: "A",
      awayName: "B",
      pred: pred({ outcome: { homeWin: 0.34, draw: 0.33, awayWin: 0.33 } }),
    });
    expect(r.headline).toMatch(/balanced/i);
  });

  it("includes markets, form and h2h when provided", () => {
    const h2h: H2HSummary = {
      teamA: "Riverside",
      teamB: "Kingsgate",
      played: 6,
      teamAWins: 4,
      teamBWins: 1,
      draws: 1,
      avgGoalsPerGame: 2.5,
      bttsRate: 0.5,
    };
    const r = buildMatchReport({
      homeName: "Riverside",
      awayName: "Kingsgate",
      pred: pred(),
      homeForm: ["W", "W", "D"],
      awayForm: ["L", "D", "L"],
      h2h,
      tacticalEdge: 3,
    });
    expect(r.keyPoints.some((k) => k.includes("Over 2.5 goals: 58%"))).toBe(true);
    expect(r.keyPoints.some((k) => k.includes("Both teams to score: 61%"))).toBe(true);
    expect(r.paragraphs.join(" ")).toContain("Riverside carry the better recent form");
    expect(r.paragraphs.join(" ")).toContain("6 past meetings");
    expect(r.paragraphs.join(" ")).toContain("edge +3");
    // Always carries a non-betting disclaimer.
    expect(r.disclaimer.toLowerCase()).toContain("not a guaranteed outcome");
  });
});
