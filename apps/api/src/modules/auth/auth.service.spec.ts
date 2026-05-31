import { Test } from "@nestjs/testing";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { OAuthService } from "./oauth.service";
import { UsersService } from "./users.service";
import { PremiumGuard } from "./premium.guard";
import { UserStore } from "./user.store";
import { InMemoryUserStore } from "./in-memory-user.store";
import { EmailService } from "../email/email.service";

describe("Auth + subscriptions", () => {
  let auth: AuthService;
  let users: UsersService;
  let jwt: JwtService;
  let sent: Array<{ to: string; subject: string; text: string }>;

  beforeEach(async () => {
    sent = [];
    const emailStub: Pick<EmailService, "send" | "isConfigured"> = {
      isConfigured: () => false,
      send: async (m) => {
        sent.push({ to: m.to, subject: m.subject, text: m.text });
        return { delivered: false, sandbox: true };
      },
    };
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: "test-secret" })],
      providers: [
        AuthService,
        OAuthService,
        UsersService,
        { provide: UserStore, useClass: InMemoryUserStore },
        { provide: EmailService, useValue: emailStub },
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

  it("registers an unverified account and sends a verification email", async () => {
    const { user } = await auth.register("newbie@example.com", "secret123");
    expect(user.emailVerified).toBe(false);
    expect(sent.some((m) => m.to === "newbie@example.com")).toBe(true);
  });

  it("verifies email via the issued token", async () => {
    const { user } = await auth.register("verify-me@example.com", "secret123");
    const link = sent.find((m) => m.to === "verify-me@example.com")!.text;
    const token = link.match(/token=([^\s)]+)/)![1];
    const res = await auth.verifyEmail(token);
    expect(res.verified).toBe(true);
    const reloaded = await users.findById(user.id);
    expect(reloaded?.emailVerified).toBe(true);
  });

  it("rejects a verification token used as a reset token", async () => {
    await auth.register("mix@example.com", "secret123");
    const token = sent
      .find((m) => m.to === "mix@example.com")!
      .text.match(/token=([^\s)]+)/)![1];
    await expect(auth.resetPassword(token, "newpass123")).rejects.toThrow();
  });

  it("resets a password via the reset link and the old password stops working", async () => {
    await auth.register("forgot@example.com", "oldpass123");
    sent.length = 0;
    await auth.requestPasswordReset("forgot@example.com");
    const token = sent
      .find((m) => m.to === "forgot@example.com")!
      .text.match(/token=([^\s)]+)/)![1];
    await auth.resetPassword(token, "brandnew123");
    await expect(auth.login("forgot@example.com", "oldpass123")).rejects.toThrow();
    const ok = await auth.login("forgot@example.com", "brandnew123");
    expect(ok.user.email).toBe("forgot@example.com");
    // The reset link is single-use (password version changed).
    await expect(auth.resetPassword(token, "again12345")).rejects.toThrow();
  });

  it("does not reveal whether an email exists on forgot-password", async () => {
    sent.length = 0;
    await expect(
      auth.requestPasswordReset("nobody@example.com"),
    ).resolves.toEqual({ ok: true });
    expect(sent.length).toBe(0);
  });

  it("issues a refresh token that mints a new access token", async () => {
    const result = await auth.login("free@insightxi.dev", "password");
    expect(result.refreshToken).toBeTruthy();
    const refreshed = await auth.refresh(result.refreshToken);
    expect(jwt.verify(refreshed.accessToken)).toHaveProperty("tier", "FREE");
  });

  it("rejects an access token used as a refresh token", async () => {
    const result = await auth.login("free@insightxi.dev", "password");
    await expect(auth.refresh(result.accessToken)).rejects.toThrow();
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
