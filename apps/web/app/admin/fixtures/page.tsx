"use client";

import { api } from "../../../services/api-client";
import { useAdminData } from "../../../hooks/use-admin";
import { DataTable, type Column } from "../../../components/admin/data-table";
import { StatusTag, Tag } from "../../../components/admin/ui";
import type { AdminFixture } from "../../../lib/types";

function kickoff(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_MAP: Record<string, string> = {
  SCHEDULED: "Pending",
  LIVE: "Open",
  FINISHED: "Closed",
};

const COLUMNS: Column<AdminFixture>[] = [
  { key: "league", label: "League", sortable: true, render: (f) => <Tag variant="info">{f.league}</Tag> },
  {
    key: "home",
    label: "Match",
    sortable: true,
    render: (f) => (
      <span className="cell-strong">
        {f.home} <span className="muted">v</span> {f.away}
        {f.featured && <span style={{ marginLeft: 8 }}><Tag variant="pro">Featured</Tag></span>}
      </span>
    ),
  },
  { key: "kickoff", label: "Kickoff", sortable: true, sortValue: (f) => f.kickoff, render: (f) => <span className="muted mono">{kickoff(f.kickoff)}</span> },
  { key: "status", label: "Status", sortable: true, render: (f) => <StatusTag value={STATUS_MAP[f.status] ?? f.status} dot /> },
];

export default function AdminFixturesPage() {
  const { data: fixtures = [], isLoading } = useAdminData("fixtures", api.admin.fixtures);

  return (
    <>
      <div className="ph-head">
        <div>
          <div className="ph-eyebrow">Operations</div>
          <h1>Fixtures &amp; Matches</h1>
          <div className="sub">Upcoming and recently completed matches across covered leagues</div>
        </div>
      </div>

      {isLoading ? (
        <p className="muted">Loading fixtures…</p>
      ) : (
        <DataTable
          rows={fixtures}
          columns={COLUMNS}
          searchKeys={["home", "away", "league"]}
          searchPlaceholder="Search team or league…"
          pageSize={12}
          initialSort={{ key: "kickoff", dir: "asc" }}
        />
      )}
    </>
  );
}
