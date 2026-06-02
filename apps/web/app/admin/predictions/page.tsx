"use client";

import { api } from "../../../services/api-client";
import { useAdminData } from "../../../hooks/use-admin";
import { DataTable, type Column } from "../../../components/admin/data-table";
import { StatusTag, fmtDate, relTime } from "../../../components/admin/ui";
import type { ModelPick } from "../../../lib/types";

const COLUMNS: Column<ModelPick>[] = [
  {
    key: "home",
    label: "Match",
    sortable: true,
    render: (p) => (
      <span className="cell-strong">
        {p.home} <span className="muted">v</span> {p.away}
      </span>
    ),
  },
  { key: "market", label: "Market", sortable: true, render: (p) => <span className="muted">{p.market}</span> },
  { key: "pick", label: "Pick", render: (p) => <span className="cell-strong">{p.pick}</span> },
  {
    key: "confidence",
    label: "Confidence",
    sortable: true,
    align: "right",
    render: (p) => <span className="cell-num">{p.confidence}%</span>,
  },
  { key: "result", label: "Result", sortable: true, render: (p) => <StatusTag value={p.result} /> },
  { key: "model", label: "Model", render: (p) => <span className="mono">{p.model}</span> },
  { key: "date", label: "Date", sortable: true, sortValue: (p) => p.date, render: (p) => <span className="muted">{fmtDate(p.date)}</span> },
];

export default function AdminPredictionsPage() {
  const { data, isLoading } = useAdminData("predictions", api.admin.predictions);

  if (isLoading || !data) return <p className="muted">Loading predictions…</p>;
  const { model, picks } = data;

  const cards = [
    { label: "Model version", value: model.version },
    { label: "Accuracy", value: `${model.accuracy}%` },
    { label: "Brier score", value: model.brier.toFixed(3) },
    { label: "Log loss", value: model.logLoss.toFixed(3) },
    { label: "Picks today", value: String(model.picksToday) },
    { label: "Last trained", value: relTime(model.lastTrained) },
  ];

  return (
    <>
      <div className="ph-head">
        <div>
          <div className="ph-eyebrow">Intelligence engine</div>
          <h1>Predictions &amp; Model</h1>
          <div className="sub">Model performance and recent published picks</div>
        </div>
      </div>

      <div className="adm-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 22 }}>
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <div className="lab">{c.label}</div>
            <div className="val">{c.value}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Recent Picks</h3>
      <DataTable
        rows={picks}
        columns={COLUMNS}
        searchKeys={["home", "away", "market"]}
        searchPlaceholder="Search match or market…"
        pageSize={10}
        initialSort={{ key: "date", dir: "desc" }}
      />
    </>
  );
}
