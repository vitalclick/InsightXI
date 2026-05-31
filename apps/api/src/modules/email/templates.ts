import { EmailMessage } from "./email.service";

const BRAND = "InsightXI";
const TAGLINE = "True Football Intelligence Platform";

/** Minimal, on-brand HTML shell shared by every transactional email. */
function wrap(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#0b0f17;font-family:Inter,Segoe UI,Arial,sans-serif;color:#e6edf6">
  <div style="max-width:480px;margin:0 auto;padding:32px 24px">
    <div style="font-size:20px;font-weight:700;letter-spacing:.5px;color:#fff">${BRAND}</div>
    <div style="font-size:12px;color:#7d8aa0;margin-bottom:24px">${TAGLINE}</div>
    <h1 style="font-size:18px;color:#fff;margin:0 0 12px">${title}</h1>
    ${bodyHtml}
    <p style="font-size:12px;color:#5c6680;margin-top:32px">
      ${BRAND} presents statistical probabilities and football intelligence — not
      betting advice or guaranteed outcomes.
    </p>
  </div></body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${label}</a>`;
}

export function verificationEmail(to: string, link: string): EmailMessage {
  return {
    to,
    subject: `Confirm your ${BRAND} email`,
    html: wrap(
      "Confirm your email",
      `<p style="color:#b6c2d4;font-size:14px;line-height:1.6">Welcome to ${BRAND}. Confirm this address to secure your account.</p>
       <p style="margin:20px 0">${button(link, "Confirm email")}</p>
       <p style="color:#7d8aa0;font-size:12px">Or paste this link into your browser:<br>${link}</p>
       <p style="color:#7d8aa0;font-size:12px">This link expires in 24 hours.</p>`,
    ),
    text: `Welcome to ${BRAND}. Confirm your email: ${link} (expires in 24 hours).`,
  };
}

export function passwordResetEmail(to: string, link: string): EmailMessage {
  return {
    to,
    subject: `Reset your ${BRAND} password`,
    html: wrap(
      "Reset your password",
      `<p style="color:#b6c2d4;font-size:14px;line-height:1.6">We received a request to reset your password. If this wasn't you, you can ignore this email.</p>
       <p style="margin:20px 0">${button(link, "Reset password")}</p>
       <p style="color:#7d8aa0;font-size:12px">Or paste this link into your browser:<br>${link}</p>
       <p style="color:#7d8aa0;font-size:12px">This link expires in 1 hour.</p>`,
    ),
    text: `Reset your ${BRAND} password: ${link} (expires in 1 hour). If this wasn't you, ignore this email.`,
  };
}

export function paymentReceiptEmail(
  to: string,
  opts: { amountDisplay: string; provider: string; periodEnd: string | null; reference: string },
): EmailMessage {
  const until = opts.periodEnd
    ? new Date(opts.periodEnd).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "the end of your billing period";
  return {
    to,
    subject: `Your ${BRAND} Premium receipt`,
    html: wrap(
      "Premium activated",
      `<p style="color:#b6c2d4;font-size:14px;line-height:1.6">Thank you — your ${BRAND} Premium subscription is now active.</p>
       <table style="width:100%;font-size:14px;color:#b6c2d4;margin:16px 0;border-collapse:collapse">
         <tr><td style="padding:6px 0;color:#7d8aa0">Amount</td><td style="text-align:right">${opts.amountDisplay}</td></tr>
         <tr><td style="padding:6px 0;color:#7d8aa0">Method</td><td style="text-align:right;text-transform:capitalize">${opts.provider}</td></tr>
         <tr><td style="padding:6px 0;color:#7d8aa0">Access until</td><td style="text-align:right">${until}</td></tr>
         <tr><td style="padding:6px 0;color:#7d8aa0">Reference</td><td style="text-align:right">${opts.reference}</td></tr>
       </table>
       <p style="color:#7d8aa0;font-size:12px">Premium unlocks deep analytics, tactical reports, historical intelligence and advanced match analysis.</p>`,
    ),
    text:
      `Your ${BRAND} Premium subscription is active. Amount: ${opts.amountDisplay}, ` +
      `method: ${opts.provider}, access until: ${until}, reference: ${opts.reference}.`,
  };
}
