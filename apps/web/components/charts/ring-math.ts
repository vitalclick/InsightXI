/**
 * Pure geometry helpers for the probability ring. Kept separate so the arc
 * maths is unit-testable without rendering.
 */
export interface RingSegment {
  /** Length of the drawn dash (px along the circumference). */
  dash: number;
  /** Offset so segments sit head-to-tail around the circle (px). */
  offset: number;
}

/**
 * Convert a list of proportions (need not sum to exactly 1 — they are
 * normalised) into stroke-dasharray/­offset segments for an SVG circle of the
 * given radius. Segments are laid out clockwise starting at the top.
 */
export function ringSegments(values: number[], radius: number): RingSegment[] {
  const circumference = 2 * Math.PI * radius;
  const total = values.reduce((s, v) => s + Math.max(0, v), 0) || 1;
  let cumulative = 0;
  return values.map((v) => {
    const fraction = Math.max(0, v) / total;
    const dash = fraction * circumference;
    // Negative offset advances the start point clockwise.
    const offset = -cumulative * circumference;
    cumulative += fraction;
    return { dash, offset };
  });
}

/** Circumference for a given radius (exposed for the dasharray gap value). */
export function circumference(radius: number): number {
  return 2 * Math.PI * radius;
}
