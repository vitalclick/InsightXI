export type SubscriptionTier = "FREE" | "PREMIUM";
export type AuthProvider = "email" | "google" | "apple";
export type SubscriptionStatus = "none" | "active" | "expired" | "canceled";

export interface UserRecord {
  id: string;
  email: string;
  /** Null for accounts created via an OAuth provider (no local password). */
  passwordHash: string | null;
  tier: SubscriptionTier;
  name: string | null;
  avatarUrl: string | null;
  provider: AuthProvider;
  /** Whether the email address has been confirmed (OAuth accounts are trusted). */
  emailVerified: boolean;
  subscriptionStatus: SubscriptionStatus;
  /** Gateway that activated the current subscription (paypal/paystack/...). */
  subscriptionProvider: string | null;
  subscriptionRef: string | null;
  /** ISO timestamp the current access period ends; null = none/unlimited. */
  currentPeriodEnd: string | null;
}

export interface PublicUser {
  id: string;
  email: string;
  tier: SubscriptionTier;
  name: string | null;
  avatarUrl: string | null;
  provider: AuthProvider;
  emailVerified: boolean;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: string | null;
}

/**
 * Persistence boundary for users. Implemented in-memory (default) or against
 * Postgres, selected by DATA_BACKEND — UsersService stays storage-agnostic.
 */
export abstract class UserStore {
  abstract findByEmail(email: string): Promise<UserRecord | undefined>;
  abstract findById(id: string): Promise<UserRecord | undefined>;
  abstract insert(user: UserRecord): Promise<void>;
  /** Full update-by-id; returns the persisted record. */
  abstract update(user: UserRecord): Promise<UserRecord>;
  abstract updateTier(
    email: string,
    tier: SubscriptionTier,
  ): Promise<UserRecord | undefined>;
  /** Permanently remove a user by id (account deletion / GDPR erasure). */
  abstract delete(id: string): Promise<void>;
}
