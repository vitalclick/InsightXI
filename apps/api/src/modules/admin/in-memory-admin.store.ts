import { Injectable } from "@nestjs/common";
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

/** Default admin store — process-local arrays seeded deterministically. */
@Injectable()
export class InMemoryAdminStore extends AdminStore {
  private readonly tickets = seedTickets();
  private readonly posts = seedPosts();
  private readonly flags = seedFlags();
  private readonly transactions = seedTransactions();
  private readonly auditLog = seedAudit();

  async seedIfEmpty(): Promise<void> {
    /* arrays are seeded at construction */
  }

  async listTickets(): Promise<SupportTicket[]> {
    return this.tickets;
  }

  async updateTicket(
    id: string,
    patch: { status?: SupportTicket["status"]; assignee?: string; date: string },
  ): Promise<SupportTicket | undefined> {
    const ticket = this.tickets.find((t) => t.id === id);
    if (!ticket) return undefined;
    if (patch.status) ticket.status = patch.status;
    if (patch.assignee) ticket.assignee = patch.assignee;
    ticket.date = patch.date;
    return ticket;
  }

  async listPosts(): Promise<ContentPost[]> {
    return this.posts;
  }

  async insertPost(post: ContentPost): Promise<ContentPost> {
    this.posts.unshift(post);
    return post;
  }

  async updatePost(
    id: string,
    patch: { status?: ContentPost["status"] },
  ): Promise<ContentPost | undefined> {
    const post = this.posts.find((p) => p.id === id);
    if (!post) return undefined;
    if (patch.status) post.status = patch.status;
    return post;
  }

  async deletePost(id: string): Promise<boolean> {
    const idx = this.posts.findIndex((p) => p.id === id);
    if (idx < 0) return false;
    this.posts.splice(idx, 1);
    return true;
  }

  async listFlags(): Promise<FeatureFlag[]> {
    return this.flags;
  }

  async setFlag(key: string, enabled: boolean): Promise<FeatureFlag | undefined> {
    const flag = this.flags.find((f) => f.key === key);
    if (!flag) return undefined;
    flag.enabled = enabled;
    return flag;
  }

  async listTransactions(): Promise<AdminTransaction[]> {
    return this.transactions;
  }

  async refundTransaction(id: string): Promise<AdminTransaction | undefined> {
    const txn = this.transactions.find((t) => t.id === id);
    if (!txn) return undefined;
    txn.status = "Refunded";
    return txn;
  }

  async listAudit(): Promise<AuditEntry[]> {
    return this.auditLog;
  }

  async appendAudit(entry: AuditEntry): Promise<void> {
    this.auditLog.unshift(entry);
  }
}
