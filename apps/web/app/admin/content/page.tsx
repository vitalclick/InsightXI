"use client";

import { api } from "../../../services/api-client";
import { useAdminData } from "../../../hooks/use-admin";
import { DataTable, type Column } from "../../../components/admin/data-table";
import { StatusTag, Tag, fmtDate, fmtNum } from "../../../components/admin/ui";
import type { ContentPost } from "../../../lib/types";

const COLUMNS: Column<ContentPost>[] = [
  { key: "title", label: "Title", sortable: true, render: (p) => <span className="cell-strong">{p.title}</span> },
  { key: "category", label: "Category", sortable: true, render: (p) => <Tag variant="violet">{p.category}</Tag> },
  { key: "author", label: "Author", render: (p) => <span className="muted">{p.author}</span> },
  { key: "status", label: "Status", sortable: true, render: (p) => <StatusTag value={p.status} /> },
  { key: "views", label: "Views", sortable: true, align: "right", render: (p) => <span className="cell-num">{p.views ? fmtNum(p.views) : "—"}</span> },
  { key: "date", label: "Date", sortable: true, sortValue: (p) => p.date, render: (p) => <span className="muted">{fmtDate(p.date)}</span> },
];

export default function AdminContentPage() {
  const { data: posts = [], isLoading } = useAdminData("content", api.admin.content);

  const published = posts.filter((p) => p.status === "Published").length;
  const drafts = posts.filter((p) => p.status === "Draft").length;
  const scheduled = posts.filter((p) => p.status === "Scheduled").length;

  return (
    <>
      <div className="ph-head">
        <div>
          <div className="ph-eyebrow">Editorial</div>
          <h1>Content</h1>
          <div className="sub">
            {published} published · {drafts} drafts · {scheduled} scheduled
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="muted">Loading content…</p>
      ) : (
        <DataTable
          rows={posts}
          columns={COLUMNS}
          searchKeys={["title", "author", "category"]}
          searchPlaceholder="Search posts…"
          pageSize={10}
          initialSort={{ key: "date", dir: "desc" }}
        />
      )}
    </>
  );
}
