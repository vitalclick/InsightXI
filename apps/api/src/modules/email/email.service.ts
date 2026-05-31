import { Injectable, Logger } from "@nestjs/common";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Transactional email delivery. Live via the Resend HTTP API when RESEND_API_KEY
 * is set (no SDK dependency — a single fetch, matching the payment gateways);
 * otherwise runs in sandbox mode and logs the message so the offline/dev stack
 * is fully exercisable without an email provider.
 *
 * Env:
 *   RESEND_API_KEY   enables live delivery
 *   EMAIL_FROM       From header (default "InsightXI <no-reply@insightxi.app>")
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey = process.env.RESEND_API_KEY;
  private readonly from =
    process.env.EMAIL_FROM ?? "InsightXI <no-reply@insightxi.app>";

  /** Whether live delivery is configured (vs sandbox logging). */
  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async send(message: EmailMessage): Promise<{ delivered: boolean; sandbox: boolean }> {
    if (!this.apiKey) {
      // Sandbox: never silently drop — surface enough to verify the flow.
      this.logger.log(
        `[sandbox email] to=${message.to} subject="${message.subject}" ` +
          `(set RESEND_API_KEY to deliver). Body: ${message.text}`,
      );
      return { delivered: false, sandbox: true };
    }
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.from,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
      });
      if (!res.ok) {
        this.logger.error(
          `Email delivery failed (${res.status}) to ${message.to}: ${await res.text()}`,
        );
        return { delivered: false, sandbox: false };
      }
      return { delivered: true, sandbox: false };
    } catch (err) {
      this.logger.error(
        `Email delivery error to ${message.to}: ${(err as Error).message}`,
      );
      return { delivered: false, sandbox: false };
    }
  }
}
