import { Injectable } from "@nestjs/common";
import { PgService } from "../../db/pg.service";
import {
  SubscriptionTier,
  UserRecord,
  UserStore,
} from "./user.store";

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  tier: SubscriptionTier;
}

function toRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    tier: row.tier,
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
      "SELECT id, email, password_hash, tier FROM users WHERE email = $1",
      [email],
    );
    return rows[0] ? toRecord(rows[0]) : undefined;
  }

  async insert(user: UserRecord): Promise<void> {
    await this.pg.query(
      `INSERT INTO users (id, email, password_hash, tier)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [user.id, user.email, user.passwordHash, user.tier],
    );
  }

  async updateTier(
    email: string,
    tier: SubscriptionTier,
  ): Promise<UserRecord | undefined> {
    const rows = await this.pg.query<UserRow>(
      `UPDATE users SET tier = $2 WHERE email = $1
       RETURNING id, email, password_hash, tier`,
      [email, tier],
    );
    return rows[0] ? toRecord(rows[0]) : undefined;
  }
}
