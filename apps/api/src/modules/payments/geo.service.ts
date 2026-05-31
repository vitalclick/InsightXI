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
 * Resolves the viewer's currency and localizes the Premium plan price.
 *
 * Country resolution order:
 *   explicit currency → explicit country → Cloudflare `cf-ipcountry`
 *   → IP geolocation (GEO_IP_LOOKUP_URL, when set) → USD default.
 *
 * Behind Cloudflare (see CLAUDE.md infra) the `cf-ipcountry` header is the
 * primary, zero-latency source and no external call is made. For deployments
 * not fronted by Cloudflare, set GEO_IP_LOOKUP_URL to a lookup endpoint
 * containing `{ip}` (e.g. https://ipapi.co/{ip}/country/ or
 * http://ip-api.com/json/{ip}?fields=countryCode).
 */
@Injectable()
export class GeoService implements OnModuleInit {
  private readonly logger = new Logger(GeoService.name);
  private readonly ipCache = new Map<string, { country: string; at: number }>();

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

  /**
   * Localizes the plan, falling back to an IP geolocation lookup when no other
   * country signal is present (and GEO_IP_LOOKUP_URL is configured).
   */
  async resolvePlan(hints: RequestGeoHints, ip?: string): Promise<LocalizedPlan> {
    const hasSignal = Boolean(hints.currency || hints.cfCountry || hints.country);
    if (!hasSignal) {
      const country = await this.lookupCountryByIp(ip);
      if (country) return this.localizePlan({ ...hints, country });
    }
    return this.localizePlan(hints);
  }

  private isPublicIp(ip: string): boolean {
    if (!ip || ip === "::1" || ip === "127.0.0.1") return false;
    if (/^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\.|^169\.254\./.test(ip)) return false;
    if (/^(::ffff:)?(10|127)\./.test(ip)) return false;
    return true;
  }

  /** Looks up a country code for an IP via GEO_IP_LOOKUP_URL (cached, timed out). */
  private async lookupCountryByIp(ip?: string): Promise<string | null> {
    const url = process.env.GEO_IP_LOOKUP_URL;
    if (!url || !ip || !this.isPublicIp(ip)) return null;

    const cached = this.ipCache.get(ip);
    if (cached && Date.now() - cached.at < 6 * 3_600_000) return cached.country || null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
      const res = await fetch(url.replace("{ip}", encodeURIComponent(ip)), {
        signal: controller.signal,
      });
      const text = (await res.text()).trim();
      let country = "";
      try {
        const json = JSON.parse(text) as Record<string, unknown>;
        const c = json.country_code ?? json.countryCode ?? json.country;
        if (typeof c === "string") country = c;
      } catch {
        country = text; // plain-text endpoints return the bare code
      }
      country = country.toUpperCase().slice(0, 2);
      if (!/^[A-Z]{2}$/.test(country)) country = "";
      this.ipCache.set(ip, { country, at: Date.now() });
      return country || null;
    } catch {
      this.logger.warn(`IP geolocation lookup failed for ${ip}`);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
