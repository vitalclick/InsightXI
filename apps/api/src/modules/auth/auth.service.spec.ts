import { Test } from "@nestjs/testing";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { UsersService } from "./users.service";
import { PremiumGuard } from "./premium.guard";
import { UserStore } from "./user.store";
import { InMemoryUserStore } from "./in-memory-user.store";

describe("Auth + subscriptions", () => {
  let auth: AuthService;
  let jwt: JwtService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: "test-secret" })],
      providers: [
        AuthService,
        UsersService,
        { provide: UserStore, useClass: InMemoryUserStore },
      ],
    }).compile();
    await moduleRef.init(); // seeds demo users via UsersService.onModuleInit
    auth = moduleRef.get(AuthService);
    jwt = moduleRef.get(JwtService);
  });

  it("issues a JWT carrying the subscription tier", async () => {
    const { accessToken, user } = await auth.login(
      "premium@insightxi.dev",
      "password",
    );
    expect(user.tier).toBe("PREMIUM");
    const payload = jwt.verify(accessToken);
    expect(payload.tier).toBe("PREMIUM");
  });

  it("rejects bad credentials", async () => {
    await expect(auth.login("free@insightxi.dev", "wrong")).rejects.toThrow();
  });

  it("PremiumGuard blocks free users and allows premium", () => {
    const guard = new PremiumGuard();
    const ctx = (tier: string): ExecutionContext =>
      ({
        switchToHttp: () => ({ getRequest: () => ({ user: { tier } }) }),
      }) as unknown as ExecutionContext;

    expect(guard.canActivate(ctx("PREMIUM"))).toBe(true);
    expect(() => guard.canActivate(ctx("FREE"))).toThrow(ForbiddenException);
  });
});
