import { pressingGrid, attackGrid } from "./pitch-zones";
import type { TacticalProfile } from "./types";

function profile(overrides: Partial<TacticalProfile>): TacticalProfile {
  return {
    teamId: "t",
    name: "Test FC",
    formation: "4-3-3",
    possession: 55,
    pressingIntensity: 70,
    defensiveLine: "Medium",
    attackingFlow: "Central",
    transitionStyle: "Direct",
    ...overrides,
  };
}

describe("pressingGrid", () => {
  it("returns a rows×cols grid of values in [0,1]", () => {
    const g = pressingGrid(profile({}), 6, 5);
    expect(g).toHaveLength(6);
    expect(g.every((r) => r.length === 5)).toBe(true);
    expect(g.flat().every((v) => v >= 0 && v <= 1)).toBe(true);
  });

  it("a high line peaks higher up the pitch (lower row index) than a low line", () => {
    const peakRow = (line: string) => {
      const g = pressingGrid(profile({ defensiveLine: line }), 6, 5);
      const colMax = g.map((row) => Math.max(...row));
      return colMax.indexOf(Math.max(...colMax));
    };
    expect(peakRow("High")).toBeLessThan(peakRow("Low"));
  });

  it("higher pressing intensity yields hotter zones", () => {
    const sum = (p: number) => pressingGrid(profile({ pressingIntensity: p })).flat().reduce((a, b) => a + b, 0);
    expect(sum(90)).toBeGreaterThan(sum(30));
  });
});

describe("attackGrid", () => {
  it("loads the attacking third (top rows hotter than bottom)", () => {
    const g = attackGrid(profile({}), 6, 5);
    const topRow = g[0].reduce((a, b) => a + b, 0);
    const bottomRow = g[g.length - 1].reduce((a, b) => a + b, 0);
    expect(topRow).toBeGreaterThan(bottomRow);
  });

  it("wide attacking flow emphasises the flanks over the centre", () => {
    const g = attackGrid(profile({ attackingFlow: "Wing play" }), 6, 5);
    const top = g[0];
    const centre = top[Math.floor(top.length / 2)];
    const flank = Math.max(top[0], top[top.length - 1]);
    expect(flank).toBeGreaterThan(centre);
  });
});
