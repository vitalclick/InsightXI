"use client";

import Link from "next/link";
import { api } from "../../services/api-client";
import { useAdminData } from "../../hooks/use-admin";
import { Icon } from "../../components/ui/icon";
import { Avatar, Panel, StatusTag, Tag, fmtMoney, fmtNum, relTime } from "../../components/admin/ui";
import { Donut, LineChart, Sparkline } from "../../components/admin/mini-charts";

const PLAN_COLORS: Record<string, string> = {
  Premium: "var(--gold)",
  Trial: "var(--blue)",
  Free: "#54607a",
};

export default function AdminOverviewPage() {
  const { data, isLoading, isError } = useAdminData("overview", api.admin.overview);

  if (isLoading) return <p className="muted">Loading platform overview…</p>;
  if (isError || !data) return <p className="muted">Could not load overview.</p>;

  const { kpis, series, planDistribution, recentSignups, recentActivity, health } = data;

  const cards: {
    label: string;
    icon: string;
    color: string;
    value: string;
    delta: string;
    dc: "up" | "down" | "muted";
    spark: number[];
  }[] = [
    { label: "Total Users", icon: "players", color: "var(--blue-2)", value: fmtNum(kpis.totalUsers), delta: "▲ 10.6%", dc: "up", spark: series.userGrowth },
    { label: "Premium Subscribers", icon: "premium", color: "var(--gold)", value: fmtNum(kpis.premium), delta: "▲ 6.2%", dc: "up", spark: series.revenue },
    { label: "Monthly Recurring Rev", icon: "analytics", color: "var(--green-2)", value: `£${(kpis.mrr / 1000).toFixed(1)}k`, delta: "▲ 8.8%", dc: "up", spark: series.revenue },
    { label: "Model Accuracy", icon: "target", color: "var(--cyan)", value: `${kpis.accuracy}%`, delta: "▲ 0.8pts", dc: "up", spark: series.accuracy },
    { label: "Active Now", icon: "bolt", color: "#ff8a95", value: fmtNum(kpis.activeNow), delta: "live", dc: "muted", spark: series.activeHourly },
    { label: "Churn (30d)", icon: "history", color: "var(--violet)", value: `${kpis.churn}%`, delta: "▼ 0.3pts", dc: "up", spark: [2.8, 2.7, 2.6, 2.5, 2.4, 2.3, 2.2, 2.1] },
  ];

  return (
    <>
      <div className="ph-head">
        <div>
          <div className="ph-eyebrow">Command center</div>
          <h1>Overview</h1>
          <div className="sub">Platform health, growth and model performance at a glance</div>
        </div>
        <Link href="/admin/audit" className="btn">
          <Icon name="history" size={16} /> View activity
        </Link>
      </div>

      <div className="adm-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <div className="lab">
              <span className="ic-sq" style={{ background: `color-mix(in srgb, ${c.color} 16%, transparent)`, color: c.color }}>
                <Icon name={c.icon} size={16} />
              </span>
              {c.label}
            </div>
            <div className="val">{c.value}</div>
            <div className={`delta ${c.dc}`}>
              {c.delta}{" "}
              {c.dc !== "muted" && <span className="muted" style={{ fontWeight: 500 }}>vs last month</span>}
            </div>
            <div style={{ marginTop: 6 }}>
              <Sparkline values={c.spark} color={c.color} />
            </div>
          </div>
        ))}
      </div>

      <div className="adm-grid" style={{ gridTemplateColumns: "1.5fr 1fr", marginTop: 16 }}>
        <Panel title="User Growth" icon={<Icon name="players" size={16} />} action={<Tag>Last 12 weeks</Tag>}>
          <LineChart values={series.userGrowth} color="var(--blue)" labels={["W1", "W4", "W8", "W12"]} />
        </Panel>
        <Panel title="Plan Distribution" icon={<Icon name="premium" size={16} />}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Donut
              slices={planDistribution.map((p) => ({ value: p.count, color: PLAN_COLORS[p.plan] }))}
              centerTop={`${planDistribution.find((p) => p.plan === "Premium")?.pct ?? 0}%`}
              centerBot="Premium"
            />
            <div style={{ flex: 1 }}>
              {planDistribution.map((p) => (
                <div key={p.plan} className="kv">
                  <span className="k" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: PLAN_COLORS[p.plan] }} />
                    {p.plan}
                  </span>
                  <span className="v mono">{p.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <div className="adm-grid" style={{ gridTemplateColumns: "1fr 1.5fr", marginTop: 16 }}>
        <Panel title="Revenue" icon={<Icon name="analytics" size={16} />} action={<Tag variant="ok">{fmtMoney(kpis.mrr)} MRR</Tag>}>
          <LineChart values={series.revenue} color="var(--gold)" labels={["Jun", "Sep", "Dec", "May"]} />
        </Panel>
        <Panel
          title="Recent Activity"
          icon={<Icon name="bolt" size={16} />}
          action={<Link href="/admin/audit" className="muted" style={{ fontSize: 12.5 }}>View log →</Link>}
          bodyStyle={{ padding: "6px 18px" }}
        >
          {recentActivity.map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
              <Avatar name={a.actor} small />
              <div style={{ flex: 1, fontSize: 12.5, color: "var(--text-2)" }}>
                <b style={{ color: "var(--text)" }}>{a.actor.split(" ")[0]}</b> {a.action}{" "}
                <span className="mono" style={{ color: "var(--blue-2)" }}>{a.target}</span>
              </div>
              <span className="muted mono" style={{ fontSize: 11 }}>{relTime(a.at)}</span>
            </div>
          ))}
        </Panel>
      </div>

      <div className="adm-grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 16 }}>
        <Panel
          title="Recent Signups"
          icon={<Icon name="players" size={16} />}
          action={<Link href="/admin/users" className="muted" style={{ fontSize: 12.5 }}>All users →</Link>}
          bodyStyle={{ padding: "6px 12px" }}
        >
          {recentSignups.map((u) => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 6px" }}>
              <Avatar name={u.name} small />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{u.name}</div>
                <div className="muted" style={{ fontSize: 11.5 }}>{u.email}</div>
              </div>
              <StatusTag value={u.plan} />
            </div>
          ))}
        </Panel>
        <Panel title="System Health" icon={<Icon name="bolt" size={16} />} action={<Tag variant="ok" dot>Operational</Tag>}>
          {health.map((h) => (
            <div key={h.label} className="kv">
              <span className="k">{h.label}</span>
              <span className="v">
                {h.status === "ok" ? <Tag variant="ok" dot>{h.value}</Tag> : <span className="mono">{h.value}</span>}
              </span>
            </div>
          ))}
        </Panel>
      </div>
    </>
  );
}
