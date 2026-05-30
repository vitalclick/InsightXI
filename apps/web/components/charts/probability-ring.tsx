import { circumference, ringSegments } from "./ring-math";

export interface RingDatum {
  label: string;
  value: number;
  /** Any CSS color (hex or rgb); arcs are drawn as SVG strokes. */
  color: string;
}

/**
 * Multi-segment probability ring (donut). Renders each datum as a clockwise arc
 * proportional to its value, with the headline figure centred. Pure SVG — no
 * client JS required, so it server-renders.
 */
export function ProbabilityRing({
  data,
  size = 140,
  thickness = 14,
  centerLabel,
  centerValue,
}: {
  data: RingDatum[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const radius = (size - thickness) / 2;
  const c = circumference(radius);
  const segments = ringSegments(
    data.map((d) => d.value),
    radius,
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={data.map((d) => `${d.label} ${Math.round(d.value * 100)}%`).join(", ")}
    >
      {/* Rotate -90deg so segments start at 12 o'clock. */}
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={thickness}
        />
        {data.map((d, i) => (
          <circle
            key={d.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={d.color}
            strokeWidth={thickness}
            strokeDasharray={`${segments[i].dash} ${c - segments[i].dash}`}
            strokeDashoffset={segments[i].offset}
            strokeLinecap="butt"
          />
        ))}
      </g>
      {(centerValue || centerLabel) && (
        <g>
          {centerValue && (
            <text
              x="50%"
              y="48%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-white"
              style={{ fontSize: size * 0.2, fontWeight: 700 }}
            >
              {centerValue}
            </text>
          )}
          {centerLabel && (
            <text
              x="50%"
              y="64%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-white/50"
              style={{ fontSize: size * 0.085, letterSpacing: 0.5 }}
            >
              {centerLabel}
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
