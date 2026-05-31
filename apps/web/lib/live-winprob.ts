import type { LiveSnapshot } from "./types";

export interface WinProbPoint {
  m: number;
  h: number;
  d: number;
  a: number;
}

/**
 * In-play win/draw/away probabilities from a live snapshot. A transparent
 * heuristic — momentum sets the pre-goal lean, the current scoreline shifts it
 * (weighted by how much of the match remains), and the draw share shrinks as
 * time runs out. Returns whole percentages summing to 100.
 */
export function liveWinProb(s: Pick<LiveSnapshot, "minute" | "homeGoals" | "awayGoals" | "momentum" | "status">): WinProbPoint {
  if (s.status === "FINISHED") {
    const h = s.homeGoals > s.awayGoals ? 100 : s.homeGoals === s.awayGoals ? 0 : 0;
    const d = s.homeGoals === s.awayGoals ? 100 : 0;
    return { m: 90, h, d, a: 100 - h - d };
  }

  const remaining = Math.max(0, (90 - s.minute) / 90); // 1 at KO -> 0 at FT
  const lead = s.homeGoals - s.awayGoals;

  // Momentum (5..95) maps to a small home/away tilt before the score matters.
  const momTilt = (s.momentum - 50) / 50; // -1..1

  // The scoreline dominates more as time runs out.
  const leadWeight = 1 - remaining; // 0 at KO -> 1 at FT
  const scoreTilt = Math.tanh(lead * (0.6 + leadWeight)); // -1..1

  // Blend: early on momentum leads, late on the score leads.
  const tilt = momTilt * remaining * 0.5 + scoreTilt * (0.5 + leadWeight * 0.5);

  // Draw share is highest at kickoff and at level scores, decays with time/lead.
  const drawBase = 30 * remaining + (lead === 0 ? 18 : 4);
  const draw = Math.max(4, Math.min(70, drawBase));

  // Round the draw first, then split the remainder so the three always sum to
  // exactly 100 (no fractional drift into the away share).
  const d = Math.round(draw);
  const rest = 100 - d;
  let h = Math.round((rest * (1 + tilt)) / 2);
  h = Math.max(0, Math.min(rest, h));
  const a = rest - h;

  return { m: s.minute, h, d, a };
}
