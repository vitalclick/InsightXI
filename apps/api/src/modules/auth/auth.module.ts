import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { PremiumGuard } from "./premium.guard";

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev-secret-change-me",
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersService, JwtAuthGuard, PremiumGuard],
  exports: [AuthService, UsersService, JwtAuthGuard, PremiumGuard, JwtModule],
})
export class AuthModule {}
