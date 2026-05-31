/** Shimmering placeholder rows for list loading states (design `.skel`). */
export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div style={{ padding: "8px 10px" }} role="status" aria-label="Loading" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} aria-hidden className="flex aic gap-12" style={{ padding: "11px 8px", borderTop: i ? "1px solid var(--line)" : "none" }}>
          <span className="skel" style={{ width: 46, height: 14 }} />
          <span className="skel" style={{ width: 26, height: 26, borderRadius: 7 }} />
          <span className="skel" style={{ flex: 1, height: 12 }} />
          <span className="skel" style={{ width: 40, height: 14 }} />
        </div>
      ))}
    </div>
  );
}

/** Grid of shimmering cards (for card-based loading states). */
export function SkeletonCards({ count = 6, height = 96, columns = 3 }: { count?: number; height?: number; columns?: number }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${columns},1fr)` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skel" style={{ height, borderRadius: 16 }} />
      ))}
    </div>
  );
}
