import { Injectable, Logger } from "@nestjs/common";
import { FootballRepository } from "../../repositories/football.repository";
import { PredictionsService, MatchPrediction } from "./predictions.service";
import {
  DailyPick,
  DailyPickStore,
  DailyPickSummary,
} from "./daily-pick.store";
import { resultNote, settleMarket } from "./daily-pick.settle";

/** Cap on fixtures scored per day so the first request stays bounded. */
const MAX_CANDIDATES = 30;

/**
 * Selects and locks one "Pick of the Day": the single highest-confidence
 * headline (1X2) selection across the day's fixtures. Snapshotted once per UTC
 * day so it stays stable, and settled against the result so the track record is
 * auditable. Per InsightXI's standards this is a probabilistic confidence call
 * with reasoning — never a "sure win".
 */
@Injectable()
export class DailyPickService {
  private readonly logger = new Logger(DailyPickService.name);

  constructor(
    private readonly repo: FootballRepository,
    private readonly predictions: PredictionsService,
    private readonly store: DailyPickStore,
  ) {}

  /** Today's locked pick (selecting + locking it on first access). */
  async getToday(): Promise<DailyPick | null> {
    await this.resolveDue();
    const date = todayUtc();
    const existing = await this.store.getByDate(date);
    if (existing) return existing;

    const pick = await this.select(date);
    if (!pick) return null;
    return this.store.save(pick);
  }

  /** Recent picks (newest first) plus the aggregate track record. */
  async history(
    limit = 30,
  ): Promise<{ picks: DailyPick[]; summary: DailyPickSummary }> {
    await this.resolveDue();
    const picks = await this.store.list(limit);
    return { picks, summary: summarize(picks) };
  }

  /** Score the day's fixtures and build the highest-confidence selection. */
  private async select(date: string): Promise<DailyPick | null> {
    const candidates = this.candidates(date);
    if (candidates.length === 0) return null;

    const results = await Promise.allSettled(
      candidates.map((id) => this.predictions.forMatch(id)),
    );
    const preds = results
      .filter(
        (r): r is PromiseFulfilledResult<MatchPrediction> =>
          r.status === "fulfilled",
      )
      .map((r) => r.value);

    if (preds.length === 0) {
      this.logger.warn(
        "No predictions available for daily pick (AI service offline?)",
      );
      return null;
    }

    const best = preds.reduce((a, b) =>
      b.topSelection.probability > a.topSelection.probability ? b : a,
    );
    const match = this.repo.getMatch(best.matchId);
    const sel = toSelection(best, best.homeTeam, best.awayTeam);

    return {
      date,
      matchId: best.matchId,
      leagueId: match?.leagueId ?? "",
      homeTeam: best.homeTeam,
      awayTeam: best.awayTeam,
      kickoff: match?.utcDate ?? "",
      market: sel.market,
      label: sel.label,
      probability: best.topSelection.probability,
      confidenceLevel: best.confidenceLevel,
      explanations: best.explanations,
      modelBackend: best.modelBackend,
      status: "PENDING",
      resultNote: null,
      createdAt: new Date().toISOString(),
      settledAt: null,
    };
  }

  /**
   * Fixture ids to score: today's scheduled matches if any, otherwise the next
   * matchday's (so there's always a pick when fixtures exist), capped.
   */
  private candidates(date: string): string[] {
    const upcoming = this.repo
      .getMatches({ status: "SCHEDULED" })
      .sort((a, b) => a.utcDate.localeCompare(b.utcDate));
    if (upcoming.length === 0) return [];

    const today = upcoming.filter((m) => m.utcDate.slice(0, 10) === date);
    const pool = today.length > 0 ? today : nextMatchday(upcoming);
    return pool.slice(0, MAX_CANDIDATES).map((m) => m.id);
  }

  /** Settle any pending picks whose match has finished. */
  private async resolveDue(): Promise<void> {
    const recent = await this.store.list(60);
    for (const pick of recent) {
      if (pick.status !== "PENDING") continue;
      const match = this.repo.getMatch(pick.matchId);
      if (
        !match ||
        match.status !== "FINISHED" ||
        match.homeGoals === null ||
        match.awayGoals === null
      ) {
        continue;
      }
      const status = settleMarket(pick.market, match.homeGoals, match.awayGoals);
      await this.store.settle(
        pick.date,
        status,
        resultNote(match.homeGoals, match.awayGoals),
        new Date().toISOString(),
      );
    }
  }
}

/** Map the 1X2 headline to a market code + a human selection label. */
function toSelection(
  pred: MatchPrediction,
  homeTeam: string,
  awayTeam: string,
): { market: string; label: string } {
  switch (pred.topSelection.label) {
    case "Home Win":
      return { market: "home_win", label: `${homeTeam} to win` };
    case "Away Win":
      return { market: "away_win", label: `${awayTeam} to win` };
    case "Draw":
      return { market: "draw", label: "Draw" };
    default:
      return { market: "home_win", label: pred.topSelection.label };
  }
}

/** All fixtures sharing the earliest upcoming kickoff date. */
function nextMatchday<T extends { utcDate: string }>(sortedAsc: T[]): T[] {
  const day = sortedAsc[0].utcDate.slice(0, 10);
  return sortedAsc.filter((m) => m.utcDate.slice(0, 10) === day);
}

function summarize(picks: DailyPick[]): DailyPickSummary {
  let hits = 0;
  let misses = 0;
  let voided = 0;
  for (const p of picks) {
    if (p.status === "HIT") hits++;
    else if (p.status === "MISS") misses++;
    else if (p.status === "VOID") voided++;
  }
  const decided = hits + misses;
  return {
    settled: hits + misses + voided,
    hits,
    misses,
    voided,
    hitRate: decided > 0 ? hits / decided : null,
  };
}

/** Current UTC date as 'YYYY-MM-DD'. */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}
