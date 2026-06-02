import { Injectable } from "@nestjs/common";
import { NotificationRecord, NotificationStore } from "./notification.store";

/** Default store — process-local list (resets on restart). */
@Injectable()
export class InMemoryNotificationStore extends NotificationStore {
  private readonly items: NotificationRecord[] = [];

  async insert(notification: NotificationRecord): Promise<void> {
    this.items.push(notification);
  }

  async listForUser(userId: string, limit: number): Promise<NotificationRecord[]> {
    // Insertion order is creation order; return newest-first deterministically
    // (sorting by the ISO timestamp alone is ambiguous within the same ms).
    return this.items
      .filter((n) => n.userId === userId)
      .reverse()
      .slice(0, limit);
  }

  async unreadCount(userId: string): Promise<number> {
    return this.items.filter((n) => n.userId === userId && !n.read).length;
  }

  async markRead(userId: string, id: string): Promise<boolean> {
    const found = this.items.find((n) => n.id === id && n.userId === userId);
    if (!found) return false;
    found.read = true;
    return true;
  }

  async markAllRead(userId: string): Promise<void> {
    for (const n of this.items) if (n.userId === userId) n.read = true;
  }

  async deleteForUser(userId: string): Promise<void> {
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (this.items[i].userId === userId) this.items.splice(i, 1);
    }
  }
}
