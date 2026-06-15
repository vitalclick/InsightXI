"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { api } from "../../services/api-client";
import type { AuthResponse, PaymentProvider, PlanResponse } from "../../lib/types";

interface CheckoutPanelProps {
  token: string;
  plan: PlanResponse;
  currency?: string;
  onActivated: (auth: AuthResponse) => void;
}

const METHODS: { id: PaymentProvider; label: string; note: string }[] = [
  { id: "paystack", label: "Paystack", note: "Cards, bank, USSD, mobile money" },
  { id: "flutterwave", label: "Flutterwave", note: "Cards & mobile money across Africa" },
  { id: "paypal", label: "PayPal", note: "PayPal balance or card (USD)" },
];

/** Reads a payment callback (provider + reference) from the return URL. */
function callbackRef(params: URLSearchParams): { provider: PaymentProvider; reference: string } | null {
  const provider = params.get("provider") as PaymentProvider | null;
  if (!provider) return null;
  const reference =
    provider === "paystack"
      ? params.get("reference") ?? params.get("trxref")
      : provider === "flutterwave"
        ? params.get("tx_ref")
        : params.get("token"); // paypal redirect returns the order id as `token`
  return reference ? { provider, reference } : null;
}

export function CheckoutPanel({ token, plan, currency, onActivated }: CheckoutPanelProps) {
  const [method, setMethod] = useState<PaymentProvider>("paystack");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [paypalReady, setPaypalReady] = useState(false);
  const paypalContainer = useRef<HTMLDivElement>(null);
  const paypalRendered = useRef(false);

  const confirm = useCallback(
    async (provider: PaymentProvider, reference: string) => {
      setBusy(true);
      setError(null);
      setStatus("Verifying payment…");
      try {
        const res = await api.confirmPayment(provider, reference, token);
        if (res.status === "active" && res.auth) {
          setStatus("Payment confirmed — Premium unlocked.");
          onActivated(res.auth);
        } else {
          setStatus("Payment is pending confirmation. It will unlock once settled.");
        }
      } catch {
        setError("We couldn't verify that payment. If you were charged, contact support.");
        setStatus(null);
      } finally {
        setBusy(false);
      }
    },
    [token, onActivated],
  );

  // Handle redirect-back from a hosted checkout (Paystack/Flutterwave/PayPal).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const cb = callbackRef(params);
    if (!cb) return;
    // Clean the query so a refresh doesn't re-trigger verification.
    window.history.replaceState({}, "", window.location.pathname);
    void confirm(cb.provider, cb.reference);
  }, [confirm]);

  /** Paystack / Flutterwave: backend creates a hosted session, we redirect. */
  async function payHosted(provider: PaymentProvider) {
    setBusy(true);
    setError(null);
    try {
      const session = await api.checkout(provider, token, { currency });
      if (session.authorizationUrl) {
        window.location.href = session.authorizationUrl; // live hosted checkout
      } else {
        await confirm(provider, session.reference); // sandbox (no keys configured)
      }
    } catch {
      setError("Could not start checkout. Please try again.");
      setBusy(false);
    }
  }

  // PayPal JS SDK buttons (live when a client id is configured).
  const renderPaypal = useCallback(() => {
    if (
      paypalRendered.current ||
      !window.paypal ||
      !paypalContainer.current ||
      !plan.paypalClientId
    ) {
      return;
    }
    paypalRendered.current = true;
    window.paypal
      .Buttons({
        style: { layout: "horizontal", color: "blue", shape: "pill", height: 44 },
        createOrder: async () => {
          // PayPal settles in USD (the plan anchor) to match the SDK currency.
          const session = await api.checkout("paypal", token, { currency: "USD" });
          return session.providerReference ?? session.reference;
        },
        onApprove: async (data) => {
          await confirm("paypal", data.orderID);
        },
        onError: () => setError("PayPal checkout failed. Please try another method."),
      })
      .render(paypalContainer.current)
      .catch(() => setError("PayPal is unavailable right now."));
  }, [plan.paypalClientId, token, confirm]);

  useEffect(() => {
    if (method === "paypal" && paypalReady) renderPaypal();
  }, [method, paypalReady, renderPaypal]);

  const isSandbox = !plan.providers[method];

  return (
    <div>
      {plan.paypalClientId && (
        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(plan.paypalClientId)}&currency=USD&intent=capture`}
          strategy="afterInteractive"
          onLoad={() => setPaypalReady(true)}
        />
      )}

      <div className="seg" role="tablist" aria-label="Payment method">
        {METHODS.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={method === m.id}
            className={`seg-btn ${method === m.id ? "active" : ""}`}
            onClick={() => {
              setMethod(m.id);
              setError(null);
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <p className="muted" style={{ fontSize: 12.5, margin: "10px 0 14px" }}>
        {METHODS.find((m) => m.id === method)?.note}
        {isSandbox && (
          <span className="badge" style={{ marginLeft: 8 }}>
            sandbox
          </span>
        )}
      </p>

      {method === "paypal" ? (
        plan.paypalClientId ? (
          <div ref={paypalContainer} aria-label="PayPal buttons" />
        ) : (
          <button className="btn btn-gold" disabled={busy} onClick={() => payHosted("paypal")}>
            {busy ? "Processing…" : `Pay ${plan.plan.base.display} with PayPal`}
          </button>
        )
      ) : (
        <button className="btn btn-gold" disabled={busy} onClick={() => payHosted(method)}>
          {busy
            ? "Processing…"
            : `Pay ${plan.plan.local.display} with ${METHODS.find((m) => m.id === method)?.label}`}
        </button>
      )}

      {status && (
        <p style={{ fontSize: 13, marginTop: 12, color: "var(--green)" }}>{status}</p>
      )}
      {error && <p style={{ fontSize: 13, marginTop: 12, color: "var(--red)" }}>{error}</p>}

      <p className="dim" style={{ fontSize: 11.5, marginTop: 14 }}>
        Secure checkout. Every InsightXI bet is ranked by our AI model and backed by
        a real, settled win rate. 18+, bet responsibly. Cancel anytime; access runs for the
        paid {plan.plan.periodDays}-day period.
      </p>
      <p className="dim" style={{ fontSize: 11.5, marginTop: 8 }}>
        By subscribing you agree to our{" "}
        <a href="/terms">Terms of Service</a> and{" "}
        <a href="/privacy">Privacy Policy</a>.
      </p>
    </div>
  );
}
