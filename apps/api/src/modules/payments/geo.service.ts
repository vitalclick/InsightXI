import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import {
  applyRateOverrides,
  convertFromUsd,
  currencyForCountry,
  CurrencyMeta,
  DEFAULT_CURRENCY,
  formatMoney,
  getCurrency,
} from "./currency";
import { PREMIUM_PLAN } from "./pricing";

export interface RequestGeoHints {
  /** Cloudflare's resolved country code (preferred when behind the CDN). */
  cfCountry?: string;
  /** Explicit overrides supplied by the client (browser locale region). */
  country?: string;
  currency?: string;
}

export interface LocalizedPrice {
  amount: number;
  currency: string;
  symbol: string;
  display: string;
  /** True when the amount is an FX-converted estimate, not the charge currency. */
  estimated: boolean;
}

export interface LocalizedPlan {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  interval: string;
  periodDays: number;
  features: string[];
  capabilities: string[];
  country: string;
  base: LocalizedPrice;
  local: LocalizedPrice;
}

/**
 * Resolves the viewer's currency from request signals and localizes the
 * Premium plan price. Resolution order: explicit currency → explicit country →
 * Cloudflare `cf-ipcountry` header → optional IP lookup → USD default.
 *
 * The platform is fronted by Cloudflare (see CLAUDE.md infra), so the
 * `cf-ipcountry` header is the primary, zero-latency geolocation source.
 */
@Injectable()
export class GeoService implements OnModuleInit {
  private readonly logger = new Logger(GeoService.name);

  onModuleInit(): void {
    applyRateOverrides(process.env.CURRENCY_RATES_JSON);
  }

  resolveCurrency(hints: RequestGeoHints): { currency: CurrencyMeta; country: string } {
    // Explicit user selection wins; then the trusted server-side Cloudflare
    // country; then a client locale hint; finally the USD default.
    if (hints.currency && getCurrency(hints.currency).code === hints.currency.toUpperCase()) {
      const cur = getCurrency(hints.currency);
      return { currency: cur, country: (hints.cfCountry || hints.country || "").toUpperCase() };
    }
    const country = (hints.cfCountry || hints.country || "").toUpperCase();
    const code = currencyForCountry(country);
    return { currency: getCurrency(code), country };
  }

  private priceFrom(amountUsd: number, currency: CurrencyMeta): LocalizedPrice {
    const amount = convertFromUsd(amountUsd, currency);
    return {
      amount,
      currency: currency.code,
      symbol: currency.symbol,
      display: formatMoney(amount, currency),
      estimated: currency.code !== DEFAULT_CURRENCY,
    };
  }

  localizePlan(hints: RequestGeoHints): LocalizedPlan {
    const { currency, country } = this.resolveCurrency(hints);
    const base = getCurrency(DEFAULT_CURRENCY);
    return {
      id: PREMIUM_PLAN.id,
      name: PREMIUM_PLAN.name,
      badge: PREMIUM_PLAN.badge,
      tagline: PREMIUM_PLAN.tagline,
      interval: PREMIUM_PLAN.interval,
      periodDays: PREMIUM_PLAN.periodDays,
      features: [...PREMIUM_PLAN.features],
      capabilities: [...PREMIUM_PLAN.capabilities],
      country: country || "",
      base: this.priceFrom(PREMIUM_PLAN.amountUsd, base),
      local: this.priceFrom(PREMIUM_PLAN.amountUsd, currency),
    };
  }
}
