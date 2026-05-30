import { radarAxes, radarPoints } from "./radar";

export interface RadarSeries {
  label: string;
  color: string;
  /** Values in 0..1, one per axis, aligned with `axes`. */
  values: number[];
}

/**
 * Two-series radar (spider) chart for comparing attribute profiles.
 * Pure SVG; server-renderable.
 */
export function RadarChart({
  axes,
  series,
  size = 220,
}: {
  axes: string[];
  series: RadarSeries[];
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 28; // leave room for labels
  const rings = [0.25, 0.5, 0.75, 1];
  const axisPoints = radarAxes(axes.length, cx, cy, radius);

  return (
    <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`} role="img"
      aria-label={`Radar comparison: ${series.map((s) => s.label).join(" vs ")}`}>
      {/* concentric reference rings */}
      {rings.map((r) => (
        <polygon
          key={r}
          points={radarAxes(axes.length, cx, cy, radius * r)
            .map((p) => `${p.x},${p.y}`)
            .join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      ))}
      {/* spokes */}
      {axisPoints.map((p, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={p.x}
          y2={p.y}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      ))}
      {/* series polygons */}
      {series.map((s) => (
        <polygon
          key={s.label}
          points={radarPoints(s.values, cx, cy, radius)}
          fill={s.color}
          fillOpacity={0.18}
          stroke={s.color}
          strokeWidth={2}
        />
      ))}
      {/* axis labels */}
      {axisPoints.map((p, i) => {
        const lx = cx + (p.x - cx) * 1.18;
        const ly = cy + (p.y - cy) * 1.18;
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-white/45"
            style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 0.4 }}
          >
            {axes[i]}
          </text>
        );
      })}
    </svg>
  );
}
