import { liveWinProb } from "./live-winprob";

const base = { minute: 45, homeGoals: 0, awayGoals: 0, momentum: 50, status: "LIVE" as const };

describe("liveWinProb", () => {
  it("returns whole percentages summing to 100", () => {
    const p = liveWinProb(base);
    expect(p.h + p.d + p.a).toBe(100);
    expect([p.h, p.d, p.a].every((v) => Number.isInteger(v) && v >= 0)).toBe(true);
  });

  it("always sums to exactly 100 across many states (no fractional drift)", () => {
    for (let minute = 0; minute <= 90; minute += 5) {
      for (let lead = -2; lead <= 2; lead++) {
        for (const momentum of [10, 37, 50, 63, 90]) {
          const p = liveWinProb({ minute, homeGoals: Math.max(0, lead), awayGoals: Math.max(0, -lead), momentum, status: "LIVE" });
          expect(p.h + p.d + p.a).toBe(100);
          expect(Number.isInteger(p.a)).toBe(true);
        }
      }
    }
  });

  it("a settled finished match is 100% for the winner", () => {
    expect(liveWinProb({ ...base, status: "FINISHED", minute: 90, homeGoals: 2, awayGoals: 0 })).toMatchObject({ h: 100, d: 0, a: 0 });
    expect(liveWinProb({ ...base, status: "FINISHED", minute: 90, homeGoals: 1, awayGoals: 1 })).toMatchObject({ h: 0, d: 100, a: 0 });
  });

  it("a late lead pushes the leader's probability up", () => {
    const level = liveWinProb({ ...base, minute: 85 });
    const homeLead = liveWinProb({ ...base, minute: 85, homeGoals: 1 });
    expect(homeLead.h).toBeGreaterThan(level.h);
    expect(homeLead.h).toBeGreaterThan(homeLead.a);
  });

  it("draw share shrinks as the match runs out at level scores", () => {
    const early = liveWinProb({ ...base, minute: 10 });
    const late = liveWinProb({ ...base, minute: 80 });
    expect(early.d).toBeGreaterThan(late.d);
  });

  it("home momentum tilts the lean toward the home side early on", () => {
    const homeMom = liveWinProb({ ...base, minute: 20, momentum: 80 });
    const awayMom = liveWinProb({ ...base, minute: 20, momentum: 20 });
    expect(homeMom.h).toBeGreaterThan(awayMom.h);
  });
});
