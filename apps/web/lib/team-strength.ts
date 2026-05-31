import type { TeamRatings } from "./types";

/** Clamp into the 6..100 range the radar expects (keeps tiny values visible). */
export function clampAxis(n: number): number {
  return Math.max(6, Math.min(100, n));
}

export const STRENGTH_AXES = ["Attack", "Defense", "Form", "xG For", "xG Block", "Elo"] as const;

/**
 * Normalise a team's ratings onto the six radar axes (0..100). Defense and
 * xG-against are inverted so "further out = better" holds for every axis, and
 * Elo is rescaled from the ~1400..1720 band the seed produces.
 */
export function strengthValues(r: TeamRatings): number[] {
  return [
    clampAxis(r.attackStrength * 55),
    clampAxis(110 - r.defenseStrength * 55),
    clampAxis((r.recentFormPoints / 15) * 100),
    clampAxis(r.avgXgFor * 42),
    clampAxis(110 - r.avgXgAgainst * 42),
    clampAxis(((r.elo - 1400) / 320) * 100),
  ];
}

/** A single comparable metric with both teams' raw values + winner flag. */
export interface CompareRow {
  label: string;
  a: number;
  b: number;
  /** "a" | "b" | "tie" — which side is stronger (higher-is-better aware). */
  better: "a" | "b" | "tie";
  format: (n: number) => string;
}

const int = (n: number) => String(Math.round(n));
const dec = (n: number) => n.toFixed(2);

/** Build the head-to-head metric table for two teams' ratings. */
export function compareRows(a: TeamRatings, b: TeamRatings): CompareRow[] {
  const row = (
    label: string,
    av: number,
    bv: number,
    higherIsBetter: boolean,
    format: (n: number) => string,
  ): CompareRow => {
    const better = av === bv ? "tie" : (av > bv) === higherIsBetter ? "a" : "b";
    return { label, a: av, b: bv, better, format };
  };
  return [
    row("Elo rating", a.elo, b.elo, true, int),
    row("Recent form (/15)", a.recentFormPoints, b.recentFormPoints, true, int),
    row("Attack strength", a.attackStrength, b.attackStrength, true, dec),
    row("Defense strength", a.defenseStrength, b.defenseStrength, false, dec),
    row("Avg xG for", a.avgXgFor, b.avgXgFor, true, dec),
    row("Avg xG against", a.avgXgAgainst, b.avgXgAgainst, false, dec),
  ];
}
