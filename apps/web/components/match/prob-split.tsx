/** Horizontal H/D/A probability bar with mono labels (values are 0..1). */
export function ProbSplit({
  home,
  draw,
  away,
  compact = false,
}: {
  home: number;
  draw: number;
  away: number;
  compact?: boolean;
}) {
  const h = Math.round(home * 100);
  const d = Math.round(draw * 100);
  const a = Math.round(away * 100);
  return (
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ display: "flex", height: compact ? 5 : 7, borderRadius: 20, overflow: "hidden", background: "var(--surface-3)" }}>
        <i style={{ width: `${h}%`, background: "var(--blue)" }} />
        <i style={{ width: `${d}%`, background: "#54607a" }} />
        <i style={{ width: `${a}%`, background: "var(--green)" }} />
      </div>
      {!compact && (
        <div className="flex jcb" style={{ marginTop: 5, fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--muted)" }}>
          <span>H {h}%</span>
          <span>D {d}%</span>
          <span>A {a}%</span>
        </div>
      )}
    </div>
  );
}
