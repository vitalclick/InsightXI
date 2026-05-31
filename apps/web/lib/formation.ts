import type { FormationPlayer } from "./ix-charts";

/**
 * Lay out shirt numbers on a vertical pitch (0..1 coords, top = attack) from a
 * formation string like "4-3-3". The keeper sits at the back; outfield lines
 * are spread evenly up the pitch and across its width.
 */
export function formationLayout(formation: string): FormationPlayer[] {
  const lines = formation
    .split("-")
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (lines.length === 0) return [];

  const players: FormationPlayer[] = [{ x: 0.5, y: 0.92, num: 1 }];
  let num = 2;
  const total = lines.length;
  lines.forEach((count, li) => {
    // Defenders nearest the keeper (high y), forwards near the top (low y).
    const y = 0.74 - (li / total) * 0.62;
    for (let i = 0; i < count; i++) {
      const x = count === 1 ? 0.5 : 0.12 + (i / (count - 1)) * 0.76;
      players.push({ x, y, num: num++ });
    }
  });
  return players;
}
