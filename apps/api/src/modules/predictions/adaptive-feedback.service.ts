import { Inject, Injectable, Logger } from "@nestjs/common";
import { FootballRepository } from "../../repositories/football.repository";
import { AI_PREDICTION_CLIENT, AiPredictionClient } from "./ai-prediction.client";

/**
 * Closes the Adaptive Intelligence feedback loop.
 *
 * The AI service records every prediction in its Experience Memory. This service
 * reconciles the *pending* (predicted-but-unresolved) matches against finished
 * fixtures in the repository, feeds their actual results back, and then asks the
 * AI service to rebuild its adaptive state. Reconciling only the AI service's
 * own pending list means we never re-post results for matches already resolved,
 * and feedback is idempotent regardless.
 *
 * Entirely optional and degrades gracefully: if the AI service is unreachable or
 * the engine is off (no pending list), this is a logged no-op.
 */
@Injectable()
export class AdaptiveFeedbackService {
  private readonly logger = new Logger(AdaptiveFeedbackService.name);

  constructor(
    private readonly repo: FootballRepository,
    @Inject(AI_PREDICTION_CLIENT)
    private readonly ai: AiPredictionClient,
  ) {}

  async reconcileAndRecompute(): Promise<{ resolved: number; pending: number }> {
    let pending: string[];
    try {
      pending = await this.ai.getPendingMatchIds();
    } catch {
      this.logger.warn(
        "Could not fetch pending predictions (AI service offline / engine disabled); skipping",
      );
      return { resolved: 0, pending: 0 };
    }

    let resolved = 0;
    for (const matchId of pending) {
      const match = this.repo.getMatch(matchId);
      if (
        !match ||
        match.status !== "FINISHED" ||
        match.homeGoals === null ||
        match.awayGoals === null
      ) {
        continue; // not played yet — leave it pending
      }
      const outcome = (
        match.homeGoals > match.awayGoals
          ? 0
          : match.homeGoals === match.awayGoals
            ? 1
            : 2
      ) as 0 | 1 | 2;
      try {
        await this.ai.feedback({
          match_id: matchId,
          league_id: match.leagueId,
          outcome,
          home_goals: match.homeGoals,
          away_goals: match.awayGoals,
        });
        resolved++;
      } catch {
        this.logger.warn(`Feedback failed for ${matchId}`);
      }
    }

    if (resolved > 0) {
      try {
        await this.ai.recompute();
      } catch {
        this.logger.warn("Adaptive recompute failed (AI service offline)");
      }
    }

    this.logger.log(
      `Reconciled ${resolved}/${pending.length} pending predictions into Experience Memory`,
    );
    return { resolved, pending: pending.length };
  }
}
