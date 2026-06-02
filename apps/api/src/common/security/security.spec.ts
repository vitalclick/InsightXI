import {
  applySecurityHeaders,
  assertProductionConfig,
  buildCorsOptions,
  resolveAllowedOrigins,
} from "./security";
import { FixedWindowRateLimiter, clientIp } from "./rate-limit.guard";

describe("security config", () => {
  const ORIGINAL = { ...process.env };
  afterEach(() => {
    process.env = { ...ORIGINAL };
  });

  describe("resolveAllowedOrigins", () => {
    it("parses a comma list and strips trailing slashes", () => {
      process.env.CORS_ORIGINS = "https://app.insightxi.com/, https://admin.insightxi.com";
      expect(resolveAllowedOrigins()).toEqual([
        "https://app.insightxi.com",
        "https://admin.insightxi.com",
      ]);
    });

    it("falls back to WEB_APP_URL", () => {
      delete process.env.CORS_ORIGINS;
      process.env.WEB_APP_URL = "https://web.insightxi.com";
      expect(resolveAllowedOrigins()).toEqual(["https://web.insightxi.com"]);
    });
  });

  describe("buildCorsOptions", () => {
    it("reflects any origin in dev when nothing is configured", () => {
      delete process.env.CORS_ORIGINS;
      delete process.env.WEB_APP_URL;
      delete process.env.PAYMENTS_CALLBACK_URL;
      process.env.NODE_ENV = "test";
      expect(buildCorsOptions()).toEqual({ origin: true, credentials: true });
    });

    it("only allows configured origins when set", (done) => {
      process.env.CORS_ORIGINS = "https://app.insightxi.com";
      const opts = buildCorsOptions();
      const origin = opts.origin as (
        o: string | undefined,
        cb: (e: Error | null, allow?: boolean) => void,
      ) => void;
      origin("https://evil.example.com", (_e, allow) => {
        expect(allow).toBe(false);
        origin("https://app.insightxi.com", (_e2, allow2) => {
          expect(allow2).toBe(true);
          done();
        });
      });
    });
  });

  describe("assertProductionConfig", () => {
    it("throws in production with a default JWT secret", () => {
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "change-me-in-production";
      process.env.CORS_ORIGINS = "https://app.insightxi.com";
      expect(() => assertProductionConfig()).toThrow(/JWT_SECRET/);
    });

    it("does NOT throw in production without configured origins (fail-closed)", () => {
      // An empty allow-list makes buildCorsOptions() reject every cross-origin
      // request rather than reflect it, so a missing origin is a safe default:
      // it must warn, not hard-stop, or the platform healthcheck never passes.
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "a-strong-unique-secret";
      delete process.env.CORS_ORIGINS;
      delete process.env.WEB_APP_URL;
      delete process.env.PAYMENTS_CALLBACK_URL;
      expect(() => assertProductionConfig()).not.toThrow();
    });

    it("does not throw in production when configured", () => {
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "a-strong-unique-secret";
      process.env.CORS_ORIGINS = "https://app.insightxi.com";
      expect(() => assertProductionConfig()).not.toThrow();
    });

    it("only warns in development", () => {
      process.env.NODE_ENV = "development";
      process.env.JWT_SECRET = "";
      const warn = jest.fn();
      expect(() =>
        assertProductionConfig({ warn } as never),
      ).not.toThrow();
      expect(warn).toHaveBeenCalled();
    });
  });

  describe("applySecurityHeaders", () => {
    it("sets hardened headers and calls next", () => {
      const headers: Record<string, string> = {};
      const next = jest.fn();
      applySecurityHeaders(
        {},
        { setHeader: (k: string, v: string) => (headers[k] = v) },
        next,
      );
      expect(headers["X-Content-Type-Options"]).toBe("nosniff");
      expect(headers["X-Frame-Options"]).toBe("DENY");
      expect(headers["Content-Security-Policy"]).toContain("default-src 'none'");
      expect(next).toHaveBeenCalled();
    });
  });
});

describe("FixedWindowRateLimiter", () => {
  it("allows up to max then blocks within the window", () => {
    const rl = new FixedWindowRateLimiter(3, 1000);
    const t0 = 1_000_000;
    expect(rl.check("ip", t0).allowed).toBe(true);
    expect(rl.check("ip", t0 + 1).allowed).toBe(true);
    expect(rl.check("ip", t0 + 2).allowed).toBe(true);
    expect(rl.check("ip", t0 + 3).allowed).toBe(false);
  });

  it("resets after the window elapses", () => {
    const rl = new FixedWindowRateLimiter(1, 1000);
    const t0 = 2_000_000;
    expect(rl.check("ip", t0).allowed).toBe(true);
    expect(rl.check("ip", t0 + 500).allowed).toBe(false);
    expect(rl.check("ip", t0 + 1001).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const rl = new FixedWindowRateLimiter(1, 1000);
    const t0 = 3_000_000;
    expect(rl.check("a", t0).allowed).toBe(true);
    expect(rl.check("b", t0).allowed).toBe(true);
    expect(rl.check("a", t0).allowed).toBe(false);
  });
});

describe("clientIp", () => {
  it("prefers the first x-forwarded-for hop", () => {
    expect(
      clientIp({ headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" } }),
    ).toBe("203.0.113.7");
  });

  it("falls back to req.ip then socket", () => {
    expect(clientIp({ ip: "198.51.100.2" })).toBe("198.51.100.2");
    expect(clientIp({ socket: { remoteAddress: "192.0.2.5" } })).toBe(
      "192.0.2.5",
    );
  });
});
