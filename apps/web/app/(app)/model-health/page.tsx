"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "../../../services/api-client";
import { useAuthStore } from "../../../store/auth-store";
import { PageHead } from "../../../components/ui/page-head";
import { ChartBox } from "../../../components/charts/chart-box";
import * as IX from "../../../lib/ix-charts";
import type { ModelMetrics } from "../../../lib/types";

function MetricCard({ label, value, hint, good }: { label: string; value: string; hint: string; good?: boolean }) {
  return (
    <div className="kpi card-hover">
      <div className="flex jcb aic">
        <div className="stat-lab">{label}</div>
        {good !== undefined && <span className="badge-dot" style={{ background: good ? "var(--green)" : "var(--amber)" }} />}
      </div>
      <div className="stat-val" style={{ margin: "8px 0 2px" }}>{value}</div>
      <div className="dim" style={{ fontSize: 11 }}>{hint}</div>
    </div>
  );
}

function ReliabilityCard({ m }: { m: ModelMetrics }) {
  const bins = m.reliability ?? [];
  if (bins.length < 2) return null;
  return (
    <section className="card reveal" style={{ marginTop: 18 }}>
      <div className="card-hd">
        <h3>Calibration reliability</h3>
        <span className="dim" style={{ fontSize: 11.5 }}>predicted confidence vs observed accuracy</span>
      </div>
      <div className="card-bd flex jcc">
        <ChartBox
          style={{ width: 460, maxWidth: "100%" }}
          label="Reliability curve: predicted confidence on the x-axis, observed accuracy on the y-axis. The dashed line is perfect calibration."
          deps={[bins.length, m.feature_version ?? ""]}
          draw={(el) =>
            IX.line(el, {
              w: 460,
              h: 240,
              xMax: 1,
              yMin: 0,
              yMax: 1,
              gy: 5,
              yLabels: true,
              yDec: 1,
              xLabels: ["0", "0.25", "0.5", "0.75", "1"],
              smooth: false,
              series: [
                // Perfect-calibration diagonal (confidence == accuracy).
                { color: IX.C.dim, dash: true, data: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
                // Observed reliability points.
                {
                  color: IX.C.blue,
                  dots: true,
                  data: bins.map((b) => ({ x: b.confidence, y: b.accuracy })),
                },
              ],
            })
          }
        />
      </div>
      <div className="card-bd" style={{ paddingTop: 0 }}>
        <p className="dim" style={{ fontSize: 12, lineHeight: 1.6, margin: 0 }}>
          Points on the dashed line are perfectly calibrated. Points below it mean the model is
          over-confident in that band; above means under-confident. The aggregate gap is the ECE above.
        </p>
      </div>
    </section>
  );
}

function Report({ m }: { m: ModelMetrics }) {
  const fmt = (n?: number) => (n === undefined ? "—" : n.toFixed(3));
  return (
    <>
      <div className="grid reveal" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <MetricCard label="Log loss" value={fmt(m.log_loss)} hint="Lower is better" good={m.log_loss !== undefined && m.log_loss < 1.05} />
        <MetricCard label="Brier" value={fmt(m.brier)} hint="Lower is better" good={m.brier !== undefined && m.brier < 0.66} />
        <MetricCard label="Accuracy" value={m.accuracy !== undefined ? `${(m.accuracy * 100).toFixed(1)}%` : "—"} hint="3-class baseline ≈ 33%" good={m.accuracy !== undefined && m.accuracy > 0.4} />
        <MetricCard label="Calibration (ECE)" value={fmt(m.ece)} hint="0 = perfectly calibrated" good={m.ece !== undefined && m.ece < 0.05} />
      </div>
      <section className="card reveal" style={{ marginTop: 18 }}>
        <div className="card-bd">
          <div className="flex wrap gap-24" style={{ fontSize: 13, color: "var(--text-2)" }}>
            <span>Calibrated: <b style={{ color: "var(--text)" }}>{m.calibrated ? "yes" : "no"}</b></span>
            <span>Feature set: <b style={{ color: "var(--text)" }}>{m.feature_version ?? "—"}</b></span>
            <span>Train / test: <b style={{ color: "var(--text)" }}>{m.n_train ?? "—"} / {m.n_test ?? "—"}</b></span>
          </div>
          {m.features && <div className="dim" style={{ fontSize: 12, marginTop: 10 }}>Features: {m.features.join(", ")}</div>}
        </div>
      </section>
      <ReliabilityCard m={m} />
    </>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <section className="card reveal">
      <div className="card-bd empty">
        <h4>{title}</h4>
        <p>{body}</p>
        <Link href="/account" className="btn btn-sm btn-primary" style={{ marginTop: 14 }}>Go to account</Link>
      </div>
    </section>
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

  const forbidden = error instanceof ApiError && (error.status === 403 || error.status === 401);

  return (
    <>
      <PageHead
        eyebrow="Model Health"
        title="Evaluation & calibration"
        sub="How accurate — and how well-calibrated — the prediction ensemble is. We optimise for honest confidence, not headline accuracy."
        actions={<span className="badge gold">Premium</span>}
      />

      {!token && <Notice title="Sign in to view model health" body="Model evaluation and drift monitoring are part of InsightXI Premium." />}
      {token && forbidden && (
        <Notice title="Premium subscription required" body={`You're signed in as ${user?.email} (${user?.tier}). Upgrade to Premium to view model health.`} />
      )}
      {token && !forbidden && isLoading && <div className="empty">Loading evaluation…</div>}
      {token && !forbidden && data && data.status === "ok" && data.report && <Report m={data.report} />}
      {token && !forbidden && data && data.status !== "ok" && (
        <section className="card reveal">
          <div className="card-bd" style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6 }}>
            No evaluation report yet. The trained ensemble has not been built — the service is serving analytical
            (Poisson + Elo) predictions. Run <code>python -m app.training.train</code> in the AI service to populate metrics.
          </div>
        </section>
      )}
    </>
  );
}
