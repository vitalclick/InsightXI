export type SubscriptionTier = "FREE" | "PREMIUM";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  tier: SubscriptionTier;
}

export interface PublicUser {
  id: string;
  email: string;
  tier: SubscriptionTier;
}

/**
 * Persistence boundary for users. Implemented in-memory (default) or against
 * Postgres, selected by DATA_BACKEND — UsersService stays storage-agnostic.
 */
export abstract class UserStore {
  abstract findByEmail(email: string): Promise<UserRecord | undefined>;
  abstract insert(user: UserRecord): Promise<void>;
  abstract updateTier(
    email: string,
    tier: SubscriptionTier,
  ): Promise<UserRecord | undefined>;
}
