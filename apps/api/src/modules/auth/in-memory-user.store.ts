import { Injectable } from "@nestjs/common";
import { SubscriptionTier, UserRecord, UserStore } from "./user.store";

/** Default user store — process-local map (resets on restart). */
@Injectable()
export class InMemoryUserStore extends UserStore {
  private readonly users = new Map<string, UserRecord>();

  async findByEmail(email: string): Promise<UserRecord | undefined> {
    return this.users.get(email.toLowerCase());
  }

  async findById(id: string): Promise<UserRecord | undefined> {
    for (const user of this.users.values()) {
      if (user.id === id) return user;
    }
    return undefined;
  }

  async insert(user: UserRecord): Promise<void> {
    this.users.set(user.email.toLowerCase(), user);
  }

  async update(user: UserRecord): Promise<UserRecord> {
    this.users.set(user.email.toLowerCase(), user);
    return user;
  }

  async updateTier(
    email: string,
    tier: SubscriptionTier,
  ): Promise<UserRecord | undefined> {
    const user = this.users.get(email.toLowerCase());
    if (!user) return undefined;
    user.tier = tier;
    return user;
  }

  async delete(id: string): Promise<void> {
    for (const [email, user] of this.users) {
      if (user.id === id) {
        this.users.delete(email);
        return;
      }
    }
  }

  async bumpTokenVersion(id: string): Promise<UserRecord | undefined> {
    for (const user of this.users.values()) {
      if (user.id === id) {
        user.tokenVersion += 1;
        return user;
      }
    }
    return undefined;
  }
}
