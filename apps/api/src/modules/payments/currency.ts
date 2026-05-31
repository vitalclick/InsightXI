/**
 * Currency catalog, country→currency mapping, and static fallback FX rates
 * (USD base). These rates are an offline fallback for display localization —
 * when CURRENCY_RATES_JSON is provided it overrides individual rates, keeping
 * the platform's statistical-integrity promise (prices are clearly estimated,
 * never fabricated as exact). Gateways always charge in a real, supported
 * settlement currency.
 */

export interface CurrencyMeta {
  code: string;
  symbol: string;
  /** Minor units (2 for most; 0 for zero-decimal currencies like JPY). */
  decimals: number;
  /** Approximate units per 1 USD (fallback only). */
  rate: number;
}

/** Catalog keyed by ISO-4217 code. USD is the anchor (rate 1). */
export const CURRENCIES: Record<string, CurrencyMeta> = {
  USD: { code: "USD", symbol: "$", decimals: 2, rate: 1 },
  EUR: { code: "EUR", symbol: "€", decimals: 2, rate: 0.92 },
  GBP: { code: "GBP", symbol: "£", decimals: 2, rate: 0.79 },
  NGN: { code: "NGN", symbol: "₦", decimals: 2, rate: 1550 },
  GHS: { code: "GHS", symbol: "GH₵", decimals: 2, rate: 15.2 },
  ZAR: { code: "ZAR", symbol: "R", decimals: 2, rate: 18.4 },
  KES: { code: "KES", symbol: "KSh", decimals: 2, rate: 129 },
  UGX: { code: "UGX", symbol: "USh", decimals: 0, rate: 3750 },
  TZS: { code: "TZS", symbol: "TSh", decimals: 0, rate: 2550 },
  RWF: { code: "RWF", symbol: "FRw", decimals: 0, rate: 1300 },
  XOF: { code: "XOF", symbol: "CFA", decimals: 0, rate: 605 },
  XAF: { code: "XAF", symbol: "FCFA", decimals: 0, rate: 605 },
  EGP: { code: "EGP", symbol: "E£", decimals: 2, rate: 48.5 },
  MAD: { code: "MAD", symbol: "DH", decimals: 2, rate: 9.9 },
  CAD: { code: "CAD", symbol: "CA$", decimals: 2, rate: 1.36 },
  AUD: { code: "AUD", symbol: "A$", decimals: 2, rate: 1.51 },
  INR: { code: "INR", symbol: "₹", decimals: 2, rate: 83.2 },
  BRL: { code: "BRL", symbol: "R$", decimals: 2, rate: 5.1 },
  JPY: { code: "JPY", symbol: "¥", decimals: 0, rate: 157 },
  CNY: { code: "CNY", symbol: "CN¥", decimals: 2, rate: 7.2 },
  AED: { code: "AED", symbol: "AED", decimals: 2, rate: 3.67 },
};

export const DEFAULT_CURRENCY = "USD";

/** ISO-3166 alpha-2 country → currency code. Unknown countries fall to USD. */
export const COUNTRY_CURRENCY: Record<string, string> = {
  US: "USD",
  GB: "GBP",
  NG: "NGN",
  GH: "GHS",
  ZA: "ZAR",
  KE: "KES",
  UG: "UGX",
  TZ: "TZS",
  RW: "RWF",
  EG: "EGP",
  MA: "MAD",
  CA: "CAD",
  AU: "AUD",
  IN: "INR",
  BR: "BRL",
  JP: "JPY",
  CN: "CNY",
  AE: "AED",
  // Eurozone (subset)
  DE: "EUR",
  FR: "EUR",
  ES: "EUR",
  IT: "EUR",
  IE: "EUR",
  NL: "EUR",
  PT: "EUR",
  // West/Central African CFA zones (subset)
  SN: "XOF",
  CI: "XOF",
  ML: "XOF",
  CM: "XAF",
  GA: "XAF",
};

export function getCurrency(code: string | undefined | null): CurrencyMeta {
  if (!code) return CURRENCIES[DEFAULT_CURRENCY];
  return CURRENCIES[code.toUpperCase()] ?? CURRENCIES[DEFAULT_CURRENCY];
}

export function currencyForCountry(country: string | undefined | null): string {
  if (!country) return DEFAULT_CURRENCY;
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? DEFAULT_CURRENCY;
}

/** Round a USD amount into the target currency's major unit. */
export function convertFromUsd(amountUsd: number, currency: CurrencyMeta): number {
  const raw = amountUsd * currency.rate;
  if (currency.decimals === 0) return Math.round(raw);
  const factor = 10 ** currency.decimals;
  return Math.round(raw * factor) / factor;
}

/** Smallest-unit integer (kobo/pesewa/cents) — required by Paystack et al. */
export function toMinorUnits(amount: number, currency: CurrencyMeta): number {
  return Math.round(amount * 10 ** currency.decimals);
}

export function formatMoney(amount: number, currency: CurrencyMeta): string {
  const grouped = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  }).format(amount);
  return `${currency.symbol}${grouped}`;
}

/**
 * Apply optional rate overrides from CURRENCY_RATES_JSON (a JSON object of
 * { CODE: ratePerUsd }). Mutates the catalog in place; called once at boot.
 */
export function applyRateOverrides(json: string | undefined): void {
  if (!json) return;
  try {
    const overrides = JSON.parse(json) as Record<string, number>;
    for (const [code, rate] of Object.entries(overrides)) {
      const meta = CURRENCIES[code.toUpperCase()];
      if (meta && typeof rate === "number" && rate > 0) meta.rate = rate;
    }
  } catch {
    // Ignore malformed overrides — fall back to static rates.
  }
}
