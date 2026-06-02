"use client";

import { api } from "../../../services/api-client";
import { useAdminAction, useAdminData } from "../../../hooks/use-admin";
import { DataTable, type Column } from "../../../components/admin/data-table";
import { StatusTag, Tag, fmtDate, fmtNum } from "../../../components/admin/ui";
import { Icon } from "../../../components/ui/icon";
import type { ContentPost } from "../../../lib/types";

export default function AdminContentPage() {
  const { data: posts = [], isLoading } = useAdminData("content", api.admin.content);
  const invalidate = ["content", "audit", "overview"];

  const create = useAdminAction(
    (input: { title: string; category?: string }, token) => api.admin.createPost(input, token),
    { success: "Draft created", invalidate },
  );
  const update = useAdminAction(
    ({ id, status }: { id: string; status: ContentPost["status"] }, token) =>
      api.admin.updatePost(id, { status }, token),
    { success: "Post updated", invalidate },
  );
  const remove = useAdminAction(
    ({ id }: { id: string }, token) => api.admin.deletePost(id, token),
    { success: "Post deleted", invalidate },
  );

  const published = posts.filter((p) => p.status === "Published").length;
  const drafts = posts.filter((p) => p.status === "Draft").length;
  const scheduled = posts.filter((p) => p.status === "Scheduled").length;

  const columns: Column<ContentPost>[] = [
    { key: "title", label: "Title", sortable: true, render: (p) => <span className="cell-strong">{p.title}</span> },
    { key: "category", label: "Category", sortable: true, render: (p) => <Tag variant="violet">{p.category}</Tag> },
    { key: "author", label: "Author", render: (p) => <span className="muted">{p.author}</span> },
    { key: "status", label: "Status", sortable: true, render: (p) => <StatusTag value={p.status} /> },
    { key: "views", label: "Views", sortable: true, align: "right", render: (p) => <span className="cell-num">{p.views ? fmtNum(p.views) : "—"}</span> },
    { key: "date", label: "Date", sortable: true, sortValue: (p) => p.date, render: (p) => <span className="muted">{fmtDate(p.date)}</span> },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (p) => (
        <div className="row-actions">
          {p.status === "Published" ? (
            <button className="mini-btn" onClick={() => update.mutate({ id: p.id, status: "Draft" })}>
              Unpublish
            </button>
          ) : (
            <button className="mini-btn" onClick={() => update.mutate({ id: p.id, status: "Published" })}>
              Publish
            </button>
          )}
          <button
            className="mini-btn danger"
            onClick={() => {
              if (confirm(`Delete “${p.title}”?`)) remove.mutate({ id: p.id });
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  function newPost() {
    const title = prompt("New post title");
    if (title && title.trim().length >= 3) create.mutate({ title: title.trim() });
  }

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
        <button className="btn btn-primary" onClick={newPost} disabled={create.isPending}>
          <Icon name="doc" size={16} /> New post
        </button>
      </div>

      {isLoading ? (
        <p className="muted">Loading content…</p>
      ) : (
        <DataTable
          rows={posts}
          columns={columns}
          searchKeys={["title", "author", "category"]}
          searchPlaceholder="Search posts…"
          pageSize={10}
          initialSort={{ key: "date", dir: "desc" }}
        />
      )}
    </>
  );
}
