/** Side-by-side expected-goals comparison with proportional bars. */
export function XgCompare({
  homeLabel,
  awayLabel,
  home,
  away,
}: {
  homeLabel: string;
  awayLabel: string;
  home: number;
  away: number;
}) {
  const max = Math.max(home, away, 0.1);
  const homePct = (home / max) * 100;
  const awayPct = (away / max) * 100;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 text-[11px] uppercase tracking-wide text-white/40">
        Expected goals (xG)
      </div>
      <div className="flex flex-col gap-2 text-sm">
        <Row label={homeLabel} value={home} pct={homePct} color="#22c55e" />
        <Row label={awayLabel} value={away} pct={awayPct} color="#3b82f6" />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: number;
  pct: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 truncate text-white/70">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-10 text-right font-semibold tabular-nums">
        {value.toFixed(1)}
      </span>
    </div>
  );
}
