import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { randomBytes } from "crypto";
import { AuthResult, AuthService } from "../auth/auth.service";
import { UsersService } from "../auth/users.service";
import { UserRecord } from "../auth/user.store";
import { EmailService } from "../email/email.service";
import { paymentReceiptEmail } from "../email/templates";
import { convertFromUsd, getCurrency } from "./currency";
import { GeoService, RequestGeoHints } from "./geo.service";
import { PREMIUM_PLAN } from "./pricing";
import { PaypalGateway } from "./gateways/paypal.gateway";
import { PaystackGateway } from "./gateways/paystack.gateway";
import { FlutterwaveGateway } from "./gateways/flutterwave.gateway";
import {
  CheckoutSession,
  PaymentGateway,
  PaymentProvider,
} from "./gateways/gateway.types";

export interface CheckoutResult extends CheckoutSession {
  /** Human-readable settlement amount, e.g. "₦3,860". */
  display: string;
}

export interface ConfirmResult {
  status: "active" | "pending";
  auth?: AuthResult;
}

/**
 * Orchestrates the three payment gateways. References embed the user id (so
 * unauthenticated webhooks can resolve the account) and the checkout/confirm
 * endpoints stay stateless — verification is delegated to the gateway, and a
 * fresh JWT carrying the upgraded tier is issued on success.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly gateways: Record<PaymentProvider, PaymentGateway>;

  constructor(
    private readonly geo: GeoService,
    private readonly users: UsersService,
    private readonly auth: AuthService,
    private readonly email: EmailService,
    paypal: PaypalGateway,
    paystack: PaystackGateway,
    flutterwave: FlutterwaveGateway,
  ) {
    this.gateways = { paypal, paystack, flutterwave };
  }

  /** Email a receipt on activation; never let delivery break confirmation. */
  private async sendReceipt(user: UserRecord, provider: PaymentProvider, reference: string): Promise<void> {
    try {
      await this.email.send(
        paymentReceiptEmail(user.email, {
          amountDisplay: `$${PREMIUM_PLAN.amountUsd.toFixed(2)} / ${PREMIUM_PLAN.periodDays} days`,
          provider,
          periodEnd: user.currentPeriodEnd,
          reference,
        }),
      );
    } catch (err) {
      this.logger.warn(`Receipt email failed for ${user.email}: ${(err as Error).message}`);
    }
  }

  private gatewayFor(provider: PaymentProvider): PaymentGateway {
    const gw = this.gateways[provider];
    if (!gw) throw new BadRequestException(`Unknown payment provider: ${provider}`);
    return gw;
  }

  private callbackUrl(provider: PaymentProvider): string {
    const base =
      process.env.PAYMENTS_CALLBACK_URL ??
      process.env.WEB_APP_URL ??
      "http://localhost:3000";
    return `${base.replace(/\/$/, "")}/premium?provider=${provider}`;
  }

  private buildReference(userId: string): string {
    const token = Buffer.from(userId).toString("base64url");
    return `ixi_${token}_${randomBytes(8).toString("hex")}`;
  }

  private userIdFromReference(reference: string): string | null {
    const parts = reference.split("_");
    if (parts.length < 3 || parts[0] !== "ixi") return null;
    try {
      return Buffer.from(parts[1], "base64url").toString("utf8");
    } catch {
      return null;
    }
  }

  async createCheckout(
    user: { id: string; email: string },
    provider: PaymentProvider,
    hints: RequestGeoHints,
  ): Promise<CheckoutResult> {
    const gateway = this.gatewayFor(provider);
    const { currency: viewer } = this.geo.resolveCurrency(hints);
    // Settle in the viewer's currency when the gateway supports it, else fall back.
    const settlementCode = gateway.supportedCurrencies.includes(viewer.code)
      ? viewer.code
      : gateway.settlementFallback;
    const currency = getCurrency(settlementCode);
    const amount = convertFromUsd(PREMIUM_PLAN.amountUsd, currency);
    const reference = this.buildReference(user.id);

    const session = await gateway.createCheckout({
      reference,
      amount,
      currency,
      email: user.email,
      callbackUrl: this.callbackUrl(provider),
    });
    return { ...session, display: `${currency.symbol}${amount.toFixed(currency.decimals)}` };
  }

  /** Authenticated confirmation — activates the calling user on success. */
  async confirm(
    user: { id: string },
    provider: PaymentProvider,
    reference: string,
  ): Promise<ConfirmResult> {
    const result = await this.gatewayFor(provider).verify(reference);
    if (!result.paid) return { status: "pending" };
    const updated = await this.users.activatePremium(user.id, {
      provider,
      reference: result.reference,
      periodDays: PREMIUM_PLAN.periodDays,
    });
    if (!updated) throw new BadRequestException("Unknown user");
    this.logger.log(`Premium activated for ${updated.email} via ${provider}`);
    await this.sendReceipt(updated, provider, result.reference);
    return { status: "active", auth: await this.auth.issueToken(updated) };
  }

  /** Unauthenticated webhook — resolves the user from the embedded reference. */
  async handleWebhook(
    provider: PaymentProvider,
    rawBody: string,
    headers: Record<string, string | undefined>,
  ): Promise<{ received: boolean }> {
    const result = await this.gatewayFor(provider).verifyWebhook(rawBody, headers);
    if (!result || !result.paid) return { received: true };
    const userId = this.userIdFromReference(result.reference);
    if (!userId) {
      this.logger.warn(`Webhook reference without user id: ${result.reference}`);
      return { received: true };
    }
    const updated = await this.users.activatePremium(userId, {
      provider,
      reference: result.reference,
      periodDays: PREMIUM_PLAN.periodDays,
    });
    this.logger.log(`Premium activated via ${provider} webhook for user ${userId}`);
    if (updated) await this.sendReceipt(updated, provider, result.reference);
    return { received: true };
  }

  /** Which gateways are live (have keys) vs running in sandbox. */
  availability(): Record<PaymentProvider, boolean> {
    return {
      paypal: this.gateways.paypal.isConfigured(),
      paystack: this.gateways.paystack.isConfigured(),
      flutterwave: this.gateways.flutterwave.isConfigured(),
    };
  }
}
