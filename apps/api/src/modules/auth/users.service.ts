import { ConflictException, Injectable, OnModuleInit } from "@nestjs/common";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import {
  PublicUser,
  SubscriptionTier,
  UserRecord,
  UserStore,
} from "./user.store";

export type { PublicUser, SubscriptionTier } from "./user.store";
export type User = UserRecord;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
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
    await this.createWithTier("free@insightxi.dev", "password", "FREE");
    await this.createWithTier("premium@insightxi.dev", "password", "PREMIUM");
  }

  private async createWithTier(
    email: string,
    password: string,
    tier: SubscriptionTier,
  ): Promise<PublicUser> {
    const user: UserRecord = {
      id: randomUUID(),
      email,
      passwordHash: hashPassword(password),
      tier,
    };
    await this.store.insert(user);
    return this.toPublic(user);
  }

  async create(
    email: string,
    password: string,
    tier: SubscriptionTier = "FREE",
  ): Promise<PublicUser> {
    if (await this.store.findByEmail(email)) {
      throw new ConflictException("Email already registered");
    }
    return this.createWithTier(email, password, tier);
  }

  async validate(email: string, password: string): Promise<UserRecord | null> {
    const user = await this.store.findByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) return null;
    return user;
  }

  async findByEmail(email: string): Promise<UserRecord | undefined> {
    return this.store.findByEmail(email);
  }

  async setTier(
    email: string,
    tier: SubscriptionTier,
  ): Promise<PublicUser | undefined> {
    const user = await this.store.updateTier(email, tier);
    return user ? this.toPublic(user) : undefined;
  }

  toPublic(user: UserRecord): PublicUser {
    return { id: user.id, email: user.email, tier: user.tier };
  }
}
