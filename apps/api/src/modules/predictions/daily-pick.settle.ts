import { DailyPickStatus } from "./daily-pick.store";

/**
 * Settle a market against a finished scoreline. Pure + side-effect free so it
 * is trivially testable. Returns VOID for markets that push (e.g. Draw No Bet
 * on a draw) or that we can't settle from full-time goals alone.
 */
export function settleMarket(
  market: string,
  homeGoals: number,
  awayGoals: number,
): DailyPickStatus {
  const total = homeGoals + awayGoals;
  const homeWin = homeGoals > awayGoals;
  const awayWin = awayGoals > homeGoals;
  const draw = homeGoals === awayGoals;
  const hit = (won: boolean): DailyPickStatus => (won ? "HIT" : "MISS");

  switch (market) {
    case "home_win":
      return hit(homeWin);
    case "draw":
      return hit(draw);
    case "away_win":
      return hit(awayWin);
    case "double_chance_1x":
      return hit(homeWin || draw);
    case "double_chance_x2":
      return hit(draw || awayWin);
    case "draw_no_bet_home":
      return draw ? "VOID" : hit(homeWin);
    case "draw_no_bet_away":
      return draw ? "VOID" : hit(awayWin);
    case "over_1_5":
      return hit(total > 1.5);
    case "over_2_5":
      return hit(total > 2.5);
    case "under_4_5":
      return hit(total < 4.5);
    case "btts":
      return hit(homeGoals > 0 && awayGoals > 0);
    // First-half-goal can't be settled from full-time goals; treat as void.
    case "first_half_goal":
      return "VOID";
    default:
      return "VOID";
  }
}

/** Short human note for the settled result, e.g. "Final 2-1 · home win". */
export function resultNote(homeGoals: number, awayGoals: number): string {
  const outcome =
    homeGoals > awayGoals
      ? "home win"
      : awayGoals > homeGoals
        ? "away win"
        : "draw";
  return `Final ${homeGoals}-${awayGoals} · ${outcome}`;
}
