"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api-client";
import { clubCode } from "../../../lib/club";
import { useMobileNav } from "../nav-context";
import { Crest } from "../ui";

export function ResultsScreen() {
  const nav = useMobileNav();
  const { data: results = [], isLoading } = useQuery({ queryKey: ["results", ""], queryFn: () => api.results() });

  return (
    <>
      <div className="lg-head" style={{ paddingTop: 14 }}>
        <div className="lg-eyebrow">Recent results</div>
        <div className="lg-title">Results</div>
        <div className="lg-sub">Final scores with the expected-goals read for each side.</div>
      </div>

      <div className="block">
        <div className="m-card">
          {results.map((m) => {
            const hw = (m.homeGoals ?? 0) > (m.awayGoals ?? 0);
            const aw = (m.awayGoals ?? 0) > (m.homeGoals ?? 0);
            return (
              <div className="match-row tappable" key={m.id} onClick={() => nav.pushScreen("match", m)}>
                <div className="mr-teams">
                  <div className="mr-team" style={{ opacity: aw ? 0.6 : 1 }}>
                    <Crest name={m.homeTeamName} seed={m.homeTeamId} size="xs" />
                    <span className="nm">{clubCode(m.homeTeamName)}</span>
                  </div>
                  <div className="mr-team" style={{ opacity: hw ? 0.6 : 1 }}>
                    <Crest name={m.awayTeamName} seed={m.awayTeamId} size="xs" />
                    <span className="nm">{clubCode(m.awayTeamName)}</span>
                  </div>
                </div>
                <div className="mono" style={{ textAlign: "center", minWidth: 40, fontWeight: 700, fontSize: 15 }}>
                  <div style={{ fontWeight: hw ? 800 : 600 }}>{m.homeGoals ?? "-"}</div>
                  <div style={{ fontWeight: aw ? 800 : 600 }}>{m.awayGoals ?? "-"}</div>
                </div>
                {m.homeXg != null && m.awayXg != null && (
                  <div className="dim" style={{ textAlign: "right", minWidth: 52, fontSize: 10.5, fontFamily: "var(--font-mono)" }}>
                    <div>xG {m.homeXg.toFixed(1)}</div>
                    <div>xG {m.awayXg.toFixed(1)}</div>
                  </div>
                )}
              </div>
            );
          })}
          {!isLoading && results.length === 0 && (
            <div className="dim" style={{ padding: 16, fontSize: 13 }}>
              No results available yet.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
