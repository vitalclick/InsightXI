import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PublicUser, UsersService } from "./users.service";
import { UserRecord } from "./user.store";
import { OAuthService } from "./oauth.service";

export interface JwtPayload {
  sub: string;
  email: string;
  tier: string;
}

export interface AuthResult {
  accessToken: string;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly oauth: OAuthService,
  ) {}

  /** Signs a JWT carrying the user's current subscription tier. */
  async issueToken(user: UserRecord): Promise<AuthResult> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tier: user.tier,
    };
    return {
      accessToken: await this.jwt.signAsync(payload),
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
    return this.login(email, password);
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
