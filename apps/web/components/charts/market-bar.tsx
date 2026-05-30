/** A labelled horizontal probability bar (0..1), used for market rows. */
export function MarketBar({
  label,
  value,
  accent = "var(--ring-insight, #3b82f6)",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span className="font-semibold tabular-nums">{pct}%</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: accent }}
        />
      </div>
    </div>
  );
}
