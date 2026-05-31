"use client";

import { useState } from "react";
import Link from "next/link";
import { usePlan } from "../../hooks/use-plan";
import { Icon } from "../ui/icon";
import { CheckoutPanel } from "./checkout-panel";
import type { AuthResponse } from "../../lib/types";

const CURRENCY_OPTIONS = ["AUTO", "USD", "EUR", "GBP", "NGN", "GHS", "ZAR", "KES"];

interface PlanCardProps {
  token: string | null;
  isPremium: boolean;
  currentPeriodEnd?: string | null;
  onActivated: (auth: AuthResponse) => void;
}

export function PlanCard({ token, isPremium, currentPeriodEnd, onActivated }: PlanCardProps) {
  const [currency, setCurrency] = useState<string>("AUTO");
  const { data, isLoading } = usePlan(currency === "AUTO" ? undefined : currency);
  const plan = data?.plan;

  return (
    <section
      className="card reveal"
      style={{ borderColor: "rgba(232,194,112,.3)", overflow: "hidden", maxWidth: 460 }}
    >
      <div className="card-bd">
        <div className="flex aic jcb">
          <span className="badge gold">⭐ {plan?.badge ?? "PRO"} · Premium</span>
          {plan?.local.estimated && (
            <select
              aria-label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="tb-search"
              style={{ width: "auto", height: 30, padding: "0 8px", fontSize: 12, margin: 0 }}
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c === "AUTO" ? "Auto" : c}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex aic gap-8" style={{ margin: "16px 0 4px" }}>
          <span className="mono" style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-.03em" }}>
            {isLoading ? "…" : (plan?.local.display ?? "$2.49")}
          </span>
          <span className="muted" style={{ fontSize: 14 }}>/ {plan?.interval ?? "month"}</span>
        </div>
        {plan?.local.estimated && (
          <div className="dim" style={{ fontSize: 12 }}>
            ≈ {plan.base.display} USD · localized for{" "}
            {plan.country || "your region"} (estimate)
          </div>
        )}

        <div style={{ margin: "18px 0" }}>
          {(plan?.features ?? [
            "Daily high-confidence selections",
            "Value & long-shot probability reads",
            "Confidence rating on every market",
            "30 days full access",
          ]).map((f) => (
            <div className="xai-row" key={f}>
              <span className="xai-ic">
                <Icon name="check" size={15} />
              </span>
              <span className="xai-txt" style={{ fontSize: 13.5 }}>
                {f}
              </span>
            </div>
          ))}
        </div>

        {isPremium ? (
          <div>
            <span className="badge green" style={{ display: "inline-flex" }}>
              <span className="badge-dot" /> Premium active
            </span>
            {currentPeriodEnd && (
              <div className="dim" style={{ fontSize: 12, marginTop: 10 }}>
                Access through {new Date(currentPeriodEnd).toLocaleDateString()}
              </div>
            )}
          </div>
        ) : token && data ? (
          <CheckoutPanel
            token={token}
            plan={data}
            currency={currency === "AUTO" ? undefined : currency}
            onActivated={onActivated}
          />
        ) : (
          <Link href="/account" className="btn btn-gold" style={{ width: "100%" }}>
            Sign in to upgrade
          </Link>
        )}
      </div>
    </section>
  );
}
