"use client";

/** Tiny dependency-free SVG charts for the admin surfaces. */

function pathFor(values: number[], w: number, h: number, pad = 2) {
  if (values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = (w - pad * 2) / Math.max(1, values.length - 1);
  return values
    .map((v, i) => {
      const x = pad + i * step;
      const y = h - pad - ((v - min) / span) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function Sparkline({
  values,
  color = "var(--blue)",
  width = 130,
  height = 38,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const line = pathFor(values, width, height);
  const area = `${line} L${width - 2},${height - 2} L2,${height - 2} Z`;
  const id = `sp-${Math.random().toString(36).slice(2)}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.8} />
    </svg>
  );
}

export function LineChart({
  values,
  color = "var(--blue)",
  height = 200,
  labels,
}: {
  values: number[];
  color?: string;
  height?: number;
  labels?: string[];
}) {
  const width = 560;
  const line = pathFor(values, width, height - 22, 6);
  const area = `${line} L${width - 6},${height - 22} L6,${height - 22} Z`;
  const id = `ln-${Math.random().toString(36).slice(2)}`;
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2.2} />
      {labels && (
        <g>
          {labels.map((l, i) => (
            <text
              key={l + i}
              x={6 + (i * (width - 12)) / Math.max(1, labels.length - 1)}
              y={height - 4}
              fontSize="10"
              fill="var(--muted)"
              textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"}
            >
              {l}
            </text>
          ))}
        </g>
      )}
    </svg>
  );
}

interface Slice {
  value: number;
  color: string;
}

export function Donut({
  slices,
  size = 150,
  stroke = 18,
  centerTop,
  centerBot,
}: {
  slices: Slice[];
  size?: number;
  stroke?: number;
  centerTop?: string;
  centerBot?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        {slices.map((s, i) => {
          const len = (s.value / total) * c;
          const seg = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return seg;
        })}
      </g>
      {centerTop && (
        <text x="50%" y="47%" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text)">
          {centerTop}
        </text>
      )}
      {centerBot && (
        <text x="50%" y="62%" textAnchor="middle" fontSize="11" fill="var(--muted)">
          {centerBot}
        </text>
      )}
    </svg>
  );
}
