"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "../../services/api-client";
import { useAuthStore } from "../../store/auth-store";

export const dynamic = "force-dynamic";

function ResetPasswordInner() {
  const token = useSearchParams().get("token");
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("This reset link is missing its token.");
      return;
    }
    if (password.length < 6) {
      setError("Use a password of at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.resetPassword(token, password);
      setAuth(res.accessToken, res.user, res.refreshToken);
      setDone(true);
      setTimeout(() => router.push("/account"), 1200);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 400
          ? "This reset link is invalid or has already been used."
          : "Could not reset your password. Request a new link and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div className="card" style={{ maxWidth: 420, width: "100%" }}>
        <div className="card-bd">
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 4, textAlign: "center" }}>
            InsightXI
          </div>
          <div className="dim" style={{ fontSize: 12, marginBottom: 20, textAlign: "center" }}>
            Choose a new password
          </div>
          {done ? (
            <p style={{ textAlign: "center" }}>✅ Password updated. Signing you in…</p>
          ) : (
            <form onSubmit={submit} className="flex col gap-12">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                aria-label="New password"
                autoComplete="new-password"
                className="tb-search"
                style={{ width: "100%", margin: 0, height: 42 }}
              />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                aria-label="Confirm new password"
                autoComplete="new-password"
                className="tb-search"
                style={{ width: "100%", margin: 0, height: 42 }}
              />
              {error && <p style={{ fontSize: 13, color: "var(--red)" }}>{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                {loading ? "Please wait…" : "Reset password"}
              </button>
              <Link href="/account" className="dim" style={{ fontSize: 12.5, textAlign: "center" }}>
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
