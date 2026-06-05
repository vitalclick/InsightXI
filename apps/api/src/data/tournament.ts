/**
 * FIFA World Cup 2026 — knockout bracket template.
 *
 * This is the *structural* tournament model: a fixed set of knockout fixtures
 * whose participants are defined by SLOT REFERENCES (group positions, or the
 * winner/loser of an earlier tie) rather than concrete teams. The fixtures
 * resolve as group standings settle and ties are decided, exactly like a real
 * tournament bracket. With the offline seed the group stage is still unplayed,
 * so the TournamentService resolves the slots from projected standings; once
 * real results exist the same template fills with actual teams.
 *
 * Bracket design — a clean, DOCUMENTED STANDARD template (not FIFA's official
 * Annex C slotting, which depends on a 495-row third-place combination table):
 *
 *   • 32 qualifiers: the two top teams from each of the 12 groups + the 8 best
 *     third-placed teams (ranked 1..8).
 *   • Round of 32 composition mirrors the real tournament: 8 ties of
 *     winner-vs-third, 4 of winner-vs-runner-up, 4 of runner-up-vs-runner-up.
 *   • The four "regions" (quarters of the draw) each hold three group winners;
 *     every group's runner-up is placed in a DIFFERENT region from its winner,
 *     so two teams from the same group cannot meet before the semi-finals.
 *
 * Region layout (group winners → region; that region's runner-up slots are
 * filled by another region's groups, rotating Q1→Q2→Q3→Q4→Q1):
 *   Q1 winners A,B,C  · runners-up J,K,L
 *   Q2 winners D,E,F  · runners-up A,B,C
 *   Q3 winners G,H,I  · runners-up D,E,F
 *   Q4 winners J,K,L  · runners-up G,H,I
 */
import { BracketSlot, KnockoutFixture, TournamentStage } from "../common/domain";

export const WORLD_CUP_TOURNAMENT_ID = "wc26";

/** First kickoff of each knockout round (matches the real 2026 calendar). */
const STAGE_START: Record<Exclude<TournamentStage, "GROUP">, string> = {
  R32: "2026-06-28",
  R16: "2026-07-04",
  QF: "2026-07-09",
  SF: "2026-07-14",
  THIRD_PLACE: "2026-07-18",
  FINAL: "2026-07-19",
};

function winner(group: string): BracketSlot {
  return { kind: "GROUP_WINNER", group, label: `Winner Group ${group}` };
}
function runnerUp(group: string): BracketSlot {
  return { kind: "GROUP_RUNNER_UP", group, label: `Runner-up Group ${group}` };
}
function third(rank: number): BracketSlot {
  return { kind: "THIRD_PLACE", thirdRank: rank, label: `3rd place #${rank}` };
}
function winnerOf(matchId: string, label: string): BracketSlot {
  return { kind: "MATCH_WINNER", sourceMatchId: matchId, label };
}
function loserOf(matchId: string, label: string): BracketSlot {
  return { kind: "MATCH_LOSER", sourceMatchId: matchId, label };
}

const id = (stage: string, n: number) => `${WORLD_CUP_TOURNAMENT_ID}-${stage}-${n}`;

/**
 * The 16 Round-of-32 ties in bracket order. Ties (1,2)→R16, (3,4)→R16, …;
 * the four regions are ties [1-4], [5-8], [9-12], [13-16].
 */
const R32: Array<[BracketSlot, BracketSlot]> = [
  // Region Q1 — winners A,B,C; runners-up J,K,L; thirds #1,#2
  [winner("A"), third(1)],
  [winner("B"), runnerUp("J")],
  [winner("C"), third(2)],
  [runnerUp("K"), runnerUp("L")],
  // Region Q2 — winners D,E,F; runners-up A,B,C; thirds #3,#4
  [winner("D"), third(3)],
  [winner("E"), runnerUp("A")],
  [winner("F"), third(4)],
  [runnerUp("B"), runnerUp("C")],
  // Region Q3 — winners G,H,I; runners-up D,E,F; thirds #5,#6
  [winner("G"), third(5)],
  [winner("H"), runnerUp("D")],
  [winner("I"), third(6)],
  [runnerUp("E"), runnerUp("F")],
  // Region Q4 — winners J,K,L; runners-up G,H,I; thirds #7,#8
  [winner("J"), third(7)],
  [winner("K"), runnerUp("G")],
  [winner("L"), third(8)],
  [runnerUp("H"), runnerUp("I")],
];

/** Build a date for a stage slot, one day apart, ISO at 19:00 UTC. */
function stageDate(stage: Exclude<TournamentStage, "GROUP">, order: number): string {
  const d = new Date(STAGE_START[stage]);
  d.setUTCDate(d.getUTCDate() + (order - 1));
  d.setUTCHours(19, 0, 0, 0);
  return d.toISOString();
}

function fixture(
  stage: Exclude<TournamentStage, "GROUP">,
  order: number,
  home: BracketSlot,
  away: BracketSlot,
): KnockoutFixture {
  return {
    id: id(stage.toLowerCase(), order),
    tournamentId: WORLD_CUP_TOURNAMENT_ID,
    stage,
    order,
    utcDate: stageDate(stage, order),
    home,
    away,
    homeTeamId: null,
    awayTeamId: null,
    homeGoals: null,
    awayGoals: null,
  };
}

/** Build the full static knockout template: 16 + 8 + 4 + 2 + 1 + (3rd place). */
export function buildWorldCupKnockout(): KnockoutFixture[] {
  const fixtures: KnockoutFixture[] = [];

  // Round of 32.
  R32.forEach(([home, away], i) => fixtures.push(fixture("R32", i + 1, home, away)));

  // Round of 16: winners of consecutive R32 ties.
  for (let i = 0; i < 8; i++) {
    const a = id("r32", i * 2 + 1);
    const b = id("r32", i * 2 + 2);
    fixtures.push(
      fixture(
        "R16",
        i + 1,
        winnerOf(a, `Winner R32-${i * 2 + 1}`),
        winnerOf(b, `Winner R32-${i * 2 + 2}`),
      ),
    );
  }

  // Quarter-finals: winners of consecutive R16 ties.
  for (let i = 0; i < 4; i++) {
    const a = id("r16", i * 2 + 1);
    const b = id("r16", i * 2 + 2);
    fixtures.push(
      fixture(
        "QF",
        i + 1,
        winnerOf(a, `Winner R16-${i * 2 + 1}`),
        winnerOf(b, `Winner R16-${i * 2 + 2}`),
      ),
    );
  }

  // Semi-finals: winners of consecutive QF ties.
  for (let i = 0; i < 2; i++) {
    const a = id("qf", i * 2 + 1);
    const b = id("qf", i * 2 + 2);
    fixtures.push(
      fixture(
        "SF",
        i + 1,
        winnerOf(a, `Winner QF-${i * 2 + 1}`),
        winnerOf(b, `Winner QF-${i * 2 + 2}`),
      ),
    );
  }

  // Third-place play-off: the two semi-final losers.
  fixtures.push(
    fixture(
      "THIRD_PLACE",
      1,
      loserOf(id("sf", 1), "Loser SF-1"),
      loserOf(id("sf", 2), "Loser SF-2"),
    ),
  );

  // Final: the two semi-final winners.
  fixtures.push(
    fixture(
      "FINAL",
      1,
      winnerOf(id("sf", 1), "Winner SF-1"),
      winnerOf(id("sf", 2), "Winner SF-2"),
    ),
  );

  return fixtures;
}
