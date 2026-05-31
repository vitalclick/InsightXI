"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "../../services/api-client";
import { useAuthStore } from "../../store/auth-store";

export const dynamic = "force-dynamic";

type State = "verifying" | "done" | "error";

function VerifyEmailInner() {
  const token = useSearchParams().get("token");
  const setUser = useAuthStore((s) => s.setUser);
  const [state, setState] = useState<State>("verifying");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) {
      setState("error");
      return;
    }
    api
      .verifyEmail(token)
      .then((res) => {
        // Reflect the verified flag in the cached profile if we have one.
        const current = useAuthStore.getState().user;
        if (current && current.id === res.user.id) setUser(res.user);
        setState("done");
      })
      .catch(() => setState("error"));
  }, [token, setUser]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div className="card" style={{ maxWidth: 420, width: "100%" }}>
        <div className="card-bd" style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>InsightXI</div>
          <div className="dim" style={{ fontSize: 12, marginBottom: 20 }}>
            Email verification
          </div>
          {state === "verifying" && <p>Confirming your email…</p>}
          {state === "done" && (
            <>
              <p style={{ marginBottom: 16 }}>✅ Your email is verified.</p>
              <Link href="/account" className="btn btn-primary">
                Go to your account
              </Link>
            </>
          )}
          {state === "error" && (
            <>
              <p style={{ marginBottom: 16 }}>
                This verification link is invalid or has expired.
              </p>
              <Link href="/account" className="btn btn-ghost">
                Back to account
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
