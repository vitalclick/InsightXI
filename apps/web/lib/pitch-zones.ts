import type { TacticalProfile } from "./types";

/**
 * Derive a plausible pitch zone-intensity grid (rows top=attacking third,
 * cols left→right) from a tactical profile. The API has no event-level data,
 * so this is a deterministic, explainable projection of pressing intensity,
 * defensive line height and attacking flow onto the pitch — labelled as a
 * model projection in the UI, never presented as tracked positional data.
 */
const LINE_HEIGHT: Record<string, number> = { High: 0.82, Medium: 0.6, Low: 0.4 };

export function pressingGrid(p: TacticalProfile, rows = 6, cols = 5): number[][] {
  const press = p.pressingIntensity / 100; // 0..1
  const lineY = LINE_HEIGHT[p.defensiveLine] ?? 0.6; // fraction up the pitch
  // Pressing concentrates around the defensive line height; higher intensity
  // pushes the band higher and makes it hotter.
  const focusRow = (1 - lineY) * (rows - 1); // row index of peak press (0 = top)
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    const dist = Math.abs(r - focusRow) / rows;
    const band = Math.max(0, 1 - dist * 1.8);
    for (let c = 0; c < cols; c++) {
      // Slight central bias plus flank emphasis scaled by tempo/possession.
      const centre = 1 - Math.abs(c - (cols - 1) / 2) / cols;
      const v = press * (0.45 + 0.55 * band) * (0.7 + 0.3 * centre);
      row.push(Math.max(0, Math.min(1, v)));
    }
    grid.push(row);
  }
  return grid;
}

const FLOW_BIAS: Record<string, number> = {
  // Where attacks are funnelled: -1 left, 0 central, +1 right. "Wings"/"flanks"
  // spread to both sides; default central.
  Central: 0,
  "Through the middle": 0,
  "Wide": 1,
  Flanks: 1,
  Wings: 1,
};

export function attackGrid(p: TacticalProfile, rows = 6, cols = 5): number[][] {
  const intensity = Math.min(1, (p.possession / 100) * 0.7 + 0.3);
  const flow = (p.attackingFlow ?? "").toLowerCase();
  const wide = /wing|flank|wide/.test(flow);
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    // Attacks load the top third (low row index).
    const vertical = Math.max(0, 1 - (r / (rows - 1)) * 1.4);
    for (let c = 0; c < cols; c++) {
      const centre = 1 - Math.abs(c - (cols - 1) / 2) / ((cols - 1) / 2);
      const lateral = wide ? 1 - centre * 0.7 : 0.4 + 0.6 * centre;
      row.push(Math.max(0, Math.min(1, intensity * vertical * lateral)));
    }
    grid.push(row);
  }
  return grid;
}
