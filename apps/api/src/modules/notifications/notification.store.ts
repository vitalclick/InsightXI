export type NotificationType = "welcome" | "premium" | "system" | "match";

export interface NotificationRecord {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Optional in-app deep link (e.g. "/premium", "/matches/123"). */
  link: string | null;
  read: boolean;
  /** ISO timestamp. */
  createdAt: string;
}

/** Shape returned to the client (the owning user is implicit). */
export interface PublicNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

/**
 * Persistence boundary for notifications. Implemented in-memory (default) or
 * against Postgres, selected by DATA_BACKEND — the service stays storage-agnostic.
 */
export abstract class NotificationStore {
  abstract insert(notification: NotificationRecord): Promise<void>;
  abstract listForUser(userId: string, limit: number): Promise<NotificationRecord[]>;
  abstract unreadCount(userId: string): Promise<number>;
  /** Mark one notification read; returns true if it belonged to the user. */
  abstract markRead(userId: string, id: string): Promise<boolean>;
  abstract markAllRead(userId: string): Promise<void>;
}
