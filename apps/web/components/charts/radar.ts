/**
 * Pure geometry for a radar (spider) chart polygon. Returns an SVG points
 * string for a set of normalised values (0..1) spread evenly around a circle.
 * Separated from rendering so the maths is unit-testable.
 */
export function radarPoints(
  values: number[],
  cx: number,
  cy: number,
  radius: number,
): string {
  const n = values.length;
  return values
    .map((vRaw, i) => {
      const v = Math.max(0, Math.min(1, vRaw));
      // Start at the top (-90deg) and go clockwise.
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = v * radius;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

/** Vertices of the outer reference polygon (value = 1 on every axis). */
export function radarAxes(
  count: number,
  cx: number,
  cy: number,
  radius: number,
): Array<{ x: number; y: number }> {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });
}
