import { Test } from "@nestjs/testing";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { OAuthService } from "./oauth.service";
import { UsersService } from "./users.service";
import { PremiumGuard } from "./premium.guard";
import { UserStore } from "./user.store";
import { InMemoryUserStore } from "./in-memory-user.store";

describe("Auth + subscriptions", () => {
  let auth: AuthService;
  let users: UsersService;
  let jwt: JwtService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: "test-secret" })],
      providers: [
        AuthService,
        OAuthService,
        UsersService,
        { provide: UserStore, useClass: InMemoryUserStore },
      ],
    }).compile();
    await moduleRef.init(); // seeds demo users via UsersService.onModuleInit
    auth = moduleRef.get(AuthService);
    users = moduleRef.get(UsersService);
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

  it("signs in via Google sandbox token and provisions a FREE account", async () => {
    const { accessToken, user } = await auth.loginWithGoogle(
      "mock:google:fan@example.com",
    );
    expect(user.email).toBe("fan@example.com");
    expect(user.provider).toBe("google");
    expect(user.tier).toBe("FREE");
    expect(jwt.verify(accessToken)).toHaveProperty("sub", user.id);
  });

  it("activates premium for the plan period after payment", async () => {
    const { user } = await auth.loginWithGoogle("mock:google:buyer@example.com");
    const updated = await users.activatePremium(user.id, {
      provider: "paystack",
      reference: "ixi_test_ref",
      periodDays: 30,
    });
    expect(updated?.tier).toBe("PREMIUM");
    expect(updated?.subscriptionStatus).toBe("active");
    expect(updated?.subscriptionProvider).toBe("paystack");
    expect(Date.parse(updated!.currentPeriodEnd!)).toBeGreaterThan(Date.now());
  });
});
