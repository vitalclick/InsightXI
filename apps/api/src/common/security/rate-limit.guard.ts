import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from "@nestjs/common";

/**
 * Lightweight, dependency-free fixed-window rate limiter. Keyed by client IP,
 * it caps requests per window to blunt brute-force and basic abuse without a
 * Redis round trip. For multi-instance deployments behind a shared limiter
 * (e.g. Cloudflare / a gateway) this is a defensive second layer.
 *
 * Tunable via env:
 *   RATE_LIMIT_MAX        max requests per window per IP (default 120)
 *   RATE_LIMIT_WINDOW_MS  window length in ms          (default 60000)
 *   RATE_LIMIT_ENABLED    set "false" to disable        (default on)
 */
export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export class FixedWindowRateLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();
  private lastSweep = Date.now();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  check(key: string, now = Date.now()): RateLimitDecision {
    this.maybeSweep(now);
    const entry = this.hits.get(key);
    if (!entry || now >= entry.resetAt) {
      const resetAt = now + this.windowMs;
      this.hits.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: this.max - 1, resetAt };
    }
    entry.count += 1;
    const remaining = Math.max(0, this.max - entry.count);
    return { allowed: entry.count <= this.max, remaining, resetAt: entry.resetAt };
  }

  /** Drop expired buckets occasionally so memory stays bounded. */
  private maybeSweep(now: number): void {
    if (now - this.lastSweep < this.windowMs) return;
    this.lastSweep = now;
    for (const [key, entry] of this.hits) {
      if (now >= entry.resetAt) this.hits.delete(key);
    }
  }
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly enabled = process.env.RATE_LIMIT_ENABLED !== "false";
  private readonly limiter = new FixedWindowRateLimiter(
    Number(process.env.RATE_LIMIT_MAX ?? 120),
    Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  );

  canActivate(context: ExecutionContext): boolean {
    if (!this.enabled) return true;
    // WebSocket / non-HTTP contexts are not rate-limited here.
    if (context.getType() !== "http") return true;

    const req = context.switchToHttp().getRequest();
    const key = clientIp(req);
    const decision = this.limiter.check(key);

    const res = context.switchToHttp().getResponse();
    res?.setHeader?.("X-RateLimit-Remaining", String(decision.remaining));
    res?.setHeader?.(
      "X-RateLimit-Reset",
      String(Math.ceil(decision.resetAt / 1000)),
    );

    if (!decision.allowed) {
      const retryAfter = Math.max(1, Math.ceil((decision.resetAt - Date.now()) / 1000));
      res?.setHeader?.("Retry-After", String(retryAfter));
      this.logger.warn(`Rate limit exceeded for ${key}`);
      throw new HttpException(
        { statusCode: 429, message: "Too many requests" },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}

/** Best-effort client IP, honouring a single proxy hop (Cloudflare/Railway). */
export function clientIp(req: {
  ip?: string;
  ips?: string[];
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}): string {
  const fwd = req.headers?.["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length) return fwd.split(",")[0].trim();
  if (Array.isArray(fwd) && fwd.length) return String(fwd[0]).trim();
  return req.ip ?? req.socket?.remoteAddress ?? "unknown";
}
