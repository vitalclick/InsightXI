"use client";

import { useState } from "react";
import { api } from "../../../services/api-client";
import { useAdminAction, useAdminData } from "../../../hooks/use-admin";
import { DataTable, type Column } from "../../../components/admin/data-table";
import { Drawer } from "../../../components/admin/drawer";
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
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const invalidate = ["users", "overview", "audit"];
  const update = useAdminAction(
    ({ id, patch }: { id: string; patch: Partial<Pick<AdminUser, "role" | "plan" | "status">> }, token) =>
      api.admin.updateUser(id, patch, token),
    { success: "User updated", invalidate },
  );
  const remove = useAdminAction(
    ({ id }: { id: string }, token) => api.admin.deleteUser(id, token),
    { success: "User deleted", invalidate },
  );

  const busy = update.isPending || remove.isPending;

  function apply(patch: Partial<Pick<AdminUser, "role" | "plan" | "status">>) {
    if (!selected) return;
    update.mutate(
      { id: selected.id, patch },
      { onSuccess: (next) => setSelected(next as AdminUser) },
    );
  }

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
          onRowClick={(u) => setSelected(u)}
        />
      )}

      <Drawer
        open={!!selected}
        title="Manage account"
        onClose={() => setSelected(null)}
        footer={
          selected && (
            <button
              className="btn btn-danger"
              disabled={busy}
              onClick={() => {
                if (confirm(`Delete ${selected.name}? This cannot be undone.`)) {
                  remove.mutate({ id: selected.id }, { onSuccess: () => setSelected(null) });
                }
              }}
            >
              Delete account
            </button>
          )
        }
      >
        {selected && (
          <div className="drawer-stack">
            <div className="cell-user" style={{ gap: 12 }}>
              <Avatar name={selected.name} />
              <div className="meta">
                <b style={{ fontSize: 15 }}>{selected.name}</b>
                <span className="muted">{selected.email}</span>
              </div>
            </div>

            <Field label="Plan">
              <SegButtons
                options={["Free", "Premium", "Trial"]}
                value={selected.plan}
                disabled={busy}
                onSelect={(plan) => apply({ plan: plan as AdminUser["plan"] })}
              />
            </Field>

            <Field label="Role">
              <SegButtons
                options={["User", "Analyst", "Admin"]}
                value={selected.role}
                disabled={busy}
                onSelect={(role) => apply({ role: role as AdminUser["role"] })}
              />
            </Field>

            <Field label="Status">
              <div className="seg">
                {selected.status === "Suspended" ? (
                  <button className="btn" disabled={busy} onClick={() => apply({ status: "Active" })}>
                    Reactivate account
                  </button>
                ) : (
                  <button className="btn btn-danger" disabled={busy} onClick={() => apply({ status: "Suspended" })}>
                    Suspend account
                  </button>
                )}
                <span style={{ marginLeft: 10 }}>
                  <StatusTag value={selected.status} dot />
                </span>
              </div>
            </Field>

            <p className="muted" style={{ fontSize: 12 }}>
              Real accounts persist; suspended users are blocked at sign-in. Demo
              accounts are session-scoped. Every change is written to the audit log.
            </p>
          </div>
        )}
      </Drawer>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="drawer-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function SegButtons({
  options,
  value,
  disabled,
  onSelect,
}: {
  options: string[];
  value: string;
  disabled?: boolean;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={o}
          className={`seg-btn${o === value ? " active" : ""}`}
          disabled={disabled || o === value}
          onClick={() => onSelect(o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
