import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { OAuthService } from "./oauth.service";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { PremiumGuard } from "./premium.guard";
import { UserStore } from "./user.store";
import { InMemoryUserStore } from "./in-memory-user.store";
import { PostgresUserStore } from "./postgres-user.store";

const usePostgres = process.env.DATA_BACKEND === "postgres";

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev-secret-change-me",
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OAuthService,
    UsersService,
    JwtAuthGuard,
    PremiumGuard,
    {
      provide: UserStore,
      useClass: usePostgres ? PostgresUserStore : InMemoryUserStore,
    },
  ],
  exports: [AuthService, UsersService, JwtAuthGuard, PremiumGuard, JwtModule],
})
export class AuthModule {}
