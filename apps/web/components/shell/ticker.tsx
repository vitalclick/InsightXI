"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api-client";
import { clubCode } from "../../lib/club";
import { useLive } from "../../hooks/use-live";
import { Icon } from "../ui/icon";
import type { MatchView } from "../../lib/types";

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function Ticker() {
  const { data: fixtures = [] } = useQuery({ queryKey: ["fixtures", ""], queryFn: () => api.fixtures() });
  const { data: results = [] } = useQuery({ queryKey: ["results", ""], queryFn: () => api.results() });
  const { snapshot } = useLive();

  const items: React.ReactNode[] = [];

  // Live match (websocket) leads the ticker and updates in real time.
  if (snapshot) {
    items.push(
      <span className="ticker-item" key="live" style={{ color: "var(--text)" }}>
        <span className="min" style={{ color: "var(--red)" }}>
          {snapshot.status === "LIVE" ? `${snapshot.minute}'` : "FT"}
        </span>
        <b>{clubCode(snapshot.homeTeamName)}</b> {snapshot.homeGoals}–{snapshot.awayGoals}{" "}
        <b>{clubCode(snapshot.awayTeamName)}</b>
      </span>,
    );
  }

  results.slice(0, 5).forEach((m: MatchView) => {
    items.push(
      <span className="ticker-item" key={`r-${m.id}`}>
        <b>{clubCode(m.homeTeamName)}</b> {m.homeGoals}–{m.awayGoals} <b>{clubCode(m.awayTeamName)}</b>
        <span className="min">FT</span>
      </span>,
    );
  });
  fixtures.slice(0, 6).forEach((m: MatchView) => {
    items.push(
      <span className="ticker-item" key={`f-${m.id}`}>
        {fmtTime(m.utcDate)} <b>{clubCode(m.homeTeamName)}</b> v <b>{clubCode(m.awayTeamName)}</b>
        {m.homeXg != null && (
          <span style={{ color: "var(--blue-2)" }}>
            xG {m.homeXg?.toFixed(2)}–{m.awayXg?.toFixed(2)}
          </span>
        )}
      </span>,
    );
  });

  if (items.length === 0) return null;
  // Duplicate for a seamless marquee loop.
  const track = [...items, ...items];

  return (
    <div className="ticker">
      <div className="ticker-label">
        <Icon name="bolt" size={13} />
        LIVE
      </div>
      <div className="ticker-track">{track}</div>
    </div>
  );
}
