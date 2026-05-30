import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Pool, PoolConfig } from "pg";

/**
 * Thin Postgres access layer (node-postgres). The pool is created lazily, so
 * the API boots without a database when DATA_BACKEND=memory. Neon/SSL is
 * auto-detected from the connection string.
 */
@Injectable()
export class PgService implements OnModuleDestroy {
  private readonly logger = new Logger(PgService.name);
  private _pool?: Pool;

  get pool(): Pool {
    if (!this._pool) {
      const connectionString = process.env.DATABASE_URL;
      const needsSsl =
        !!connectionString && /neon\.tech|sslmode=require/.test(connectionString);
      const config: PoolConfig = {
        connectionString,
        ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
      };
      this._pool = new Pool(config);
      this.logger.log("Postgres pool initialized");
    }
    return this._pool;
  }

  async query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
    const res = await this.pool.query(text, params as unknown[]);
    return res.rows as T[];
  }

  async onModuleDestroy(): Promise<void> {
    await this._pool?.end();
  }
}
