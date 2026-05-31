import { Injectable, Logger } from "@nestjs/common";

export interface ErrorEvent {
  message: string;
  statusCode: number;
  path?: string;
  method?: string;
  stack?: string;
  timestamp: string;
}

/**
 * Dependency-free error forwarding. When ERROR_WEBHOOK_URL is set, server-side
 * (5xx) errors are POSTed as JSON to that endpoint — works with Slack/Discord
 * incoming webhooks or any custom collector. With no URL configured it is a
 * no-op (errors are still logged locally). This keeps observability honest
 * without pulling in a vendor SDK; swap in Sentry later if desired.
 */
@Injectable()
export class ErrorReporter {
  private readonly logger = new Logger(ErrorReporter.name);
  private readonly webhookUrl = process.env.ERROR_WEBHOOK_URL;
  private readonly env = process.env.NODE_ENV ?? "development";

  isConfigured(): boolean {
    return Boolean(this.webhookUrl);
  }

  /** Fire-and-forget; never throws back into the request path. */
  report(event: ErrorEvent): void {
    if (!this.webhookUrl) return;
    const payload = {
      service: "insightxi-api",
      environment: this.env,
      // "text" is what Slack/Discord render; the structured fields aid collectors.
      text: `🛑 [${this.env}] ${event.statusCode} ${event.method ?? ""} ${event.path ?? ""} — ${event.message}`,
      ...event,
    };
    void fetch(this.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch((err) =>
      this.logger.warn(`Error webhook delivery failed: ${(err as Error).message}`),
    );
  }
}
