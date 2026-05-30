/**
 * Pure geometry for a diverging goal-difference bar centred at zero.
 * Given a value and the max absolute value across the table, returns the
 * fill width (% of one half-track) and which side it grows toward.
 */
export interface GdBarGeometry {
  /** 0..100, width as a percentage of one half of the track. */
  widthPct: number;
  side: "positive" | "negative" | "zero";
}

export function gdBarGeometry(value: number, maxAbs: number): GdBarGeometry {
  if (value === 0 || maxAbs <= 0) {
    return { widthPct: 0, side: "zero" };
  }
  const widthPct = Math.min(100, (Math.abs(value) / maxAbs) * 100);
  return { widthPct, side: value > 0 ? "positive" : "negative" };
}

/** Largest absolute goal difference across a set of rows (>= 1 to avoid /0). */
export function maxAbsGd(values: number[]): number {
  return Math.max(1, ...values.map((v) => Math.abs(v)));
}
