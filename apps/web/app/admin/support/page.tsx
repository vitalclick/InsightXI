"use client";

import { api } from "../../../services/api-client";
import { useAdminData } from "../../../hooks/use-admin";
import { DataTable, type Column } from "../../../components/admin/data-table";
import { StatusTag, Tag, relTime } from "../../../components/admin/ui";
import type { SupportTicket } from "../../../lib/types";

const COLUMNS: Column<SupportTicket>[] = [
  { key: "id", label: "Ticket", render: (t) => <span className="mono">{t.id}</span> },
  { key: "subject", label: "Subject", sortable: true, render: (t) => <span className="cell-strong">{t.subject}</span> },
  { key: "category", label: "Category", sortable: true, render: (t) => <Tag>{t.category}</Tag> },
  { key: "priority", label: "Priority", sortable: true, render: (t) => <StatusTag value={t.priority} /> },
  { key: "requester", label: "Requester", render: (t) => <span className="muted">{t.requester}</span> },
  { key: "assignee", label: "Assignee", sortable: true, render: (t) => <span className="muted">{t.assignee}</span> },
  { key: "status", label: "Status", sortable: true, render: (t) => <StatusTag value={t.status} dot /> },
  { key: "date", label: "Updated", sortable: true, sortValue: (t) => t.date, render: (t) => <span className="muted">{relTime(t.date)}</span> },
];

export default function AdminSupportPage() {
  const { data: tickets = [], isLoading } = useAdminData("support", api.admin.support);
  const open = tickets.filter((t) => t.status !== "Closed").length;

  return (
    <>
      <div className="ph-head">
        <div>
          <div className="ph-eyebrow">Support</div>
          <h1>Support</h1>
          <div className="sub">{open} open · {tickets.length} total tickets</div>
        </div>
      </div>

      {isLoading ? (
        <p className="muted">Loading tickets…</p>
      ) : (
        <DataTable
          rows={tickets}
          columns={COLUMNS}
          searchKeys={["subject", "requester", "category"]}
          searchPlaceholder="Search subject, requester…"
          pageSize={10}
          initialSort={{ key: "date", dir: "desc" }}
        />
      )}
    </>
  );
}
