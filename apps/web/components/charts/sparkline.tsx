/**
 * Minimal SVG sparkline for a small series of values. Pure + server-renderable.
 * Scales the series to fit the viewbox; flat series render as a centred line.
 */
export function Sparkline({
  values,
  width = 120,
  height = 32,
  color = "#3b82f6",
  fill = true,
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}) {
  if (values.length === 0) return null;

  const pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;

  const points = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area =
    `${pad},${height - pad} ` + line + ` ${(pad + (values.length - 1) * stepX).toFixed(1)},${height - pad}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-hidden>
      {fill && <polygon points={area} fill={color} fillOpacity={0.15} />}
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* last-point marker */}
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r={2} fill={color} />
    </svg>
  );
}
