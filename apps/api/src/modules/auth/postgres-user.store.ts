import { Injectable } from "@nestjs/common";
import { PgService } from "../../db/pg.service";
import {
  AuthProvider,
  SubscriptionStatus,
  SubscriptionTier,
  UserRecord,
  UserStore,
} from "./user.store";

interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  tier: SubscriptionTier;
  name: string | null;
  avatar_url: string | null;
  provider: AuthProvider;
  email_verified: boolean | null;
  subscription_status: SubscriptionStatus;
  subscription_provider: string | null;
  subscription_ref: string | null;
  current_period_end: string | null;
}

const COLUMNS =
  "id, email, password_hash, tier, name, avatar_url, provider, email_verified, " +
  "subscription_status, subscription_provider, subscription_ref, current_period_end";

function toRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    tier: row.tier,
    name: row.name,
    avatarUrl: row.avatar_url,
    provider: row.provider,
    emailVerified: row.email_verified ?? false,
    subscriptionStatus: row.subscription_status,
    subscriptionProvider: row.subscription_provider,
    subscriptionRef: row.subscription_ref,
    currentPeriodEnd: row.current_period_end,
  };
}

/** Postgres-backed user store (DATA_BACKEND=postgres). */
@Injectable()
export class PostgresUserStore extends UserStore {
  constructor(private readonly pg: PgService) {
    super();
  }

  async findByEmail(email: string): Promise<UserRecord | undefined> {
    const rows = await this.pg.query<UserRow>(
      `SELECT ${COLUMNS} FROM users WHERE email = $1`,
      [email.toLowerCase()],
    );
    return rows[0] ? toRecord(rows[0]) : undefined;
  }

  async findById(id: string): Promise<UserRecord | undefined> {
    const rows = await this.pg.query<UserRow>(
      `SELECT ${COLUMNS} FROM users WHERE id = $1`,
      [id],
    );
    return rows[0] ? toRecord(rows[0]) : undefined;
  }

  async insert(user: UserRecord): Promise<void> {
    await this.pg.query(
      `INSERT INTO users (${COLUMNS})
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (email) DO NOTHING`,
      [
        user.id,
        user.email.toLowerCase(),
        user.passwordHash,
        user.tier,
        user.name,
        user.avatarUrl,
        user.provider,
        user.emailVerified,
        user.subscriptionStatus,
        user.subscriptionProvider,
        user.subscriptionRef,
        user.currentPeriodEnd,
      ],
    );
  }

  async update(user: UserRecord): Promise<UserRecord> {
    const rows = await this.pg.query<UserRow>(
      `UPDATE users SET
         password_hash = $2, tier = $3, name = $4, avatar_url = $5,
         provider = $6, email_verified = $7, subscription_status = $8,
         subscription_provider = $9, subscription_ref = $10, current_period_end = $11
       WHERE id = $1
       RETURNING ${COLUMNS}`,
      [
        user.id,
        user.passwordHash,
        user.tier,
        user.name,
        user.avatarUrl,
        user.provider,
        user.emailVerified,
        user.subscriptionStatus,
        user.subscriptionProvider,
        user.subscriptionRef,
        user.currentPeriodEnd,
      ],
    );
    return rows[0] ? toRecord(rows[0]) : user;
  }

  async updateTier(
    email: string,
    tier: SubscriptionTier,
  ): Promise<UserRecord | undefined> {
    const rows = await this.pg.query<UserRow>(
      `UPDATE users SET tier = $2 WHERE email = $1 RETURNING ${COLUMNS}`,
      [email.toLowerCase(), tier],
    );
    return rows[0] ? toRecord(rows[0]) : undefined;
  }
}
