import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHash } from "crypto";
import { PublicUser, UsersService } from "./users.service";
import { UserRecord } from "./user.store";
import { OAuthService } from "./oauth.service";
import { EmailService } from "../email/email.service";
import { passwordResetEmail, verificationEmail } from "../email/templates";
import { NotificationsService } from "../notifications/notifications.service";

export interface JwtPayload {
  sub: string;
  email: string;
  tier: string;
}

type TokenPurpose = "verify" | "reset" | "refresh";

export interface AuthResult {
  accessToken: string;
  /** Long-lived token to mint fresh access tokens without re-login. */
  refreshToken: string;
  user: PublicUser;
}

/** Derives a short fingerprint of the current password so a reset link becomes
 * single-use: once the password changes, outstanding reset tokens are invalid. */
function passwordVersion(user: UserRecord): string {
  return createHash("sha256")
    .update(user.passwordHash ?? "none")
    .digest("hex")
    .slice(0, 16);
}

function webBase(): string {
  return (
    process.env.WEB_APP_URL ??
    process.env.PAYMENTS_CALLBACK_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly oauth: OAuthService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Signs an access JWT (carrying tier) plus a refresh token. */
  async issueToken(user: UserRecord): Promise<AuthResult> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tier: user.tier,
    };
    const refreshTtl = process.env.JWT_REFRESH_EXPIRES_IN ?? "30d";
    return {
      accessToken: await this.jwt.signAsync(payload),
      refreshToken: await this.jwt.signAsync(
        { sub: user.id, purpose: "refresh" as TokenPurpose },
        { expiresIn: refreshTtl },
      ),
      user: this.users.toPublic(user),
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.users.validate(email, password);
    if (!user) throw new UnauthorizedException("Invalid credentials");
    return this.issueToken(user);
  }

  async register(email: string, password: string): Promise<AuthResult> {
    await this.users.create(email, password, "FREE");
    const result = await this.login(email, password);
    // Send the verification email. EmailService swallows delivery errors
    // (returns delivered:false) so this never fails the signup.
    const user = await this.users.findById(result.user.id);
    if (user) await this.sendVerification(user);
    await this.notifications.notify(result.user.id, {
      type: "welcome",
      title: "Welcome to InsightXI",
      body: "Explore explainable match intelligence, tactical reads and probability insights.",
      link: "/dashboard",
    });
    return result;
  }

  /** Mint a fresh access+refresh pair from a valid refresh token. */
  async refresh(refreshToken: string): Promise<AuthResult> {
    const payload = await this.verifyPurpose(refreshToken, "refresh");
    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException("Unknown user");
    return this.issueToken(user);
  }

  // ── Email verification ────────────────────────────────────────────────
  private async sendVerification(user: UserRecord): Promise<void> {
    const token = await this.jwt.signAsync(
      { sub: user.id, purpose: "verify" as TokenPurpose },
      { expiresIn: "1d" },
    );
    const link = `${webBase()}/verify-email?token=${token}`;
    await this.email.send(verificationEmail(user.email, link));
  }

  /** Re-send a verification email for an already-authenticated account. */
  async resendVerification(userId: string): Promise<{ sent: boolean; alreadyVerified: boolean }> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException("Unknown user");
    if (user.emailVerified) return { sent: false, alreadyVerified: true };
    await this.sendVerification(user);
    return { sent: true, alreadyVerified: false };
  }

  async verifyEmail(token: string): Promise<{ verified: boolean; user: PublicUser }> {
    const payload = await this.verifyPurpose(token, "verify");
    const user = await this.users.markEmailVerified(payload.sub);
    if (!user) throw new BadRequestException("Unknown user");
    return { verified: true, user: this.users.toPublic(user) };
  }

  // ── Password reset ────────────────────────────────────────────────────
  /** Always resolves the same way (no account enumeration). */
  async requestPasswordReset(email: string): Promise<{ ok: true }> {
    const user = await this.users.findByEmail(email);
    if (user && user.passwordHash) {
      const token = await this.jwt.signAsync(
        { sub: user.id, purpose: "reset" as TokenPurpose, pv: passwordVersion(user) },
        { expiresIn: "1h" },
      );
      const link = `${webBase()}/reset-password?token=${token}`;
      await this.email.send(passwordResetEmail(user.email, link));
    } else {
      this.logger.log(`Password reset requested for unknown/OAuth email: ${email}`);
    }
    return { ok: true };
  }

  async resetPassword(token: string, newPassword: string): Promise<AuthResult> {
    const payload = await this.verifyPurpose(token, "reset");
    const user = await this.users.findById(payload.sub);
    if (!user) throw new BadRequestException("Invalid or expired reset link");
    // Reject a token issued for a previous password (single-use binding).
    if (payload.pv !== passwordVersion(user)) {
      throw new BadRequestException("This reset link has already been used");
    }
    const updated = await this.users.setPassword(user.id, newPassword);
    if (!updated) throw new BadRequestException("Unable to reset password");
    return this.issueToken(updated);
  }

  /** Verify a JWT and assert it was minted for the expected purpose. */
  private async verifyPurpose(
    token: string,
    purpose: TokenPurpose,
  ): Promise<{ sub: string; purpose: TokenPurpose; pv?: string }> {
    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        purpose?: TokenPurpose;
        pv?: string;
      }>(token);
      if (payload.purpose !== purpose) {
        throw new BadRequestException("Invalid token");
      }
      return { sub: payload.sub, purpose, pv: payload.pv };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException("Invalid or expired token");
    }
  }

  async loginWithGoogle(idToken: string): Promise<AuthResult> {
    const profile = await this.oauth.verifyGoogle(idToken);
    const user = await this.users.findOrCreateOAuth({ ...profile, provider: "google" });
    return this.issueToken(user);
  }

  async loginWithApple(idToken: string, name?: string | null): Promise<AuthResult> {
    const profile = await this.oauth.verifyApple(idToken, name);
    const user = await this.users.findOrCreateOAuth({ ...profile, provider: "apple" });
    return this.issueToken(user);
  }
}
