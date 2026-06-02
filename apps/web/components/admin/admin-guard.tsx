"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/auth-store";

/**
 * Client gate for the admin console. The API enforces the ADMIN role on every
 * request (JwtAuthGuard + AdminGuard); this just keeps non-admins out of the UI
 * and avoids a flash of admin chrome before the persisted store hydrates.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (!user) {
    return (
      <Denied
        title="Sign in required"
        body="The admin console is restricted to InsightXI administrators."
        cta={{ href: "/account", label: "Go to sign in" }}
      />
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <Denied
        title="Administrator access required"
        body="Your account doesn't have permission to view the admin console."
        cta={{ href: "/dashboard", label: "Back to dashboard" }}
      />
    );
  }

  return <>{children}</>;
}

function Denied({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="adm-empty">
      <div>
        <h2>{title}</h2>
        <p className="muted" style={{ marginTop: 8, maxWidth: 380 }}>
          {body}
        </p>
      </div>
      <Link href={cta.href} className="btn btn-primary">
        {cta.label}
      </Link>
    </div>
  );
}
