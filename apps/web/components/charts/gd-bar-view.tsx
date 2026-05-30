import { gdBarGeometry } from "./gd-bar";

/**
 * Diverging goal-difference bar: a centre line with the fill growing right
 * (green) for positive GD or left (red) for negative, plus the numeric value.
 */
export function GdBar({ value, maxAbs }: { value: number; maxAbs: number }) {
  const { widthPct, side } = gdBarGeometry(value, maxAbs);
  const label = value > 0 ? `+${value}` : `${value}`;

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-16 rounded-full bg-white/10">
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/25" />
        {side !== "zero" && (
          <div
            className="absolute top-0 h-full rounded-full"
            style={{
              width: `${widthPct / 2}%`,
              ...(side === "positive"
                ? { left: "50%", backgroundColor: "#22c55e" }
                : { right: "50%", backgroundColor: "#ef4444" }),
            }}
          />
        )}
      </div>
      <span className="w-8 text-right tabular-nums text-white/70">{label}</span>
    </div>
  );
}
