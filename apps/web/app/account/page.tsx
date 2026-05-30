"use client";

import { useState } from "react";
import { api } from "../../services/api-client";
import { useAuthStore } from "../../store/auth-store";

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
      <main className="flex max-w-md flex-col gap-4">
        <h1 className="text-2xl font-bold">Account</h1>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-white/60">Signed in as</p>
          <p className="font-medium">{user.email}</p>
          <span
            className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
              user.tier === "PREMIUM"
                ? "bg-signal/20 text-signal"
                : "bg-white/10 text-white/60"
            }`}
          >
            {user.tier}
          </span>
        </div>
        <button
          onClick={logout}
          className="self-start rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
        >
          Sign out
        </button>
      </main>
    );
  }

  return (
    <main className="flex max-w-md flex-col gap-5">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <p className="text-sm text-white/50">
        Demo accounts: <code>premium@insightxi.dev</code> or{" "}
        <code>free@insightxi.dev</code> — password <code>password</code>.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-insight"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-insight"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-insight px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
