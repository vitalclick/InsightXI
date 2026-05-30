/**
 * Center-anchored momentum gauge. `momentum` is 0..100 where 50 is neutral,
 * >50 favours home. Renders as a split bar growing from the centre toward the
 * dominant side, with a marker at the current position.
 */
export function MomentumGauge({
  momentum,
  homeName,
  awayName,
}: {
  momentum: number;
  homeName: string;
  awayName: string;
}) {
  const m = Math.max(0, Math.min(100, momentum));
  const homeLead = m >= 50;
  // Fill width as a fraction of the half-track (0 at centre, 100% at an edge).
  const fillPct = Math.abs(m - 50) * 2;

  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] uppercase tracking-wide text-white/40">
        <span>{homeName}</span>
        <span>Momentum</span>
        <span>{awayName}</span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
        {/* centre line */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/25" />
        {/* fill */}
        <div
          className="absolute top-0 h-full transition-all duration-700"
          style={{
            width: `${fillPct / 2}%`,
            ...(homeLead
              ? { right: "50%", backgroundColor: "#22c55e" }
              : { left: "50%", backgroundColor: "#3b82f6" }),
          }}
        />
      </div>
      <div className="mt-1 text-center text-[11px] text-white/40">
        {homeLead ? homeName : awayName} pressure
      </div>
    </div>
  );
}
