import Link from "next/link";
import type { ReactNode } from "react";

export const LEGAL_EFFECTIVE_DATE = "31 May 2026";
export const LEGAL_CONTACT_EMAIL = "support@insightxi.app";
export const LEGAL_ENTITY = "InsightXI (operated by VitalClick)";

/** Shared presentation shell for the public legal pages. */
export function LegalShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px 80px" }}>
      <div className="flex jcb aic wrap gap-16" style={{ marginBottom: 28 }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 18 }}>
          Insight<span style={{ color: "var(--accent, #3b82f6)" }}>XI</span>
        </Link>
        <div className="flex gap-16" style={{ fontSize: 13, color: "var(--muted)" }}>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/responsible">Responsible Gambling</Link>
          <Link href="/dashboard">Platform</Link>
        </div>
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>{title}</h1>
      <p className="dim" style={{ fontSize: 13, marginBottom: 32 }}>
        Effective {LEGAL_EFFECTIVE_DATE} · {LEGAL_ENTITY}
      </p>
      <article className="legal-body" style={{ fontSize: 15, lineHeight: 1.7 }}>
        {children}
      </article>
    </main>
  );
}

/** A titled section with consistent spacing. */
export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 10px" }}>{heading}</h2>
      <div style={{ color: "var(--muted, #b6c2d4)" }}>{children}</div>
    </section>
  );
}
