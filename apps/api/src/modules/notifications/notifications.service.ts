import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import {
  NotificationRecord,
  NotificationStore,
  NotificationType,
  PublicNotification,
} from "./notification.store";

const LIST_LIMIT = 50;

export interface CreateNotification {
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
}

/**
 * In-app notifications. Other modules call `notify()` on meaningful events
 * (welcome, premium activation, …); the web shell polls list + unread count.
 * Creation never throws into the caller's path — a notification failure must
 * not break signup or payment.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly store: NotificationStore) {}

  async notify(userId: string, input: CreateNotification): Promise<void> {
    const record: NotificationRecord = {
      id: randomUUID(),
      userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
      read: false,
      createdAt: new Date().toISOString(),
    };
    try {
      await this.store.insert(record);
    } catch (err) {
      this.logger.warn(
        `Failed to create notification for ${userId}: ${(err as Error).message}`,
      );
    }
  }

  async list(userId: string): Promise<PublicNotification[]> {
    const rows = await this.store.listForUser(userId, LIST_LIMIT);
    return rows.map(toPublic);
  }

  async unreadCount(userId: string): Promise<number> {
    return this.store.unreadCount(userId);
  }

  async markRead(userId: string, id: string): Promise<{ ok: boolean }> {
    return { ok: await this.store.markRead(userId, id) };
  }

  async markAllRead(userId: string): Promise<{ ok: true }> {
    await this.store.markAllRead(userId);
    return { ok: true };
  }

  /** Erase all of a user's notifications (called on account deletion). */
  async deleteAllForUser(userId: string): Promise<void> {
    await this.store.deleteForUser(userId);
  }
}

function toPublic(n: NotificationRecord): PublicNotification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.read,
    createdAt: n.createdAt,
  };
}
