import { ConflictException, Injectable, OnModuleInit } from "@nestjs/common";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import {
  AuthProvider,
  PublicUser,
  SubscriptionTier,
  UserRecord,
  UserRole,
  UserStore,
} from "./user.store";

export type {
  AuthProvider,
  PublicUser,
  SubscriptionStatus,
  SubscriptionTier,
  UserRole,
} from "./user.store";
export type User = UserRecord;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
}

interface NewUser {
  email: string;
  password?: string | null;
  tier?: SubscriptionTier;
  role?: UserRole;
  name?: string | null;
  avatarUrl?: string | null;
  provider?: AuthProvider;
  emailVerified?: boolean;
}

/**
 * User management over a pluggable UserStore. Seeds FREE + PREMIUM demo
 * accounts on startup (idempotent — safe across restarts and on Postgres).
 */
@Injectable()
export class UsersService implements OnModuleInit {
  constructor(private readonly store: UserStore) {}

  async onModuleInit(): Promise<void> {
    if (await this.store.findByEmail("free@insightxi.dev")) return;
    await this.buildAndInsert({
      email: "free@insightxi.dev",
      password: "password",
      tier: "FREE",
      emailVerified: true,
    });
    await this.buildAndInsert({
      email: "premium@insightxi.dev",
      password: "password",
      tier: "PREMIUM",
      emailVerified: true,
    });
    await this.buildAndInsert({
      email: "admin@insightxi.dev",
      password: "password",
      tier: "PREMIUM",
      role: "ADMIN",
      name: "Alex Mercer",
      emailVerified: true,
    });
  }

  private async buildAndInsert(input: NewUser): Promise<UserRecord> {
    const isPremium = input.tier === "PREMIUM";
    const user: UserRecord = {
      id: randomUUID(),
      email: input.email.toLowerCase(),
      passwordHash: input.password ? hashPassword(input.password) : null,
      tier: input.tier ?? "FREE",
      role: input.role ?? "USER",
      suspended: false,
      name: input.name ?? null,
      avatarUrl: input.avatarUrl ?? null,
      provider: input.provider ?? "email",
      emailVerified: input.emailVerified ?? false,
      subscriptionStatus: isPremium ? "active" : "none",
      subscriptionProvider: null,
      subscriptionRef: null,
      currentPeriodEnd: null,
    };
    await this.store.insert(user);
    return user;
  }

  async create(
    email: string,
    password: string,
    tier: SubscriptionTier = "FREE",
  ): Promise<PublicUser> {
    if (await this.store.findByEmail(email)) {
      throw new ConflictException("Email already registered");
    }
    const user = await this.buildAndInsert({ email, password, tier });
    return this.toPublic(user);
  }

  async validate(email: string, password: string): Promise<UserRecord | null> {
    const user = await this.store.findByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) return null;
    return user;
  }

  async findByEmail(email: string): Promise<UserRecord | undefined> {
    return this.store.findByEmail(email);
  }

  async findById(id: string): Promise<UserRecord | undefined> {
    return this.store.findById(id);
  }

  /** Every account as a public view (admin console listing). */
  async listPublic(): Promise<PublicUser[]> {
    const users = await this.store.list();
    return users.map((u) => this.toPublic(u));
  }

  /**
   * Admin mutation: apply role/tier/suspension changes to an account by id.
   * Returns the updated public view, or undefined if the id is unknown.
   */
  async adminUpdate(
    id: string,
    patch: { role?: UserRole; tier?: SubscriptionTier; suspended?: boolean },
  ): Promise<PublicUser | undefined> {
    const user = await this.store.findById(id);
    if (!user) return undefined;
    const updated = await this.store.update({
      ...user,
      role: patch.role ?? user.role,
      tier: patch.tier ?? user.tier,
      suspended: patch.suspended ?? user.suspended,
    });
    return this.toPublic(updated);
  }

  /** Admin mutation: permanently delete an account. */
  async remove(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  /**
   * Looks up an OAuth user by email or provisions one. Links the provider to
   * an existing email account and backfills profile fields when missing.
   */
  async findOrCreateOAuth(input: {
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
    provider: AuthProvider;
  }): Promise<UserRecord> {
    const existing = await this.store.findByEmail(input.email);
    if (existing) {
      const next: UserRecord = {
        ...existing,
        name: existing.name ?? input.name ?? null,
        avatarUrl: existing.avatarUrl ?? input.avatarUrl ?? null,
        // Keep "email" if a local password exists; else reflect the OAuth source.
        provider: existing.passwordHash ? existing.provider : input.provider,
        // A verified identity provider confirms ownership of the address.
        emailVerified: true,
      };
      return this.store.update(next);
    }
    return this.buildAndInsert({
      email: input.email,
      password: null,
      tier: "FREE",
      name: input.name ?? null,
      avatarUrl: input.avatarUrl ?? null,
      provider: input.provider,
      emailVerified: true,
    });
  }

  /** Marks an account's email as confirmed (idempotent). */
  async markEmailVerified(userId: string): Promise<UserRecord | undefined> {
    const user = await this.store.findById(userId);
    if (!user) return undefined;
    if (user.emailVerified) return user;
    return this.store.update({ ...user, emailVerified: true });
  }

  /** Sets a new local password (used by the reset flow). */
  async setPassword(
    userId: string,
    newPassword: string,
  ): Promise<UserRecord | undefined> {
    const user = await this.store.findById(userId);
    if (!user) return undefined;
    return this.store.update({
      ...user,
      passwordHash: hashPassword(newPassword),
    });
  }

  /** Grants PREMIUM access for the plan period after a verified payment. */
  async activatePremium(
    userId: string,
    opts: { provider: string; reference: string; periodDays: number },
  ): Promise<UserRecord | undefined> {
    const user = await this.store.findById(userId);
    if (!user) return undefined;
    const now = Date.now();
    // Extend from the existing period end if it is still in the future.
    const base =
      user.currentPeriodEnd && Date.parse(user.currentPeriodEnd) > now
        ? Date.parse(user.currentPeriodEnd)
        : now;
    const periodEnd = new Date(base + opts.periodDays * 86_400_000).toISOString();
    return this.store.update({
      ...user,
      tier: "PREMIUM",
      subscriptionStatus: "active",
      subscriptionProvider: opts.provider,
      subscriptionRef: opts.reference,
      currentPeriodEnd: periodEnd,
    });
  }

  async setTier(
    email: string,
    tier: SubscriptionTier,
  ): Promise<PublicUser | undefined> {
    const user = await this.store.updateTier(email, tier);
    return user ? this.toPublic(user) : undefined;
  }

  toPublic(user: UserRecord): PublicUser {
    return {
      id: user.id,
      email: user.email,
      tier: user.tier,
      role: user.role,
      suspended: user.suspended,
      name: user.name,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
      emailVerified: user.emailVerified,
      subscriptionStatus: user.subscriptionStatus,
      currentPeriodEnd: user.currentPeriodEnd,
    };
  }
}
