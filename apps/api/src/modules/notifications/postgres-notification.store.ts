import { Injectable } from "@nestjs/common";
import { PgService } from "../../db/pg.service";
import {
  NotificationRecord,
  NotificationStore,
  NotificationType,
} from "./notification.store";

interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

const COLUMNS = "id, user_id, type, title, body, link, read, created_at";

function toRecord(row: NotificationRow): NotificationRecord {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    read: row.read,
    createdAt: row.created_at,
  };
}

/** Postgres-backed notification store (DATA_BACKEND=postgres). */
@Injectable()
export class PostgresNotificationStore extends NotificationStore {
  constructor(private readonly pg: PgService) {
    super();
  }

  async insert(n: NotificationRecord): Promise<void> {
    await this.pg.query(
      `INSERT INTO notifications (${COLUMNS})
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [n.id, n.userId, n.type, n.title, n.body, n.link, n.read, n.createdAt],
    );
  }

  async listForUser(userId: string, limit: number): Promise<NotificationRecord[]> {
    const rows = await this.pg.query<NotificationRow>(
      `SELECT ${COLUMNS} FROM notifications
       WHERE user_id = $1 ORDER BY created_at DESC, seq DESC LIMIT $2`,
      [userId, limit],
    );
    return rows.map(toRecord);
  }

  async unreadCount(userId: string): Promise<number> {
    const rows = await this.pg.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM notifications
       WHERE user_id = $1 AND read = FALSE`,
      [userId],
    );
    return Number(rows[0]?.count ?? 0);
  }

  async markRead(userId: string, id: string): Promise<boolean> {
    const rows = await this.pg.query<{ id: string }>(
      `UPDATE notifications SET read = TRUE
       WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId],
    );
    return rows.length > 0;
  }

  async markAllRead(userId: string): Promise<void> {
    await this.pg.query(
      `UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE`,
      [userId],
    );
  }
}
