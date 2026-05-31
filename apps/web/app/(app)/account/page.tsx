"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../services/api-client";
import { useAuthStore } from "../../../store/auth-store";
import { PageHead } from "../../../components/ui/page-head";
import { SocialAuth } from "../../../components/auth/social-auth";
import type { AuthResponse } from "../../../lib/types";

type Mode = "signin" | "signup";

export default function AccountPage() {
  const { user, token, setAuth, logout } = useAuthStore();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);

  function applyAuth(res: AuthResponse) {
    setAuth(res.accessToken, res.user, res.refreshToken);
  }

  async function forgotPassword() {
    setError(null);
    setNotice(null);
    if (!email) {
      setError("Enter your email above, then tap Forgot password.");
      return;
    }
    try {
      await api.forgotPassword(email);
      setNotice("If that email has an account, a reset link is on its way.");
    } catch {
      setNotice("If that email has an account, a reset link is on its way.");
    }
  }

  async function resendVerification() {
    if (!token) return;
    setNotice(null);
    try {
      const res = await api.resendVerification(token);
      setNotice(
        res.alreadyVerified
          ? "Your email is already verified."
          : "Verification email sent — check your inbox.",
      );
    } catch {
      setNotice("Could not send the verification email. Try again shortly.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res =
        mode === "signin"
          ? await api.login(email, password)
          : await api.register(email, password);
      applyAuth(res);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("That email is already registered — try signing in.");
      } else if (mode === "signup") {
        setError("Could not create the account. Use a valid email and a 6+ char password.");
      } else {
        setError("Login failed — check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (user && token) {
    const initials = (user.name ?? user.email).slice(0, 2).toUpperCase();
    return (
      <>
        <PageHead eyebrow="Account" title="Your account" sub="Profile, subscription tier and session." />
        <section className="card reveal" style={{ maxWidth: 460, margin: "0 auto" }}>
          <div className="card-bd">
            <div className="flex aic gap-14" style={{ marginBottom: 18 }}>
              <div className="tb-avatar" style={{ width: 52, height: 52, fontSize: 18 }}>{initials}</div>
              <div>
                {user.name && <div style={{ fontWeight: 700, fontSize: 15 }}>{user.name}</div>}
                <div className="dim" style={{ fontSize: 12 }}>Signed in as</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{user.email}</div>
                <div className="flex aic gap-8" style={{ marginTop: 6 }}>
                  <span className={`badge ${user.tier === "PREMIUM" ? "gold" : ""}`}>{user.tier}</span>
                  <span className="dim" style={{ fontSize: 11 }}>via {user.provider}</span>
                  {user.emailVerified ? (
                    <span className="dim" style={{ fontSize: 11 }}>· email verified</span>
                  ) : (
                    <span style={{ fontSize: 11, color: "var(--gold, #e6b400)" }}>· email unverified</span>
                  )}
                </div>
              </div>
            </div>
            {!user.emailVerified && (
              <div
                className="dim"
                style={{ fontSize: 12.5, marginBottom: 14, lineHeight: 1.5 }}
              >
                Confirm your email to secure your account.{" "}
                <button
                  onClick={resendVerification}
                  className="btn btn-ghost"
                  style={{ padding: "2px 8px", fontSize: 12 }}
                >
                  Resend verification
                </button>
              </div>
            )}
            {notice && (
              <p style={{ fontSize: 12.5, color: "var(--accent, #3b82f6)", marginBottom: 12 }}>{notice}</p>
            )}
            {user.tier === "PREMIUM" ? (
              <div className="dim" style={{ fontSize: 12.5, marginBottom: 14 }}>
                {user.currentPeriodEnd
                  ? `Premium access through ${new Date(user.currentPeriodEnd).toLocaleDateString()}.`
                  : "Premium access active."}
              </div>
            ) : (
              <Link href="/premium" className="btn btn-gold" style={{ marginBottom: 14, display: "inline-flex" }}>
                Upgrade to Premium — $2.49/mo
              </Link>
            )}
            <div>
              <button onClick={logout} className="btn btn-ghost">Sign out</button>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHead
        eyebrow="Account"
        title={mode === "signin" ? "Sign in" : "Create your account"}
        sub="Access premium analytics and personalised football intelligence."
      />
      <section className="card reveal" style={{ maxWidth: 460, margin: "0 auto" }}>
        <div className="card-bd">
          <div className="seg" style={{ marginBottom: 18 }}>
            <button
              className={`seg-btn ${mode === "signin" ? "active" : ""}`}
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
            >
              Sign in
            </button>
            <button
              className={`seg-btn ${mode === "signup" ? "active" : ""}`}
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
            >
              Create account
            </button>
          </div>

          <SocialAuth onSuccess={applyAuth} demoEmail={email || undefined} />

          <div className="flex aic gap-12" style={{ margin: "18px 0" }}>
            <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
            <span className="dim" style={{ fontSize: 11 }}>or with email</span>
            <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
          </div>

          <form onSubmit={submit} className="flex col gap-12">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              aria-label="Email"
              autoComplete="email"
              className="tb-search"
              style={{ width: "100%", margin: 0, height: 42 }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              aria-label="Password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="tb-search"
              style={{ width: "100%", margin: 0, height: 42 }}
            />
            {error && <p style={{ fontSize: 13, color: "var(--red)" }}>{error}</p>}
            {notice && <p style={{ fontSize: 13, color: "var(--accent, #3b82f6)" }}>{notice}</p>}
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ opacity: loading ? 0.6 : 1 }}>
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
            {mode === "signin" && (
              <button
                type="button"
                onClick={forgotPassword}
                className="btn btn-ghost"
                style={{ fontSize: 12.5, alignSelf: "flex-start", padding: "4px 0", background: "none" }}
              >
                Forgot password?
              </button>
            )}
          </form>

          <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>
            Demo accounts: <code>premium@insightxi.dev</code> or <code>free@insightxi.dev</code> — password <code>password</code>.
          </p>
        </div>
      </section>
    </>
  );
}
