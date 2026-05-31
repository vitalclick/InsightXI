import { distinctMatchdays, filterByMatchday } from "./fixtures";
import type { MatchView } from "./types";

function fx(id: string, matchday: number): MatchView {
  return {
    id,
    leagueId: "epl",
    season: "2025/26",
    matchday,
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

describe("distinctMatchdays", () => {
  it("returns unique matchdays ascending", () => {
    expect(distinctMatchdays([fx("1", 3), fx("2", 1), fx("3", 3), fx("4", 2)])).toEqual([1, 2, 3]);
  });

  it("handles an empty list", () => {
    expect(distinctMatchdays([])).toEqual([]);
  });
});

describe("filterByMatchday", () => {
  const fixtures = [fx("1", 1), fx("2", 2), fx("3", 2)];

  it("returns everything when matchday is null", () => {
    expect(filterByMatchday(fixtures, null)).toHaveLength(3);
  });

  it("filters to a single matchday", () => {
    expect(filterByMatchday(fixtures, 2).map((m) => m.id)).toEqual(["2", "3"]);
  });

  it("returns an empty list for a matchday with no fixtures", () => {
    expect(filterByMatchday(fixtures, 9)).toEqual([]);
  });
});
