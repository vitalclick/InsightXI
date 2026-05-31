import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthService, JwtPayload } from "./auth.service";
import { AppleAuthDto, CredentialsDto, GoogleAuthDto } from "./dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "./current-user.decorator";
import { UsersService } from "./users.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Post("login")
  login(@Body() dto: CredentialsDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post("register")
  register(@Body() dto: CredentialsDto) {
    return this.auth.register(dto.email, dto.password);
  }

  @Post("oauth/google")
  google(@Body() dto: GoogleAuthDto) {
    return this.auth.loginWithGoogle(dto.idToken);
  }

  @Post("oauth/apple")
  apple(@Body() dto: AppleAuthDto) {
    return this.auth.loginWithApple(dto.idToken, dto.name);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@CurrentUser() user: JwtPayload) {
    const found = await this.users.findById(user.sub);
    return found ? this.users.toPublic(found) : user;
  }
}
