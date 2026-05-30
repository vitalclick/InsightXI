import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PublicUser, UsersService } from "./users.service";

export interface JwtPayload {
  sub: string;
  email: string;
  tier: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    const user = await this.users.validate(email, password);
    if (!user) throw new UnauthorizedException("Invalid credentials");
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

  async register(email: string, password: string): Promise<PublicUser> {
    return this.users.create(email, password, "FREE");
  }
}
