import { Injectable } from "@nestjs/common";
import {
  DailyPick,
  DailyPickStatus,
  DailyPickStore,
} from "./daily-pick.store";

/** Default daily-pick store — process-local map keyed by UTC date. */
@Injectable()
export class InMemoryDailyPickStore extends DailyPickStore {
  private readonly byDate = new Map<string, DailyPick>();

  async getByDate(date: string): Promise<DailyPick | undefined> {
    return this.byDate.get(date);
  }

  async save(pick: DailyPick): Promise<DailyPick> {
    // Locked: first write for a date wins.
    const existing = this.byDate.get(pick.date);
    if (existing) return existing;
    this.byDate.set(pick.date, pick);
    return pick;
  }

  async list(limit: number): Promise<DailyPick[]> {
    return [...this.byDate.values()]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
  }

  async settle(
    date: string,
    status: DailyPickStatus,
    resultNote: string,
    settledAt: string,
  ): Promise<void> {
    const pick = this.byDate.get(date);
    if (!pick) return;
    pick.status = status;
    pick.resultNote = resultNote;
    pick.settledAt = settledAt;
  }
}
