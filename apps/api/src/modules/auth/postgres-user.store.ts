import { Injectable } from "@nestjs/common";
import { PgService } from "../../db/pg.service";
import {
  AuthProvider,
  SubscriptionStatus,
  SubscriptionTier,
  UserRecord,
  UserRole,
  UserStore,
} from "./user.store";

interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  tier: SubscriptionTier;
  role: UserRole | null;
  suspended: boolean | null;
  name: string | null;
  avatar_url: string | null;
  provider: AuthProvider;
  email_verified: boolean | null;
  token_version: number | null;
  subscription_status: SubscriptionStatus;
  subscription_provider: string | null;
  subscription_ref: string | null;
  current_period_end: string | null;
}

const COLUMNS =
  "id, email, password_hash, tier, role, suspended, name, avatar_url, provider, email_verified, " +
  "token_version, subscription_status, subscription_provider, subscription_ref, current_period_end";

function toRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    tier: row.tier,
    role: row.role ?? "USER",
    suspended: row.suspended ?? false,
    name: row.name,
    avatarUrl: row.avatar_url,
    provider: row.provider,
    emailVerified: row.email_verified ?? false,
    tokenVersion: row.token_version ?? 0,
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

  async list(): Promise<UserRecord[]> {
    const rows = await this.pg.query<UserRow>(
      `SELECT ${COLUMNS} FROM users ORDER BY email`,
    );
    return rows.map(toRecord);
  }

  async insert(user: UserRecord): Promise<void> {
    await this.pg.query(
      `INSERT INTO users (${COLUMNS})
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (email) DO NOTHING`,
      [
        user.id,
        user.email.toLowerCase(),
        user.passwordHash,
        user.tier,
        user.role,
        user.suspended,
        user.name,
        user.avatarUrl,
        user.provider,
        user.emailVerified,
        user.tokenVersion,
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
         password_hash = $2, tier = $3, role = $4, suspended = $5, name = $6, avatar_url = $7,
         provider = $8, email_verified = $9, subscription_status = $10,
         subscription_provider = $11, subscription_ref = $12, current_period_end = $13
       WHERE id = $1
       RETURNING ${COLUMNS}`,
      [
        user.id,
        user.passwordHash,
        user.tier,
        user.role,
        user.suspended,
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

  async delete(id: string): Promise<boolean> {
    const rows = await this.pg.query<{ id: string }>(
      `DELETE FROM users WHERE id = $1 RETURNING id`,
      [id],
    );
    return rows.length > 0;
  }

  async bumpTokenVersion(id: string): Promise<UserRecord | undefined> {
    const rows = await this.pg.query<UserRow>(
      `UPDATE users SET token_version = token_version + 1
       WHERE id = $1 RETURNING ${COLUMNS}`,
      [id],
    );
    return rows[0] ? toRecord(rows[0]) : undefined;
  }
}
