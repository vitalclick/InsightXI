import { Logger } from "@nestjs/common";
import { readFileSync } from "fs";
import { join } from "path";
import { Pool } from "pg";

/**
 * Applies db/schema.sql before the Nest app boots, when DATA_BACKEND=postgres.
 * It must run ahead of NestFactory.create so that repositories/stores which
 * read the database in their onModuleInit hooks find the tables in place.
 *
 * The schema uses `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`,
 * so this is idempotent — a lightweight stand-in for a full migration tool.
 */
export async function applyMigrations(): Promise<void> {
  if (process.env.DATA_BACKEND !== "postgres") return;
  const logger = new Logger("Migrations");
  const sql = loadSchema();
  if (!sql) {
    logger.warn("schema.sql not found; skipping migrations");
    return;
  }
  const connectionString = process.env.DATABASE_URL;
  const needsSsl =
    !!connectionString && /neon\.tech|sslmode=require/.test(connectionString);
  const pool = new Pool({
    connectionString,
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
  try {
    // No bind params in DDL, so the whole file runs as one simple query.
    await pool.query(sql);
    logger.log("Applied db/schema.sql (idempotent migrations)");
  } finally {
    await pool.end();
  }
}

/** Resolve schema.sql across ts-node (src) and compiled (dist) layouts. */
function loadSchema(): string | null {
  const candidates = [
    join(__dirname, "schema.sql"),
    join(process.cwd(), "src", "db", "schema.sql"),
    join(process.cwd(), "dist", "db", "schema.sql"),
  ];
  for (const path of candidates) {
    try {
      return readFileSync(path, "utf8");
    } catch {
      /* try next */
    }
  }
  return null;
}
