import { radarAxes, radarPoints } from "./radar";

describe("radar geometry", () => {
  it("places the first axis at the top (12 o'clock)", () => {
    const axes = radarAxes(4, 100, 100, 50);
    expect(axes[0].x).toBeCloseTo(100, 4);
    expect(axes[0].y).toBeCloseTo(50, 4); // straight up
  });

  it("scales point radius by value and clamps to [0,1]", () => {
    // Single full-value axis sits on the outer vertex (top).
    const full = radarPoints([1], 100, 100, 50);
    expect(full).toBe("100.00,50.00");
    // A value > 1 is clamped to the same outer vertex.
    const clamped = radarPoints([5], 100, 100, 50);
    expect(clamped).toBe("100.00,50.00");
    // Zero collapses to the centre.
    const zero = radarPoints([0], 100, 100, 50);
    expect(zero).toBe("100.00,100.00");
  });

  it("returns one point per value", () => {
    const pts = radarPoints([0.5, 0.5, 0.5, 0.5, 0.5], 100, 100, 50).split(" ");
    expect(pts).toHaveLength(5);
  });
});
