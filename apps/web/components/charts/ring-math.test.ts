import { circumference, ringSegments } from "./ring-math";

describe("ringSegments", () => {
  const r = 50;
  const c = circumference(r);

  it("dash lengths sum to the full circumference", () => {
    const segs = ringSegments([0.5, 0.25, 0.25], r);
    const totalDash = segs.reduce((s, seg) => s + seg.dash, 0);
    expect(totalDash).toBeCloseTo(c, 5);
  });

  it("normalises proportions that do not sum to 1", () => {
    const segs = ringSegments([2, 1, 1], r); // -> 0.5/0.25/0.25
    expect(segs[0].dash).toBeCloseTo(c * 0.5, 5);
    expect(segs[1].dash).toBeCloseTo(c * 0.25, 5);
  });

  it("lays segments head-to-tail (cumulative offsets)", () => {
    const segs = ringSegments([0.5, 0.5], r);
    expect(segs[0].offset).toBeCloseTo(0, 5);
    expect(segs[1].offset).toBeCloseTo(-c * 0.5, 5);
  });

  it("treats negative values as zero", () => {
    const segs = ringSegments([-1, 1], r);
    expect(segs[0].dash).toBe(0);
    expect(segs[1].dash).toBeCloseTo(c, 5);
  });
});
