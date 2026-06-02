"use client";

import { api } from "../../../services/api-client";
import { useAdminData } from "../../../hooks/use-admin";
import { DataTable, type Column } from "../../../components/admin/data-table";
import { Avatar, StatusTag, fmtNum, fmtMoney, relTime } from "../../../components/admin/ui";
import type { AdminUser } from "../../../lib/types";

const COLUMNS: Column<AdminUser>[] = [
  {
    key: "name",
    label: "User",
    sortable: true,
    render: (u) => (
      <div className="cell-user">
        <Avatar name={u.name} small />
        <div className="meta">
          <b>
            {u.name} {u.flagged && <span title="Flagged">⚑</span>}
          </b>
          <span>{u.email}</span>
        </div>
      </div>
    ),
  },
  { key: "plan", label: "Plan", sortable: true, render: (u) => <StatusTag value={u.plan} /> },
  { key: "role", label: "Role", sortable: true, render: (u) => <StatusTag value={u.role} /> },
  { key: "status", label: "Status", sortable: true, render: (u) => <StatusTag value={u.status} dot /> },
  { key: "country", label: "Country", sortable: true },
  {
    key: "predictions",
    label: "Predictions",
    sortable: true,
    align: "right",
    render: (u) => <span className="cell-num">{fmtNum(u.predictions)}</span>,
  },
  {
    key: "spend",
    label: "Spend",
    sortable: true,
    align: "right",
    render: (u) => <span className="cell-num">{u.spend ? fmtMoney(u.spend) : "—"}</span>,
  },
  {
    key: "lastSeen",
    label: "Last seen",
    sortable: true,
    sortValue: (u) => u.lastSeen,
    render: (u) => <span className="muted">{relTime(u.lastSeen)}</span>,
  },
];

export default function AdminUsersPage() {
  const { data: users = [], isLoading } = useAdminData("users", api.admin.users);

  return (
    <>
      <div className="ph-head">
        <div>
          <div className="ph-eyebrow">Accounts</div>
          <h1>Users</h1>
          <div className="sub">{fmtNum(users.length)} accounts across all tiers</div>
        </div>
      </div>

      {isLoading ? (
        <p className="muted">Loading users…</p>
      ) : (
        <DataTable
          rows={users}
          columns={COLUMNS}
          searchKeys={["name", "email", "country"]}
          searchPlaceholder="Search name, email, country…"
          pageSize={12}
          initialSort={{ key: "lastSeen", dir: "desc" }}
        />
      )}
    </>
  );
}
