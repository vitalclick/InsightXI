import { Injectable, ConflictException } from "@nestjs/common";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export type SubscriptionTier = "FREE" | "PREMIUM";

export interface User {
  id: string;
  email: string;
  passwordHash: string; // salt:hash (hex)
  tier: SubscriptionTier;
}

export interface PublicUser {
  id: string;
  email: string;
  tier: SubscriptionTier;
}

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
 * In-memory user store. Swap for a Postgres-backed repository later; the
 * service contract stays the same. Seeded with a free and a premium demo user.
 */
@Injectable()
export class UsersService {
  private readonly users = new Map<string, User>();
  private seq = 0;

  constructor() {
    this.seed("free@insightxi.dev", "password", "FREE");
    this.seed("premium@insightxi.dev", "password", "PREMIUM");
  }

  private seed(email: string, password: string, tier: SubscriptionTier): void {
    const id = `u${++this.seq}`;
    this.users.set(email, {
      id,
      email,
      passwordHash: hashPassword(password),
      tier,
    });
  }

  create(
    email: string,
    password: string,
    tier: SubscriptionTier = "FREE",
  ): PublicUser {
    if (this.users.has(email)) {
      throw new ConflictException("Email already registered");
    }
    const id = `u${++this.seq}`;
    const user: User = {
      id,
      email,
      passwordHash: hashPassword(password),
      tier,
    };
    this.users.set(email, user);
    return this.toPublic(user);
  }

  validate(email: string, password: string): User | null {
    const user = this.users.get(email);
    if (!user || !verifyPassword(password, user.passwordHash)) return null;
    return user;
  }

  findByEmail(email: string): User | undefined {
    return this.users.get(email);
  }

  setTier(email: string, tier: SubscriptionTier): PublicUser | null {
    const user = this.users.get(email);
    if (!user) return null;
    user.tier = tier;
    return this.toPublic(user);
  }

  toPublic(user: User): PublicUser {
    return { id: user.id, email: user.email, tier: user.tier };
  }
}
