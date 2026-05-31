import { Injectable, Logger } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "crypto";
import { getCurrency, toMinorUnits } from "../currency";
import {
  ChargeInput,
  CheckoutSession,
  PaymentGateway,
  PaymentVerification,
} from "./gateway.types";

const PAYSTACK_API = "https://api.paystack.co";

/**
 * Paystack (Africa-focused) integration. Amounts are charged in the smallest
 * currency unit (kobo/pesewa/cents). Webhooks are verified with the HMAC-SHA512
 * `x-paystack-signature` header over the raw body.
 */
@Injectable()
export class PaystackGateway implements PaymentGateway {
  readonly provider = "paystack" as const;
  readonly supportedCurrencies = ["NGN", "GHS", "ZAR", "KES", "USD"];
  readonly settlementFallback = "NGN";
  private readonly logger = new Logger(PaystackGateway.name);

  private get secret(): string | undefined {
    return process.env.PAYSTACK_SECRET_KEY;
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
    const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        amount: toMinorUnits(input.amount, input.currency),
        currency: input.currency.code,
        reference: input.reference,
        callback_url: input.callbackUrl,
      }),
    });
    const json = (await res.json()) as {
      status: boolean;
      message: string;
      data?: { authorization_url: string; reference: string };
    };
    if (!res.ok || !json.status || !json.data) {
      throw new Error(`Paystack init failed: ${json.message ?? res.statusText}`);
    }
    return {
      provider: this.provider,
      reference: json.data.reference,
      authorizationUrl: json.data.authorization_url,
      amount: input.amount,
      currency: input.currency.code,
      sandbox: false,
    };
  }

  async verify(reference: string): Promise<PaymentVerification> {
    if (!this.isConfigured()) {
      return { paid: true, reference };
    }
    const res = await fetch(
      `${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${this.secret}` } },
    );
    const json = (await res.json()) as {
      status: boolean;
      data?: { status: string; amount: number; currency: string };
    };
    const data = json.data;
    const paid = Boolean(json.status && data?.status === "success");
    return {
      paid,
      reference,
      amount: data ? data.amount / 10 ** getCurrency(data.currency).decimals : undefined,
      currency: data?.currency,
      raw: json,
    };
  }

  async verifyWebhook(
    rawBody: string,
    headers: Record<string, string | undefined>,
  ): Promise<PaymentVerification | null> {
    if (!this.secret) return null;
    const signature = headers["x-paystack-signature"];
    if (!signature) return null;
    const expected = createHmac("sha512", this.secret).update(rawBody).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      this.logger.warn("Rejected Paystack webhook with bad signature");
      return null;
    }
    const event = JSON.parse(rawBody) as {
      event: string;
      data?: { reference: string; status: string; amount: number; currency: string };
    };
    if (event.event !== "charge.success" || !event.data) return null;
    return {
      paid: event.data.status === "success",
      reference: event.data.reference,
      amount: event.data.amount / 10 ** getCurrency(event.data.currency).decimals,
      currency: event.data.currency,
      raw: event,
    };
  }
}
