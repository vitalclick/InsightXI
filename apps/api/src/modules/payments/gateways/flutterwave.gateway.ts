import { Injectable, Logger } from "@nestjs/common";
import { timingSafeEqual } from "crypto";
import {
  ChargeInput,
  CheckoutSession,
  PaymentGateway,
  PaymentVerification,
} from "./gateway.types";

const FLW_API = "https://api.flutterwave.com/v3";

/**
 * Flutterwave (broad African + international coverage) integration. Uses the
 * Standard hosted-payment flow; amounts are charged in the major unit.
 * Webhooks are authenticated with the configured `verif-hash` secret.
 */
@Injectable()
export class FlutterwaveGateway implements PaymentGateway {
  readonly provider = "flutterwave" as const;
  readonly supportedCurrencies = [
    "NGN",
    "GHS",
    "KES",
    "ZAR",
    "UGX",
    "TZS",
    "RWF",
    "XOF",
    "XAF",
    "USD",
    "EUR",
    "GBP",
  ];
  readonly settlementFallback = "USD";
  private readonly logger = new Logger(FlutterwaveGateway.name);

  private get secret(): string | undefined {
    return process.env.FLUTTERWAVE_SECRET_KEY;
  }

  isConfigured(): boolean {
    return Boolean(this.secret);
  }

  async createCheckout(input: ChargeInput): Promise<CheckoutSession> {
    if (!this.isConfigured()) {
      return {
        provider: this.provider,
        reference: input.reference,
        authorizationUrl: null,
        amount: input.amount,
        currency: input.currency.code,
        sandbox: true,
      };
    }
    const res = await fetch(`${FLW_API}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: input.reference,
        amount: input.amount,
        currency: input.currency.code,
        redirect_url: input.callbackUrl,
        customer: { email: input.email },
        customizations: {
          title: "InsightXI Premium",
          description: "VIP football intelligence — 30 days access",
        },
      }),
    });
    const json = (await res.json()) as {
      status: string;
      message: string;
      data?: { link: string };
    };
    if (!res.ok || json.status !== "success" || !json.data) {
      throw new Error(`Flutterwave init failed: ${json.message ?? res.statusText}`);
    }
    return {
      provider: this.provider,
      reference: input.reference,
      authorizationUrl: json.data.link,
      amount: input.amount,
      currency: input.currency.code,
      sandbox: false,
    };
  }

  /** `reference` may be a Flutterwave transaction id or our tx_ref. */
  async verify(reference: string): Promise<PaymentVerification> {
    if (!this.isConfigured()) {
      return { paid: true, reference };
    }
    const res = await fetch(
      `${FLW_API}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${this.secret}` } },
    );
    const json = (await res.json()) as {
      status: string;
      data?: { status: string; tx_ref: string; amount: number; currency: string };
    };
    const data = json.data;
    return {
      paid: json.status === "success" && data?.status === "successful",
      reference: data?.tx_ref ?? reference,
      amount: data?.amount,
      currency: data?.currency,
      raw: json,
    };
  }

  async verifyWebhook(
    rawBody: string,
    headers: Record<string, string | undefined>,
  ): Promise<PaymentVerification | null> {
    const expected = process.env.FLUTTERWAVE_WEBHOOK_HASH;
    if (!expected) return null;
    const provided = headers["verif-hash"];
    if (!provided) return null;
    const a = Buffer.from(expected);
    const b = Buffer.from(provided);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      this.logger.warn("Rejected Flutterwave webhook with bad verif-hash");
      return null;
    }
    const event = JSON.parse(rawBody) as {
      event: string;
      data?: { status: string; tx_ref: string; amount: number; currency: string };
    };
    if (!event.data) return null;
    return {
      paid: event.data.status === "successful",
      reference: event.data.tx_ref,
      amount: event.data.amount,
      currency: event.data.currency,
      raw: event,
    };
  }
}
