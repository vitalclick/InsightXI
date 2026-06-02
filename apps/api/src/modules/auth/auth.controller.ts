import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthService, JwtPayload } from "./auth.service";
import {
  AppleAuthDto,
  CredentialsDto,
  ForgotPasswordDto,
  GoogleAuthDto,
  RefreshDto,
  ResetPasswordDto,
  TokenDto,
} from "./dto";
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

  @Post("refresh")
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  /** Sign out everywhere — revokes the user's refresh tokens. */
  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @HttpCode(200)
  logout(@CurrentUser() user: JwtPayload) {
    return this.auth.logout(user.sub);
  }

  @Post("verify-email")
  @HttpCode(200)
  verifyEmail(@Body() dto: TokenDto) {
    return this.auth.verifyEmail(dto.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post("resend-verification")
  @HttpCode(200)
  resendVerification(@CurrentUser() user: JwtPayload) {
    return this.auth.resendVerification(user.sub);
  }

  @Post("forgot-password")
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.requestPasswordReset(dto.email);
  }

  @Post("reset-password")
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@CurrentUser() user: JwtPayload) {
    const found = await this.users.findById(user.sub);
    return found ? this.users.toPublic(found) : user;
  }

  /** Download all personal data we hold (GDPR/POPIA portability). */
  @UseGuards(JwtAuthGuard)
  @Get("account/export")
  exportAccount(@CurrentUser() user: JwtPayload) {
    return this.auth.exportAccount(user.sub);
  }

  /** Permanently delete the authenticated account and its data. */
  @UseGuards(JwtAuthGuard)
  @Delete("account")
  @HttpCode(200)
  deleteAccount(@CurrentUser() user: JwtPayload) {
    return this.auth.deleteAccount(user.sub);
  }
}
