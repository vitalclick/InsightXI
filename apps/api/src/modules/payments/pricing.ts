/**
 * InsightXI Premium plan definition. Pricing is anchored in USD and localized
 * for display via the CurrencyService; gateways charge in their settlement
 * currency (see PaymentsService).
 */
export const PREMIUM_PLAN = {
  id: "premium-monthly",
  name: "Premium",
  badge: "VIP",
  tagline: "True Football Intelligence — unlocked",
  amountUsd: 2.49,
  baseCurrency: "USD",
  interval: "month" as const,
  /** Access granted per successful payment. */
  periodDays: 30,
  features: [
    "Daily Odds: 1.50 – 2.50",
    "Mega Odds: 5.00 – 15.00",
    "High-Confidence Picks",
    "30 Days Access",
  ],
  /** Analytical capabilities behind the tier (used by the value grid). */
  capabilities: [
    "Elite confidence insights & probability rings",
    "Tactical AI reports and matchup edge",
    "Correct-score modelling & expected-goals matrix",
    "Hidden-trend detection and season trends",
  ],
} as const;

export type PremiumPlan = typeof PREMIUM_PLAN;
