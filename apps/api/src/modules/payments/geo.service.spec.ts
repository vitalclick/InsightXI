import { GeoService } from "./geo.service";
import { convertFromUsd, getCurrency, toMinorUnits } from "./currency";
import { PREMIUM_PLAN } from "./pricing";

describe("Currency + geolocation pricing", () => {
  const geo = new GeoService();

  it("anchors the plan at $2.49 USD", () => {
    expect(PREMIUM_PLAN.amountUsd).toBe(2.49);
    expect(PREMIUM_PLAN.periodDays).toBe(30);
  });

  it("converts USD into a local currency major unit", () => {
    const ngn = getCurrency("NGN");
    expect(convertFromUsd(2.49, ngn)).toBeCloseTo(2.49 * ngn.rate, 2);
  });

  it("rounds zero-decimal currencies to whole units", () => {
    const jpy = getCurrency("JPY");
    expect(Number.isInteger(convertFromUsd(2.49, jpy))).toBe(true);
  });

  it("computes smallest-unit amounts for gateways (kobo/cents)", () => {
    const usd = getCurrency("USD");
    expect(toMinorUnits(2.49, usd)).toBe(249);
  });

  it("localizes via the Cloudflare country header", () => {
    const plan = geo.localizePlan({ cfCountry: "NG" });
    expect(plan.local.currency).toBe("NGN");
    expect(plan.local.estimated).toBe(true);
    expect(plan.base.currency).toBe("USD");
    expect(plan.base.display).toBe("$2.49");
  });

  it("honours an explicit currency override and falls back to USD", () => {
    expect(geo.localizePlan({ currency: "EUR" }).local.currency).toBe("EUR");
    expect(geo.localizePlan({ country: "ZZ" }).local.currency).toBe("USD");
  });
});
