import { poissonPmf, scoreMatrix } from "./poisson";

describe("poissonPmf", () => {
  it("returns e^-λ at k=0", () => {
    expect(poissonPmf(0, 1.5)).toBeCloseTo(Math.exp(-1.5), 6);
  });

  it("matches the closed form for a few k", () => {
    // λ=2: P(1) = 2·e^-2, P(2) = 2·e^-2
    expect(poissonPmf(1, 2)).toBeCloseTo(2 * Math.exp(-2), 6);
    expect(poissonPmf(2, 2)).toBeCloseTo(2 * Math.exp(-2), 6);
  });

  it("is a (truncated) distribution summing toward 1", () => {
    const total = Array.from({ length: 20 }, (_, k) => poissonPmf(k, 1.8)).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(0.999);
    expect(total).toBeLessThanOrEqual(1.0000001);
  });
});

describe("scoreMatrix", () => {
  it("produces (size+1)^2 cells", () => {
    const m = scoreMatrix(1.5, 1.1, 4);
    expect(m.cells).toHaveLength(25);
    expect(m.size).toBe(4);
  });

  it("identifies the modal scoreline as the max-probability cell", () => {
    const m = scoreMatrix(1.6, 1.0);
    const maxCell = m.cells.reduce((best, c) => (c.prob > best.prob ? c : best));
    expect(m.best).toEqual(maxCell);
    expect(m.max).toBeCloseTo(maxCell.prob, 10);
  });

  it("favours the home side when its expected goals are higher", () => {
    const m = scoreMatrix(2.2, 0.7);
    expect(m.homeWin).toBeGreaterThan(m.awayWin);
    expect(m.homeWin).toBeGreaterThan(m.draw);
  });

  it("implied outcome probabilities are non-negative and within the grid mass", () => {
    const m = scoreMatrix(1.4, 1.4);
    const sum = m.homeWin + m.draw + m.awayWin;
    expect(m.homeWin).toBeGreaterThanOrEqual(0);
    expect(sum).toBeGreaterThan(0.95);
    expect(sum).toBeLessThanOrEqual(1.0000001);
    // Symmetric expected goals ⇒ home and away win mass are equal.
    expect(m.homeWin).toBeCloseTo(m.awayWin, 6);
  });
});
