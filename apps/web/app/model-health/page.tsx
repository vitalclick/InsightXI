"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "../../services/api-client";
import { useAuthStore } from "../../store/auth-store";
import type { ModelMetrics } from "../../lib/types";

/** A metric with a "lower is better" or "higher is better" quality hint. */
function MetricCard({
  label,
  value,
  hint,
  good,
}: {
  label: string;
  value: string;
  hint: string;
  good?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-white/50">
          {label}
        </span>
        {good !== undefined && (
          <span
            className={`h-2 w-2 rounded-full ${good ? "bg-signal" : "bg-amber-400"}`}
          />
        )}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-white/40">{hint}</div>
    </div>
  );
}

function Report({ m }: { m: ModelMetrics }) {
  const fmt = (n?: number) => (n === undefined ? "—" : n.toFixed(3));
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Log loss"
          value={fmt(m.log_loss)}
          hint="Lower is better"
          good={m.log_loss !== undefined && m.log_loss < 1.05}
        />
        <MetricCard
          label="Brier"
          value={fmt(m.brier)}
          hint="Lower is better"
          good={m.brier !== undefined && m.brier < 0.66}
        />
        <MetricCard
          label="Accuracy"
          value={m.accuracy !== undefined ? `${(m.accuracy * 100).toFixed(1)}%` : "—"}
          hint="3-class baseline ≈ 33%"
          good={m.accuracy !== undefined && m.accuracy > 0.4}
        />
        <MetricCard
          label="Calibration (ECE)"
          value={fmt(m.ece)}
          hint="0 = perfectly calibrated"
          good={m.ece !== undefined && m.ece < 0.05}
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
        <div className="flex flex-wrap gap-x-8 gap-y-1">
          <span>
            Calibrated:{" "}
            <span className="text-white">{m.calibrated ? "yes" : "no"}</span>
          </span>
          <span>
            Feature set:{" "}
            <span className="text-white">{m.feature_version ?? "—"}</span>
          </span>
          <span>
            Train / test:{" "}
            <span className="text-white">
              {m.n_train ?? "—"} / {m.n_test ?? "—"}
            </span>
          </span>
        </div>
        {m.features && (
          <div className="mt-2 text-xs text-white/40">
            Features: {m.features.join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-insight/30 bg-insight/10 p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-white/60">{body}</p>
      <Link
        href="/account"
        className="mt-4 inline-block rounded-lg bg-insight px-4 py-2 text-sm font-medium"
      >
        Go to account
      </Link>
    </div>
  );
}

export default function ModelHealthPage() {
  const { token, user } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["model-evaluation", token],
    queryFn: () => api.modelEvaluation(token ?? ""),
    enabled: Boolean(token),
    retry: 0,
  });

  const forbidden =
    error instanceof ApiError && (error.status === 403 || error.status === 401);

  return (
    <main className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Model Health</h1>
        <span className="rounded-full bg-signal/20 px-3 py-1 text-xs font-semibold text-signal">
          PREMIUM
        </span>
      </div>
      <p className="max-w-2xl text-sm text-white/50">
        Live evaluation of the prediction ensemble — how accurate and, crucially,
        how well-calibrated its probabilities are. We optimise for honest
        confidence, not headline accuracy.
      </p>

      {!token && (
        <Notice
          title="Sign in to view model health"
          body="Model evaluation and drift monitoring are part of InsightXI Premium."
        />
      )}

      {token && forbidden && (
        <Notice
          title="Premium subscription required"
          body={`You're signed in as ${user?.email} (${user?.tier}). Upgrade to Premium to view model health.`}
        />
      )}

      {token && !forbidden && isLoading && (
        <p className="text-white/40">Loading…</p>
      )}

      {token && !forbidden && data && data.status === "ok" && data.report && (
        <Report m={data.report} />
      )}

      {token && !forbidden && data && data.status !== "ok" && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
          No evaluation report yet. The trained ensemble has not been built —
          the service is serving analytical (Poisson + Elo) predictions. Run{" "}
          <code className="text-white">python -m app.training.train</code> in the
          AI service to populate metrics.
        </div>
      )}
    </main>
  );
}
