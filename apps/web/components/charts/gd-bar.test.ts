import { gdBarGeometry, maxAbsGd } from "./gd-bar";

describe("gdBarGeometry", () => {
  it("grows right for positive GD, scaled to the table max", () => {
    const g = gdBarGeometry(10, 20);
    expect(g.side).toBe("positive");
    expect(g.widthPct).toBe(50);
  });

  it("grows left for negative GD", () => {
    const g = gdBarGeometry(-20, 20);
    expect(g.side).toBe("negative");
    expect(g.widthPct).toBe(100);
  });

  it("is empty at zero", () => {
    expect(gdBarGeometry(0, 20)).toEqual({ widthPct: 0, side: "zero" });
  });

  it("clamps to 100% and guards against a zero max", () => {
    expect(gdBarGeometry(30, 20).widthPct).toBe(100);
    expect(gdBarGeometry(5, 0)).toEqual({ widthPct: 0, side: "zero" });
  });
});

describe("maxAbsGd", () => {
  it("returns the largest magnitude, at least 1", () => {
    expect(maxAbsGd([3, -12, 5])).toBe(12);
    expect(maxAbsGd([0, 0])).toBe(1);
  });
});
