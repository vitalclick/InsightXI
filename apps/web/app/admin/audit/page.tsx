"use client";

import { api } from "../../../services/api-client";
import { useAdminData } from "../../../hooks/use-admin";
import { DataTable, type Column } from "../../../components/admin/data-table";
import { Avatar, relTime } from "../../../components/admin/ui";
import type { AuditEntry } from "../../../lib/types";

const COLUMNS: Column<AuditEntry>[] = [
  {
    key: "actor",
    label: "Actor",
    sortable: true,
    render: (a) => (
      <div className="cell-user">
        <Avatar name={a.actor} small />
        <div className="meta">
          <b>{a.actor}</b>
        </div>
      </div>
    ),
  },
  { key: "action", label: "Action", sortable: true, render: (a) => <span className="cell-strong">{a.action}</span> },
  { key: "target", label: "Target", render: (a) => <span className="mono" style={{ color: "var(--blue-2)" }}>{a.target}</span> },
  { key: "ip", label: "IP", render: (a) => <span className="mono muted">{a.ip}</span> },
  { key: "at", label: "When", sortable: true, sortValue: (a) => a.at, align: "right", render: (a) => <span className="muted">{relTime(a.at)}</span> },
];

export default function AdminAuditPage() {
  const { data: entries = [], isLoading } = useAdminData("audit", api.admin.audit);

  return (
    <>
      <div className="ph-head">
        <div>
          <div className="ph-eyebrow">System</div>
          <h1>Audit Log</h1>
          <div className="sub">Administrative actions across the platform</div>
        </div>
      </div>

      {isLoading ? (
        <p className="muted">Loading audit log…</p>
      ) : (
        <DataTable
          rows={entries}
          columns={COLUMNS}
          searchKeys={["actor", "action", "target"]}
          searchPlaceholder="Search actor, action, target…"
          pageSize={12}
          initialSort={{ key: "at", dir: "desc" }}
        />
      )}
    </>
  );
}
