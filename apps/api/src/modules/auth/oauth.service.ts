import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { createPublicKey, createVerify } from "crypto";

export interface OAuthProfile {
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

interface Jwk extends JsonWebKey {
  kid: string;
}

function decodeSegment<T>(segment: string): T {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as T;
}

/**
 * Verifies Google and Apple identity tokens posted by the SPA. Each provider
 * runs live when its client id is configured; otherwise a sandbox token of the
 * form `mock:<provider>:<email>` is accepted so the social-login flow stays
 * demoable offline (consistent with the platform's other mock fallbacks).
 */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  private appleKeys: { fetchedAt: number; keys: Jwk[] } | null = null;

  private get googleClientIds(): string[] {
    return (process.env.GOOGLE_CLIENT_ID ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private get appleClientIds(): string[] {
    return (process.env.APPLE_CLIENT_ID ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private sandboxProfile(
    provider: "google" | "apple",
    token: string,
    name?: string | null,
  ): OAuthProfile | null {
    const prefix = `mock:${provider}:`;
    if (!token.startsWith(prefix)) return null;
    const email = token.slice(prefix.length).trim().toLowerCase();
    if (!email.includes("@")) {
      throw new UnauthorizedException("Invalid sandbox token");
    }
    this.logger.warn(
      `${provider} OAuth not configured — accepting sandbox token for ${email}`,
    );
    return { email, name: name ?? null, avatarUrl: null };
  }

  async verifyGoogle(idToken: string): Promise<OAuthProfile> {
    const clientIds = this.googleClientIds;
    if (clientIds.length === 0) {
      const mock = this.sandboxProfile("google", idToken);
      if (mock) return mock;
      throw new UnauthorizedException("Google sign-in is not configured");
    }
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );
    if (!res.ok) throw new UnauthorizedException("Invalid Google token");
    const payload = (await res.json()) as {
      aud?: string;
      email?: string;
      email_verified?: string | boolean;
      name?: string;
      picture?: string;
      exp?: string;
    };
    if (!payload.aud || !clientIds.includes(payload.aud)) {
      throw new UnauthorizedException("Google token audience mismatch");
    }
    if (!payload.email || `${payload.email_verified}` !== "true") {
      throw new UnauthorizedException("Google email not verified");
    }
    if (payload.exp && Date.now() / 1000 > Number(payload.exp)) {
      throw new UnauthorizedException("Google token expired");
    }
    return {
      email: payload.email.toLowerCase(),
      name: payload.name ?? null,
      avatarUrl: payload.picture ?? null,
    };
  }

  async verifyApple(idToken: string, name?: string | null): Promise<OAuthProfile> {
    const clientIds = this.appleClientIds;
    if (clientIds.length === 0) {
      const mock = this.sandboxProfile("apple", idToken, name);
      if (mock) return mock;
      throw new UnauthorizedException("Apple sign-in is not configured");
    }
    const [headerB64, payloadB64, sigB64] = idToken.split(".");
    if (!headerB64 || !payloadB64 || !sigB64) {
      throw new UnauthorizedException("Malformed Apple token");
    }
    const header = decodeSegment<{ kid: string; alg: string }>(headerB64);
    const jwk = await this.appleKey(header.kid);
    if (!jwk) throw new UnauthorizedException("Unknown Apple signing key");

    // The DOM and node `JsonWebKey` types differ on an index signature, but the
    // JWK shape Apple returns is valid at runtime — route the cast via unknown.
    const keyInput = { key: jwk, format: "jwk" } as unknown as Parameters<
      typeof createPublicKey
    >[0];
    const publicKey = createPublicKey(keyInput);
    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${headerB64}.${payloadB64}`);
    verifier.end();
    const valid = verifier.verify(publicKey, Buffer.from(sigB64, "base64url"));
    if (!valid) throw new UnauthorizedException("Invalid Apple token signature");

    const payload = decodeSegment<{
      iss?: string;
      aud?: string;
      exp?: number;
      email?: string;
      email_verified?: string | boolean;
    }>(payloadB64);
    if (payload.iss !== "https://appleid.apple.com") {
      throw new UnauthorizedException("Apple token issuer mismatch");
    }
    if (!payload.aud || !clientIds.includes(payload.aud)) {
      throw new UnauthorizedException("Apple token audience mismatch");
    }
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      throw new UnauthorizedException("Apple token expired");
    }
    if (!payload.email) throw new UnauthorizedException("Apple token missing email");
    return {
      email: payload.email.toLowerCase(),
      name: name ?? null,
      avatarUrl: null,
    };
  }

  private async appleKey(kid: string): Promise<Jwk | undefined> {
    const fresh = this.appleKeys && Date.now() - this.appleKeys.fetchedAt < 3_600_000;
    if (!fresh) {
      const res = await fetch("https://appleid.apple.com/auth/keys");
      if (!res.ok) throw new UnauthorizedException("Unable to fetch Apple keys");
      const json = (await res.json()) as { keys: Jwk[] };
      this.appleKeys = { fetchedAt: Date.now(), keys: json.keys };
    }
    return this.appleKeys?.keys.find((k) => k.kid === kid);
  }
}
