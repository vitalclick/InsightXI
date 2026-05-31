import { CurrencyMeta } from "../currency";

export type PaymentProvider = "paypal" | "paystack" | "flutterwave";

export interface ChargeInput {
  /** Our internal reference (idempotency key) for this attempt. */
  reference: string;
  amount: number;
  currency: CurrencyMeta;
  email: string;
  /** Where the gateway should redirect the user back to after payment. */
  callbackUrl: string;
}

export interface CheckoutSession {
  provider: PaymentProvider;
  reference: string;
  /**
   * URL to redirect/open for the hosted checkout. Null in sandbox mode (no
   * keys configured) — the client then confirms directly via verify().
   */
  authorizationUrl: string | null;
  /** PayPal returns an order id distinct from our reference. */
  providerReference?: string;
  amount: number;
  currency: string;
  sandbox: boolean;
}

export interface PaymentVerification {
  paid: boolean;
  reference: string;
  amount?: number;
  currency?: string;
  raw?: unknown;
}

/**
 * Common contract every gateway implements. Each gateway runs live when its
 * keys are present, and degrades to a deterministic sandbox otherwise so the
 * upgrade flow remains demoable offline (mirrors the mock football provider).
 */
export interface PaymentGateway {
  readonly provider: PaymentProvider;
  /** Currencies the gateway can settle in (ISO-4217). */
  readonly supportedCurrencies: string[];
  /** Fallback settlement currency when the viewer's currency is unsupported. */
  readonly settlementFallback: string;
  isConfigured(): boolean;
  createCheckout(input: ChargeInput): Promise<CheckoutSession>;
  verify(reference: string): Promise<PaymentVerification>;
  /** Validate a provider webhook; returns the verification or null if invalid. */
  verifyWebhook(
    rawBody: string,
    headers: Record<string, string | undefined>,
  ): Promise<PaymentVerification | null>;
}
