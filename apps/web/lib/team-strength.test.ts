import { clampAxis, strengthValues, compareRows } from "./team-strength";
import type { TeamRatings } from "./types";

function ratings(over: Partial<TeamRatings>): TeamRatings {
  return {
    teamId: "t",
    name: "Test FC",
    elo: 1500,
    attackStrength: 1.0,
    defenseStrength: 1.0,
    recentFormPoints: 7,
    avgXgFor: 1.4,
    avgXgAgainst: 1.4,
    ...over,
  };
}

describe("clampAxis", () => {
  it("keeps values within 6..100", () => {
    expect(clampAxis(-5)).toBe(6);
    expect(clampAxis(250)).toBe(100);
    expect(clampAxis(42)).toBe(42);
  });
});

describe("strengthValues", () => {
  it("returns six axes, all within range", () => {
    const v = strengthValues(ratings({}));
    expect(v).toHaveLength(6);
    expect(v.every((n) => n >= 6 && n <= 100)).toBe(true);
  });

  it("inverts defense so a lower defenseStrength scores higher", () => {
    const solid = strengthValues(ratings({ defenseStrength: 0.6 }))[1];
    const leaky = strengthValues(ratings({ defenseStrength: 1.6 }))[1];
    expect(solid).toBeGreaterThan(leaky);
  });

  it("higher Elo maps to a higher axis value", () => {
    const hi = strengthValues(ratings({ elo: 1680 }))[5];
    const lo = strengthValues(ratings({ elo: 1440 }))[5];
    expect(hi).toBeGreaterThan(lo);
  });
});

describe("compareRows", () => {
  const a = ratings({ name: "A", elo: 1600, recentFormPoints: 12, avgXgAgainst: 0.9 });
  const b = ratings({ name: "B", elo: 1500, recentFormPoints: 6, avgXgAgainst: 1.5 });
  const rows = compareRows(a, b);

  it("covers the six rating metrics", () => {
    expect(rows.map((r) => r.label)).toEqual([
      "Elo rating",
      "Recent form (/15)",
      "Attack strength",
      "Defense strength",
      "Avg xG for",
      "Avg xG against",
    ]);
  });

  it("flags the stronger side, respecting higher/lower-is-better", () => {
    const elo = rows.find((r) => r.label === "Elo rating")!;
    expect(elo.better).toBe("a"); // 1600 > 1500
    const xga = rows.find((r) => r.label === "Avg xG against")!;
    expect(xga.better).toBe("a"); // 0.9 < 1.5, lower is better
  });

  it("marks equal metrics as a tie", () => {
    const same = compareRows(ratings({ attackStrength: 1.2 }), ratings({ attackStrength: 1.2 }));
    expect(same.find((r) => r.label === "Attack strength")!.better).toBe("tie");
  });
});
