import { EmailService } from "./email.service";
import {
  passwordResetEmail,
  paymentReceiptEmail,
  verificationEmail,
} from "./templates";

describe("EmailService", () => {
  const ORIGINAL = { ...process.env };
  afterEach(() => {
    process.env = { ...ORIGINAL };
    jest.restoreAllMocks();
  });

  it("runs in sandbox (no delivery) when RESEND_API_KEY is unset", async () => {
    delete process.env.RESEND_API_KEY;
    const svc = new EmailService();
    expect(svc.isConfigured()).toBe(false);
    const res = await svc.send({
      to: "a@b.com",
      subject: "s",
      html: "<p>h</p>",
      text: "h",
    });
    expect(res).toEqual({ delivered: false, sandbox: true });
  });

  it("posts to Resend when configured", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ ok: true, text: async () => "" } as Response);
    const svc = new EmailService();
    const res = await svc.send({
      to: "a@b.com",
      subject: "s",
      html: "<p>h</p>",
      text: "h",
    });
    expect(res.delivered).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("reports a failure without throwing when Resend errors", async () => {
    process.env.RESEND_API_KEY = "re_test";
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ ok: false, status: 422, text: async () => "bad" } as Response);
    const svc = new EmailService();
    const res = await svc.send({ to: "a@b.com", subject: "s", html: "h", text: "h" });
    expect(res.delivered).toBe(false);
  });
});

describe("email templates", () => {
  it("verification email carries the link in html and text", () => {
    const m = verificationEmail("user@example.com", "https://app/verify?token=abc");
    expect(m.to).toBe("user@example.com");
    expect(m.html).toContain("https://app/verify?token=abc");
    expect(m.text).toContain("https://app/verify?token=abc");
  });

  it("password reset email carries the link", () => {
    const m = passwordResetEmail("user@example.com", "https://app/reset?token=xyz");
    expect(m.text).toContain("https://app/reset?token=xyz");
  });

  it("receipt email includes amount, provider and reference", () => {
    const m = paymentReceiptEmail("user@example.com", {
      amountDisplay: "$2.49 / 30 days",
      provider: "paystack",
      periodEnd: "2026-07-01T00:00:00.000Z",
      reference: "ixi_ref_1",
    });
    expect(m.text).toContain("$2.49 / 30 days");
    expect(m.text).toContain("paystack");
    expect(m.text).toContain("ixi_ref_1");
  });
});
