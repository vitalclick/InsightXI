import { Injectable, Logger } from "@nestjs/common";
import {
  ChargeInput,
  CheckoutSession,
  PaymentGateway,
  PaymentVerification,
} from "./gateway.types";

/**
 * PayPal Orders v2 integration. Works with the client-side JS SDK (the order
 * id is captured after onApprove) and with the redirect/approve-link flow.
 * Environment is selected by PAYPAL_ENV ("live" → production, else sandbox).
 */
@Injectable()
export class PaypalGateway implements PaymentGateway {
  readonly provider = "paypal" as const;
  readonly supportedCurrencies = [
    "USD",
    "EUR",
    "GBP",
    "CAD",
    "AUD",
    "JPY",
    "BRL",
  ];
  readonly settlementFallback = "USD";
  private readonly logger = new Logger(PaypalGateway.name);

  private get clientId(): string | undefined {
    return process.env.PAYPAL_CLIENT_ID;
  }
  private get clientSecret(): string | undefined {
    return process.env.PAYPAL_CLIENT_SECRET;
  }
  private get apiBase(): string {
    return process.env.PAYPAL_ENV === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  private async accessToken(): Promise<string> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const res = await fetch(`${this.apiBase}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const json = (await res.json()) as { access_token?: string };
    if (!res.ok || !json.access_token) {
      throw new Error("PayPal auth failed");
    }
    return json.access_token;
  }

  async createCheckout(input: ChargeInput): Promise<CheckoutSession> {
    if (!this.isConfigured()) {
      return {
        provider: this.provider,
        reference: input.reference,
        providerReference: `MOCK-${input.reference}`,
        authorizationUrl: null,
        amount: input.amount,
        currency: input.currency.code,
        sandbox: true,
      };
    }
    const token = await this.accessToken();
    const res = await fetch(`${this.apiBase}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: input.reference,
            description: "InsightXI Premium — 30 days access",
            amount: {
              currency_code: input.currency.code,
              value: input.amount.toFixed(input.currency.decimals),
            },
          },
        ],
        application_context: {
          brand_name: "InsightXI",
          user_action: "PAY_NOW",
          return_url: input.callbackUrl,
          cancel_url: input.callbackUrl,
        },
      }),
    });
    const json = (await res.json()) as {
      id?: string;
      links?: { rel: string; href: string }[];
    };
    if (!res.ok || !json.id) {
      throw new Error("PayPal order creation failed");
    }
    const approve = json.links?.find((l) => l.rel === "approve")?.href ?? null;
    return {
      provider: this.provider,
      reference: input.reference,
      providerReference: json.id,
      authorizationUrl: approve,
      amount: input.amount,
      currency: input.currency.code,
      sandbox: false,
    };
  }

  /** `reference` is the PayPal order id. Captures an approved order. */
  async verify(reference: string): Promise<PaymentVerification> {
    if (!this.isConfigured()) {
      return { paid: true, reference };
    }
    const token = await this.accessToken();
    const get = await fetch(`${this.apiBase}/v2/checkout/orders/${reference}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const order = (await get.json()) as { status?: string };
    if (order.status === "COMPLETED") {
      return { paid: true, reference, raw: order };
    }
    if (order.status === "APPROVED") {
      const cap = await fetch(`${this.apiBase}/v2/checkout/orders/${reference}/capture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const captured = (await cap.json()) as { status?: string };
      return { paid: captured.status === "COMPLETED", reference, raw: captured };
    }
    return { paid: false, reference, raw: order };
  }

  async verifyWebhook(
    rawBody: string,
    headers: Record<string, string | undefined>,
  ): Promise<PaymentVerification | null> {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId || !this.isConfigured()) return null;
    const token = await this.accessToken();
    const event = JSON.parse(rawBody) as {
      event_type?: string;
      resource?: { custom_id?: string; id?: string };
    };
    const res = await fetch(`${this.apiBase}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_algo: headers["paypal-auth-algo"],
        cert_url: headers["paypal-cert-url"],
        transmission_id: headers["paypal-transmission-id"],
        transmission_sig: headers["paypal-transmission-sig"],
        transmission_time: headers["paypal-transmission-time"],
        webhook_id: webhookId,
        webhook_event: event,
      }),
    });
    const json = (await res.json()) as { verification_status?: string };
    if (json.verification_status !== "SUCCESS") {
      this.logger.warn("Rejected PayPal webhook with bad signature");
      return null;
    }
    const completed =
      event.event_type === "PAYMENT.CAPTURE.COMPLETED" ||
      event.event_type === "CHECKOUT.ORDER.APPROVED";
    return {
      paid: completed,
      reference: event.resource?.custom_id ?? event.resource?.id ?? "",
      raw: event,
    };
  }
}
