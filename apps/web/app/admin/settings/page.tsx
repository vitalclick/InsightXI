"use client";

import { api } from "../../../services/api-client";
import { useAdminAction, useAdminData } from "../../../hooks/use-admin";
import { Avatar, Panel, Tag, relTime } from "../../../components/admin/ui";
import { Icon } from "../../../components/ui/icon";

export default function AdminSettingsPage() {
  const { data, isLoading } = useAdminData("settings", api.admin.settings);
  const setFlag = useAdminAction(
    ({ key, enabled }: { key: string; enabled: boolean }, token) =>
      api.admin.setFlag(key, enabled, token),
    { success: "Feature flag updated", invalidate: ["settings", "audit", "overview"] },
  );

  if (isLoading || !data) return <p className="muted">Loading settings…</p>;
  const flags = data.flags;

  return (
    <>
      <div className="ph-head">
        <div>
          <div className="ph-eyebrow">System</div>
          <h1>Settings &amp; Team</h1>
          <div className="sub">Team members, roles and platform feature flags</div>
        </div>
      </div>

      <div className="adm-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Panel title="Team" icon={<Icon name="players" size={16} />} action={<Tag variant="info">{data.team.length} members</Tag>}>
          {data.team.map((m) => (
            <div key={m.email} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
              <Avatar name={m.name} small />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{m.name}</div>
                <div className="muted" style={{ fontSize: 11.5 }}>{m.email}</div>
              </div>
              <Tag variant={m.role === "Owner" ? "pro" : "neutral"}>{m.role}</Tag>
              <span className="muted" style={{ fontSize: 11, width: 70, textAlign: "right" }}>{relTime(m.lastSeen)}</span>
            </div>
          ))}
        </Panel>

        <Panel title="Feature Flags" icon={<Icon name="bolt" size={16} />}>
          {flags.map((f) => (
            <div key={f.key} className="flag-row">
              <div className="meta">
                <b>{f.name}</b>
                <span>{f.description}</span>
              </div>
              <button
                type="button"
                className={`switch${f.enabled ? " on" : ""}`}
                aria-label={`Toggle ${f.name}`}
                aria-pressed={f.enabled}
                disabled={setFlag.isPending}
                onClick={() => setFlag.mutate({ key: f.key, enabled: !f.enabled })}
              />
            </div>
          ))}
        </Panel>
      </div>
    </>
  );
}
