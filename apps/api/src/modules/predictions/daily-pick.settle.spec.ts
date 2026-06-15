import { resultNote, settleMarket } from "./daily-pick.settle";

describe("settleMarket", () => {
  it("settles match-result markets", () => {
    expect(settleMarket("home_win", 2, 1)).toBe("HIT");
    expect(settleMarket("home_win", 1, 1)).toBe("MISS");
    expect(settleMarket("away_win", 0, 2)).toBe("HIT");
    expect(settleMarket("draw", 1, 1)).toBe("HIT");
    expect(settleMarket("draw", 2, 1)).toBe("MISS");
  });

  it("settles double chance", () => {
    expect(settleMarket("double_chance_1x", 0, 0)).toBe("HIT");
    expect(settleMarket("double_chance_1x", 0, 1)).toBe("MISS");
    expect(settleMarket("double_chance_x2", 0, 1)).toBe("HIT");
  });

  it("voids draw-no-bet on a draw, otherwise settles", () => {
    expect(settleMarket("draw_no_bet_home", 1, 1)).toBe("VOID");
    expect(settleMarket("draw_no_bet_home", 2, 0)).toBe("HIT");
    expect(settleMarket("draw_no_bet_home", 0, 2)).toBe("MISS");
  });

  it("settles goals + btts markets", () => {
    expect(settleMarket("over_2_5", 2, 1)).toBe("HIT");
    expect(settleMarket("over_2_5", 1, 1)).toBe("MISS");
    expect(settleMarket("under_4_5", 2, 2)).toBe("HIT");
    expect(settleMarket("under_4_5", 3, 2)).toBe("MISS");
    expect(settleMarket("btts", 1, 1)).toBe("HIT");
    expect(settleMarket("btts", 1, 0)).toBe("MISS");
  });

  it("voids markets it cannot settle from full-time goals", () => {
    expect(settleMarket("first_half_goal", 3, 0)).toBe("VOID");
    expect(settleMarket("unknown_market", 1, 0)).toBe("VOID");
  });

  it("renders a readable result note", () => {
    expect(resultNote(2, 1)).toBe("Final 2-1 · home win");
    expect(resultNote(0, 0)).toBe("Final 0-0 · draw");
    expect(resultNote(1, 3)).toBe("Final 1-3 · away win");
  });
});
