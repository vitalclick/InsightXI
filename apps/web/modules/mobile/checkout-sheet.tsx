"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { api } from "../../services/api-client";
import type { AuthResponse, PaymentProvider, PlanResponse } from "../../lib/types";

const METHODS: { id: PaymentProvider; label: string; note: string }[] = [
  { id: "paystack", label: "Paystack", note: "Cards, bank, USSD, mobile money" },
  { id: "flutterwave", label: "Flutterwave", note: "Cards & mobile money across Africa" },
  { id: "paypal", label: "PayPal", note: "PayPal balance or card (USD)" },
];

interface CheckoutSheetProps {
  token: string;
  plan: PlanResponse;
  currency?: string;
  onActivated: (auth: AuthResponse) => void;
}

/**
 * Mobile Premium checkout. Mirrors the desktop CheckoutPanel flow: Paystack /
 * Flutterwave create a hosted session we redirect to (returning to
 * /premium?provider=…, which the mobile shell catches and confirms); PayPal
 * uses the JS SDK buttons (confirmed inline). The redirect-return confirmation
 * itself is handled centrally in MobileApp so it works regardless of tab.
 */
export function CheckoutSheet({ token, plan, currency, onActivated }: CheckoutSheetProps) {
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
    if (paypalRendered.current || !window.paypal || !paypalContainer.current || !plan.paypalClientId) return;
    paypalRendered.current = true;
    window.paypal
      .Buttons({
        style: { layout: "horizontal", color: "blue", shape: "pill", height: 44 },
        createOrder: async () => {
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
  const activeNote = METHODS.find((m) => m.id === method)?.note;

  return (
    <div>
      {plan.paypalClientId && (
        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(plan.paypalClientId)}&currency=USD&intent=capture`}
          strategy="afterInteractive"
          onLoad={() => setPaypalReady(true)}
        />
      )}

      <div className="seg-row" role="tablist" aria-label="Payment method" style={{ padding: 0, marginBottom: 12 }}>
        {METHODS.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={method === m.id}
            className={`seg${method === m.id ? " active" : ""}`}
            onClick={() => {
              setMethod(m.id);
              setError(null);
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <p className="muted" style={{ fontSize: 11.5, margin: "0 0 14px" }}>
        {activeNote}
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
          <button className="btn btn-gold tappable" style={{ width: "100%" }} disabled={busy} onClick={() => payHosted("paypal")}>
            {busy ? "Processing…" : `Pay ${plan.plan.base.display} with PayPal`}
          </button>
        )
      ) : (
        <button className="btn btn-gold tappable" style={{ width: "100%" }} disabled={busy} onClick={() => payHosted(method)}>
          {busy ? "Processing…" : `Pay ${plan.plan.local.display} with ${METHODS.find((m) => m.id === method)?.label}`}
        </button>
      )}

      {status && <p style={{ fontSize: 12.5, marginTop: 12, color: "var(--green)" }}>{status}</p>}
      {error && <p style={{ fontSize: 12.5, marginTop: 12, color: "var(--red)" }}>{error}</p>}

      <p className="dim" style={{ fontSize: 11, marginTop: 14, lineHeight: 1.5 }}>
        Secure checkout. Every InsightXI bet is ranked by our AI model and backed by a real, settled win rate.
        18+, bet responsibly. Cancel anytime; access runs for the paid {plan.plan.periodDays}-day period.
      </p>
    </div>
  );
}
