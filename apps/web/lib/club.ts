/**
 * Deterministic club visuals. The API has no brand colours, so we derive a
 * stable two-stop gradient and short code from the team id/name — consistent
 * across renders and avoiding any real-world club IP.
 */

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** A pleasing, saturated hue pair for a club crest gradient. */
export function clubColors(seed: string): { c1: string; c2: string } {
  const h = hash(seed);
  const hue = h % 360;
  return {
    c1: `hsl(${hue} 62% 42%)`,
    c2: `hsl(${(hue + 26) % 360} 70% 24%)`,
  };
}

/** 2–3 letter code from an explicit short name or derived from the full name. */
export function clubCode(name: string, shortName?: string): string {
  if (shortName && shortName.length <= 4) return shortName.toUpperCase();
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return (words[0][0] + words[1][0] + (words[2]?.[0] ?? "")).toUpperCase();
}
