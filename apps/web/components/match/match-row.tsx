import Link from "next/link";
import type { MatchPrediction, MatchView } from "../../lib/types";
import { Crest } from "../ui/crest";
import { ProbSplit } from "./prob-split";
import { confColor } from "../../hooks/use-predictions";
import { clubCode } from "../../lib/club";

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** A single fixture/result row, styled like the design's board/list rows. */
export function MatchRow({ match, prediction }: { match: MatchView; prediction?: MatchPrediction }) {
  const finished = match.status === "FINISHED";
  const conf = prediction ? Math.round(prediction.topSelection.probability * 100) : null;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="board-row"
      style={{ borderTop: "1px solid var(--line)", textDecoration: "none", color: "inherit" }}
    >
      <div style={{ width: 46, textAlign: "center", flexShrink: 0 }}>
        <div className="mono" style={{ fontSize: 13, fontWeight: 700 }}>
          {finished ? `${match.homeGoals}-${match.awayGoals}` : fmtTime(match.utcDate)}
        </div>
        <div className="dim" style={{ fontSize: 10 }}>
          {finished ? "FT" : fmtDay(match.utcDate)}
        </div>
      </div>
      <div className="flex aic gap-7" style={{ width: 150, flexShrink: 0 }}>
        <Crest name={match.homeTeamName} seed={match.homeTeamId} size="xs" />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{clubCode(match.homeTeamName)}</span>
        <span className="dim" style={{ fontSize: 11 }}>v</span>
        <Crest name={match.awayTeamName} seed={match.awayTeamId} size="xs" />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{clubCode(match.awayTeamName)}</span>
      </div>
      {prediction ? (
        <ProbSplit
          home={prediction.outcome.homeWin}
          draw={prediction.outcome.draw}
          away={prediction.outcome.awayWin}
        />
      ) : (
        <div style={{ flex: 1 }} />
      )}
      <div style={{ textAlign: "right", width: 84, flexShrink: 0 }}>
        {conf != null ? (
          <>
            <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: confColor(conf) }}>
              {conf}%
            </div>
            <div className="dim" style={{ fontSize: 10 }}>
              {prediction!.topSelection.label}
            </div>
          </>
        ) : (
          <div className="dim" style={{ fontSize: 11 }}>
            MD{match.matchday}
          </div>
        )}
      </div>
    </Link>
  );
}
