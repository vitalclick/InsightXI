import { Logger } from "@nestjs/common";
import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";

/**
 * Security primitives shared by the bootstrap path. Everything here is driven
 * by environment variables and degrades to safe local defaults, matching the
 * platform's "sandbox by default, production when configured" philosophy.
 */

const isProduction = (): boolean => process.env.NODE_ENV === "production";

/** Default JWT secret values that must never reach production. */
const INSECURE_JWT_SECRETS = new Set([
  "",
  "change-me-in-production",
  "dev-secret-change-me",
]);

/**
 * Fail fast on insecure configuration in production. A platform that takes
 * payments must never boot with a default signing secret or a wildcard origin.
 * In development these are warnings so the offline demo keeps working.
 */
export function assertProductionConfig(logger = new Logger("Security")): void {
  // Fatal problems make the service genuinely unsafe to serve (e.g. forgeable
  // auth tokens) — these hard-stop in production. Warnings are sub-optimal but
  // fail *closed*, so they must never prevent boot: a crash here means the
  // platform healthcheck can never pass and the whole deploy is marked failed.
  const fatal: string[] = [];
  const warnings: string[] = [];

  if (INSECURE_JWT_SECRETS.has(process.env.JWT_SECRET ?? "")) {
    fatal.push(
      "JWT_SECRET is unset or still the default — set a strong, unique secret.",
    );
  }

  // An empty allow-list is the safe default: buildCorsOptions() then rejects
  // every cross-origin request (it does NOT reflect arbitrary origins). That is
  // fail-closed, so a missing list is a warning — never a reason to refuse to
  // boot. (Previously this hard-stopped, which silently failed deploys whose
  // Railway service hadn't set CORS_ORIGINS/WEB_APP_URL.)
  if (!resolveAllowedOrigins().length) {
    warnings.push(
      "No CORS_ORIGINS / WEB_APP_URL configured — cross-origin browser requests " +
        "will be blocked. Set the web origin(s) to let the frontend through.",
    );
  }

  if (isProduction()) {
    for (const w of warnings) logger.warn(`Insecure config: ${w}`);
    if (fatal.length) {
      // Hard stop — refuse to serve with an unsafe security posture.
      throw new Error(
        `Refusing to start with insecure configuration:\n - ${fatal.join("\n - ")}`,
      );
    }
    return;
  }

  // Development: everything is a warning so the offline demo keeps working.
  for (const p of [...fatal, ...warnings]) {
    logger.warn(`Insecure config (dev only): ${p}`);
  }
}

/**
 * Parse the configured web origins. Accepts a comma-separated CORS_ORIGINS and
 * falls back to WEB_APP_URL / PAYMENTS_CALLBACK_URL so a single web origin need
 * only be declared once.
 */
export function resolveAllowedOrigins(): string[] {
  const raw =
    process.env.CORS_ORIGINS ??
    process.env.WEB_APP_URL ??
    process.env.PAYMENTS_CALLBACK_URL ??
    "";
  return raw
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

/**
 * Build CORS options. In production the origin is restricted to the configured
 * allow-list (a request from any other origin gets no CORS headers). With no
 * configuration in development we reflect any origin so the local stack and
 * Playwright work out of the box.
 */
export function buildCorsOptions(): CorsOptions {
  const allowed = resolveAllowedOrigins();
  const credentials = true;

  if (!allowed.length && !isProduction()) {
    // Local/dev convenience: reflect the request origin.
    return { origin: true, credentials };
  }

  const allowedSet = new Set(allowed);
  return {
    credentials,
    origin: (
      origin: string | undefined,
      cb: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Same-origin / server-to-server requests have no Origin header.
      if (!origin) return cb(null, true);
      cb(null, allowedSet.has(origin.replace(/\/$/, "")));
    },
  };
}

/**
 * Security response headers (a focused, dependency-free equivalent of helmet's
 * defaults tuned for a JSON API). HSTS is only emitted in production since the
 * local dev server is plain HTTP.
 */
export function applySecurityHeaders(
  _req: unknown,
  res: { setHeader(name: string, value: string): void },
  next: () => void,
): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("Referrer-Policy", "no-referrer");
  // API responses are JSON only — lock the document policy down hard so a
  // response can never be interpreted as an active web page.
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  if (isProduction()) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=15552000; includeSubDomains",
    );
  }
  next();
}
