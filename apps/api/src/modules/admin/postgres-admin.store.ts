import { Injectable } from "@nestjs/common";
import { PgService } from "../../db/pg.service";
import { AdminStore } from "./admin.store";
import {
  AdminTransaction,
  AuditEntry,
  ContentPost,
  FeatureFlag,
  SupportTicket,
} from "./admin.types";
import {
  seedAudit,
  seedFlags,
  seedPosts,
  seedTickets,
  seedTransactions,
} from "./admin.seed";

interface TicketRow {
  id: string;
  subject: string;
  category: string;
  priority: SupportTicket["priority"];
  status: SupportTicket["status"];
  requester: string;
  assignee: string;
  updated_at: string;
}
interface PostRow {
  id: string;
  title: string;
  category: string;
  status: ContentPost["status"];
  author: string;
  views: number;
  published_at: string;
}
interface FlagRow {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
}
interface TxnRow {
  id: string;
  user_name: string;
  email: string;
  plan: AdminTransaction["plan"];
  amount: string | number;
  status: AdminTransaction["status"];
  method: string;
  created_at: string;
}
interface AuditRow {
  id: string;
  actor: string;
  action: string;
  target: string;
  ip: string;
  at: string;
}

const toTicket = (r: TicketRow): SupportTicket => ({
  id: r.id,
  subject: r.subject,
  category: r.category,
  priority: r.priority,
  status: r.status,
  requester: r.requester,
  assignee: r.assignee,
  date: r.updated_at,
});
const toPost = (r: PostRow): ContentPost => ({
  id: r.id,
  title: r.title,
  category: r.category,
  status: r.status,
  author: r.author,
  views: r.views,
  date: r.published_at,
});
const toTxn = (r: TxnRow): AdminTransaction => ({
  id: r.id,
  userName: r.user_name,
  email: r.email,
  plan: r.plan,
  amount: typeof r.amount === "string" ? parseFloat(r.amount) : r.amount,
  status: r.status,
  method: r.method,
  date: r.created_at,
});
const toAudit = (r: AuditRow): AuditEntry => ({
  id: r.id,
  actor: r.actor,
  action: r.action,
  target: r.target,
  ip: r.ip,
  at: r.at,
});

/** Postgres-backed admin store (DATA_BACKEND=postgres). */
@Injectable()
export class PostgresAdminStore extends AdminStore {
  constructor(private readonly pg: PgService) {
    super();
  }

  /** Populate each table with deterministic demo data only while it is empty. */
  async seedIfEmpty(): Promise<void> {
    await this.seedTable("support_tickets", seedTickets(), (t) => [
      t.id, t.subject, t.category, t.priority, t.status, t.requester, t.assignee, t.date,
    ], "(id, subject, category, priority, status, requester, assignee, updated_at)", 8);
    await this.seedTable("content_posts", seedPosts(), (p) => [
      p.id, p.title, p.category, p.status, p.author, p.views, p.date,
    ], "(id, title, category, status, author, views, published_at)", 7);
    await this.seedTable("feature_flags", seedFlags(), (f) => [
      f.key, f.name, f.description, f.enabled,
    ], "(key, name, description, enabled)", 4);
    await this.seedTable("transactions", seedTransactions(), (t) => [
      t.id, t.userName, t.email, t.plan, t.amount, t.status, t.method, t.date,
    ], "(id, user_name, email, plan, amount, status, method, created_at)", 8);
    await this.seedTable("audit_log", seedAudit(), (a) => [
      a.id, a.actor, a.action, a.target, a.ip, a.at,
    ], "(id, actor, action, target, ip, at)", 6);
  }

  private async seedTable<T>(
    table: string,
    rows: T[],
    toParams: (row: T) => unknown[],
    columns: string,
    cols: number,
  ): Promise<void> {
    const [{ count }] = await this.pg.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM ${table}`,
    );
    if (Number(count) > 0) return;
    const placeholders = Array.from({ length: cols }, (_, i) => `$${i + 1}`).join(", ");
    for (const row of rows) {
      await this.pg.query(
        `INSERT INTO ${table} ${columns} VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        toParams(row),
      );
    }
  }

  // ── Tickets ─────────────────────────────────────────────────────────────
  async listTickets(): Promise<SupportTicket[]> {
    const rows = await this.pg.query<TicketRow>(
      "SELECT * FROM support_tickets ORDER BY updated_at DESC",
    );
    return rows.map(toTicket);
  }

  async updateTicket(
    id: string,
    patch: { status?: SupportTicket["status"]; assignee?: string; date: string },
  ): Promise<SupportTicket | undefined> {
    const rows = await this.pg.query<TicketRow>(
      `UPDATE support_tickets
         SET status = COALESCE($2, status),
             assignee = COALESCE($3, assignee),
             updated_at = $4
       WHERE id = $1 RETURNING *`,
      [id, patch.status ?? null, patch.assignee ?? null, patch.date],
    );
    return rows[0] ? toTicket(rows[0]) : undefined;
  }

  // ── Content ─────────────────────────────────────────────────────────────
  async listPosts(): Promise<ContentPost[]> {
    const rows = await this.pg.query<PostRow>(
      "SELECT * FROM content_posts ORDER BY published_at DESC",
    );
    return rows.map(toPost);
  }

  async insertPost(post: ContentPost): Promise<ContentPost> {
    await this.pg.query(
      `INSERT INTO content_posts (id, title, category, status, author, views, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [post.id, post.title, post.category, post.status, post.author, post.views, post.date],
    );
    return post;
  }

  async updatePost(
    id: string,
    patch: { status?: ContentPost["status"] },
  ): Promise<ContentPost | undefined> {
    const rows = await this.pg.query<PostRow>(
      `UPDATE content_posts SET status = COALESCE($2, status) WHERE id = $1 RETURNING *`,
      [id, patch.status ?? null],
    );
    return rows[0] ? toPost(rows[0]) : undefined;
  }

  async deletePost(id: string): Promise<boolean> {
    const rows = await this.pg.query<{ id: string }>(
      "DELETE FROM content_posts WHERE id = $1 RETURNING id",
      [id],
    );
    return rows.length > 0;
  }

  // ── Feature flags ─────────────────────────────────────────────────────────
  async listFlags(): Promise<FeatureFlag[]> {
    const rows = await this.pg.query<FlagRow>("SELECT * FROM feature_flags ORDER BY name");
    return rows.map((r) => ({ key: r.key, name: r.name, description: r.description, enabled: r.enabled }));
  }

  async setFlag(key: string, enabled: boolean): Promise<FeatureFlag | undefined> {
    const rows = await this.pg.query<FlagRow>(
      "UPDATE feature_flags SET enabled = $2 WHERE key = $1 RETURNING *",
      [key, enabled],
    );
    const r = rows[0];
    return r ? { key: r.key, name: r.name, description: r.description, enabled: r.enabled } : undefined;
  }

  // ── Transactions ──────────────────────────────────────────────────────────
  async listTransactions(): Promise<AdminTransaction[]> {
    const rows = await this.pg.query<TxnRow>(
      "SELECT * FROM transactions ORDER BY created_at DESC",
    );
    return rows.map(toTxn);
  }

  async refundTransaction(id: string): Promise<AdminTransaction | undefined> {
    const rows = await this.pg.query<TxnRow>(
      "UPDATE transactions SET status = 'Refunded' WHERE id = $1 RETURNING *",
      [id],
    );
    return rows[0] ? toTxn(rows[0]) : undefined;
  }

  // ── Audit log ─────────────────────────────────────────────────────────────
  async listAudit(): Promise<AuditEntry[]> {
    const rows = await this.pg.query<AuditRow>("SELECT * FROM audit_log ORDER BY at DESC");
    return rows.map(toAudit);
  }

  async appendAudit(entry: AuditEntry): Promise<void> {
    await this.pg.query(
      `INSERT INTO audit_log (id, actor, action, target, ip, at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [entry.id, entry.actor, entry.action, entry.target, entry.ip, entry.at],
    );
  }
}
