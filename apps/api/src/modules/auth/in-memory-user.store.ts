import { Injectable } from "@nestjs/common";
import {
  SubscriptionTier,
  UserRecord,
  UserStore,
} from "./user.store";

/** Default user store — process-local map (resets on restart). */
@Injectable()
export class InMemoryUserStore extends UserStore {
  private readonly users = new Map<string, UserRecord>();

  async findByEmail(email: string): Promise<UserRecord | undefined> {
    return this.users.get(email);
  }

  async insert(user: UserRecord): Promise<void> {
    this.users.set(user.email, user);
  }

  async updateTier(
    email: string,
    tier: SubscriptionTier,
  ): Promise<UserRecord | undefined> {
    const user = this.users.get(email);
    if (!user) return undefined;
    user.tier = tier;
    return user;
  }
}
