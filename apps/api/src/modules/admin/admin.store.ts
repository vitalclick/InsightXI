import {
  AdminTransaction,
  AuditEntry,
  ContentPost,
  FeatureFlag,
  SupportTicket,
} from "./admin.types";

/**
 * Persistence boundary for the admin subsystems (tickets, content, feature
 * flags, transactions, audit log). Backed in-memory (default) or by Postgres,
 * selected by DATA_BACKEND — AdminService stays storage-agnostic.
 */
export abstract class AdminStore {
  /** Seed deterministic demo data when the backing store is empty (idempotent). */
  abstract seedIfEmpty(): Promise<void>;

  // Tickets
  abstract listTickets(): Promise<SupportTicket[]>;
  abstract updateTicket(
    id: string,
    patch: { status?: SupportTicket["status"]; assignee?: string; date: string },
  ): Promise<SupportTicket | undefined>;

  // Content
  abstract listPosts(): Promise<ContentPost[]>;
  abstract insertPost(post: ContentPost): Promise<ContentPost>;
  abstract updatePost(
    id: string,
    patch: { status?: ContentPost["status"] },
  ): Promise<ContentPost | undefined>;
  abstract deletePost(id: string): Promise<boolean>;

  // Feature flags
  abstract listFlags(): Promise<FeatureFlag[]>;
  abstract setFlag(key: string, enabled: boolean): Promise<FeatureFlag | undefined>;

  // Transactions
  abstract listTransactions(): Promise<AdminTransaction[]>;
  abstract refundTransaction(id: string): Promise<AdminTransaction | undefined>;

  // Audit log
  abstract listAudit(): Promise<AuditEntry[]>;
  abstract appendAudit(entry: AuditEntry): Promise<void>;
}
