import { scoreMatrix } from "../../lib/poisson";

/**
 * Correct-score probability heatmap (Poisson) from each side's expected goals.
 * Cell colour encodes the joint scoreline probability; the modal score is ringed.
 */
export function ScoreMatrix({
  homeCode,
  awayCode,
  lambdaHome,
  lambdaAway,
  size = 4,
}: {
  homeCode: string;
  awayCode: string;
  lambdaHome: number;
  lambdaAway: number;
  size?: number;
}) {
  const m = scoreMatrix(lambdaHome, lambdaAway, size);
  const cols = size + 1;

  return (
    <div>
      <div className="flex gap-10">
        <div
          aria-hidden
          style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", padding: "4px 0", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dim)" }}
        >
          {Array.from({ length: cols }, (_, h) => (
            <span key={h}>{homeCode} {h}</span>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <div role="img" aria-label={`Correct-score probability heatmap. Most likely ${m.best.h}-${m.best.a} at ${(m.best.prob * 100).toFixed(1)} percent.`} style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 5 }}>
            {m.cells.map((c) => {
              const intensity = c.prob / m.max;
              const isBest = c.h === m.best.h && c.a === m.best.a;
              return (
                <div
                  key={`${c.h}-${c.a}`}
                  title={`${c.h}-${c.a}: ${(c.prob * 100).toFixed(1)}%`}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 7,
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    fontWeight: 600,
                    border: isBest ? "1px solid var(--blue)" : "1px solid var(--line)",
                    background: `rgba(46,125,255,${(intensity * 0.5).toFixed(2)})`,
                    color: intensity > 0.5 ? "#fff" : "var(--text-2)",
                  }}
                >
                  {(c.prob * 100).toFixed(0)}
                </div>
              );
            })}
          </div>
          <div className="flex jcb" aria-hidden style={{ marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dim)" }}>
            {Array.from({ length: cols }, (_, a) => (
              <span key={a}>{a === 0 ? `${awayCode} 0` : a}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex aic gap-8 wrap" style={{ marginTop: 14, fontSize: 11.5, color: "var(--muted)" }}>
        <span className="dim">Most likely:</span>
        <span className="badge blue">{m.best.h}-{m.best.a} · {(m.best.prob * 100).toFixed(1)}%</span>
        <span className="dim" style={{ marginLeft: 6 }}>Implied:</span>
        <span className="mono" style={{ fontSize: 11 }}>1 {Math.round(m.homeWin * 100)}% · X {Math.round(m.draw * 100)}% · 2 {Math.round(m.awayWin * 100)}%</span>
      </div>
    </div>
  );
}
