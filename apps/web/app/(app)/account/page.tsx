"use client";

import { useState } from "react";
import { api } from "../../../services/api-client";
import { useAuthStore } from "../../../store/auth-store";
import { PageHead } from "../../../components/ui/page-head";

export default function AccountPage() {
  const { user, token, setAuth, logout } = useAuthStore();
  const [email, setEmail] = useState("premium@insightxi.dev");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(email, password);
      setAuth(res.accessToken, res.user);
    } catch {
      setError("Login failed — check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  if (user && token) {
    return (
      <>
        <PageHead eyebrow="Account" title="Your account" sub="Subscription tier and session." />
        <section className="card reveal" style={{ maxWidth: 460 }}>
          <div className="card-bd">
            <div className="flex aic gap-14" style={{ marginBottom: 18 }}>
              <div className="tb-avatar" style={{ width: 52, height: 52, fontSize: 18 }}>{user.email.slice(0, 2).toUpperCase()}</div>
              <div>
                <div className="dim" style={{ fontSize: 12 }}>Signed in as</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{user.email}</div>
                <span className={`badge ${user.tier === "PREMIUM" ? "gold" : ""}`} style={{ marginTop: 6 }}>
                  {user.tier}
                </span>
              </div>
            </div>
            <button onClick={logout} className="btn btn-ghost">Sign out</button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHead eyebrow="Account" title="Sign in" sub="Access premium analytics and personalised intelligence." />
      <section className="card reveal" style={{ maxWidth: 460 }}>
        <div className="card-bd">
          <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
            Demo accounts: <code>premium@insightxi.dev</code> or <code>free@insightxi.dev</code> — password <code>password</code>.
          </p>
          <form onSubmit={submit} className="flex col gap-12">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              aria-label="Email"
              className="tb-search"
              style={{ width: "100%", margin: 0, height: 42 }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              aria-label="Password"
              className="tb-search"
              style={{ width: "100%", margin: 0, height: 42 }}
            />
            {error && <p style={{ fontSize: 13, color: "var(--red)" }}>{error}</p>}
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ opacity: loading ? 0.6 : 1 }}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
