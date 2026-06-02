"use client";

import { api } from "../../../services/api-client";
import { useAdminData } from "../../../hooks/use-admin";
import { DataTable, type Column } from "../../../components/admin/data-table";
import { StatusTag, fmtMoney, fmtNum, fmtDate } from "../../../components/admin/ui";
import type { AdminTransaction } from "../../../lib/types";

const COLUMNS: Column<AdminTransaction>[] = [
  { key: "id", label: "Invoice", render: (t) => <span className="mono">{t.id}</span> },
  {
    key: "userName",
    label: "Customer",
    sortable: true,
    render: (t) => (
      <div className="cell-user">
        <div className="meta">
          <b>{t.userName}</b>
          <span>{t.email}</span>
        </div>
      </div>
    ),
  },
  { key: "plan", label: "Plan", sortable: true, render: (t) => <StatusTag value={t.plan === "Annual" ? "Premium" : "Trial"} /> },
  { key: "amount", label: "Amount", sortable: true, align: "right", render: (t) => <span className="cell-num">£{t.amount.toFixed(2)}</span> },
  { key: "method", label: "Method", render: (t) => <span className="muted">{t.method}</span> },
  { key: "status", label: "Status", sortable: true, render: (t) => <StatusTag value={t.status} /> },
  { key: "date", label: "Date", sortable: true, sortValue: (t) => t.date, render: (t) => <span className="muted">{fmtDate(t.date)}</span> },
];

export default function AdminSubscriptionsPage() {
  const { data, isLoading } = useAdminData("subscriptions", api.admin.subscriptions);

  if (isLoading || !data) return <p className="muted">Loading subscriptions…</p>;
  const { summary, transactions } = data;

  const cards = [
    { label: "MRR", value: fmtMoney(summary.mrr) },
    { label: "ARR", value: fmtMoney(summary.arr) },
    { label: "Active subscriptions", value: fmtNum(summary.activeSubs) },
    { label: "Trialing", value: fmtNum(summary.trialing) },
    { label: "Churn (30d)", value: `${summary.churn}%` },
    { label: "ARPU", value: `£${summary.arpu.toFixed(2)}` },
  ];

  return (
    <>
      <div className="ph-head">
        <div>
          <div className="ph-eyebrow">Revenue</div>
          <h1>Subscriptions</h1>
          <div className="sub">Recurring revenue, plans and recent transactions</div>
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

      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Recent Transactions</h3>
      <DataTable
        rows={transactions}
        columns={COLUMNS}
        searchKeys={["userName", "email", "id"]}
        searchPlaceholder="Search customer…"
        pageSize={10}
        initialSort={{ key: "date", dir: "desc" }}
      />
    </>
  );
}
