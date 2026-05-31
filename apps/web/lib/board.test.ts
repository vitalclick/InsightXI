import { availableMarkets, boardViews, pickCode, type BoardEntry } from "./board";
import type { MatchPrediction, MatchView } from "./types";

function match(id: string, leagueId = "epl"): MatchView {
  return {
    id,
    leagueId,
    season: "2025/26",
    matchday: 1,
    utcDate: "2026-06-20T00:00:00.000Z",
    status: "SCHEDULED",
    homeTeamId: "a",
    awayTeamId: "b",
    homeTeamName: "A",
    awayTeamName: "B",
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
    explanations: [],
    modelBackend: "analytical",
    ...over,
  };
}

describe("pickCode", () => {
  it("returns 1/X/2 for the leaned outcome", () => {
    expect(pickCode(pred({ outcome: { homeWin: 0.6, draw: 0.2, awayWin: 0.2 } }))).toBe("1");
    expect(pickCode(pred({ outcome: { homeWin: 0.2, draw: 0.2, awayWin: 0.6 } }))).toBe("2");
    expect(pickCode(pred({ outcome: { homeWin: 0.2, draw: 0.6, awayWin: 0.2 } }))).toBe("X");
  });
});

describe("availableMarkets", () => {
  it("collects distinct markets across predictions in first-seen order", () => {
    const entries: BoardEntry[] = [
      { m: match("1"), p: pred({}) },
      { m: match("2"), p: pred({ markets: [{ market: "o25", label: "Over 2.5 Goals", probability: 0.6 }] }) },
      { m: match("3"), p: undefined },
    ];
    expect(availableMarkets(entries)).toEqual([
      { key: "o25", label: "Over 2.5 Goals" },
      { key: "btts", label: "Both Teams To Score" },
    ]);
  });
});

describe("boardViews", () => {
  const entries: BoardEntry[] = [
    { m: match("hi"), p: pred({ topSelection: { label: "Home Win", probability: 0.82 } }) },
    { m: match("lo"), p: pred({ topSelection: { label: "Away Win", probability: 0.54 } }) },
    { m: match("none"), p: undefined },
  ];

  it("uses top selection and sorts by probability descending", () => {
    const views = boardViews(entries, { minConfidence: 0, market: null });
    expect(views.map((v) => v.m.id)).toEqual(["hi", "lo"]);
    expect(views[0].label).toBe("Home Win");
  });

  it("filters by the minimum confidence threshold", () => {
    const views = boardViews(entries, { minConfidence: 80, market: null });
    expect(views.map((v) => v.m.id)).toEqual(["hi"]);
  });

  it("ranks by a selected market and drops fixtures missing it", () => {
    const mixed: BoardEntry[] = [
      { m: match("withMk"), p: pred({ markets: [{ market: "o25", label: "Over 2.5 Goals", probability: 0.7 }] }) },
      { m: match("noMk"), p: pred({ markets: [{ market: "btts", label: "Both Teams To Score", probability: 0.9 }] }) },
    ];
    const views = boardViews(mixed, { minConfidence: 0, market: "o25" });
    expect(views.map((v) => v.m.id)).toEqual(["withMk"]);
    expect(views[0].prob).toBe(0.7);
    expect(views[0].label).toBe("Over 2.5 Goals");
  });

  it("skips entries without a prediction", () => {
    expect(boardViews(entries, { minConfidence: 0, market: null })).toHaveLength(2);
  });
});
