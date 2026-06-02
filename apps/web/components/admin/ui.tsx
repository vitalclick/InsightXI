import type { ReactNode } from "react";

const AVATAR_COLORS = [
  "#2e7dff", "#27e08a", "#19d3e3", "#9b7bff", "#e8c270", "#ff5b6b", "#ffb13d",
];

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

/** Square gradient avatar from a person's name. */
export function Avatar({ name, small }: { name: string; small?: boolean }) {
  const c = colorFor(name);
  return (
    <span
      className={`av-sq${small ? " sm" : ""}`}
      style={{ background: `linear-gradient(150deg, ${c}, ${c}aa)` }}
    >
      {initials(name)}
    </span>
  );
}

export type TagVariant =
  | "ok" | "warn" | "bad" | "info" | "pro" | "violet" | "neutral";

export function Tag({
  variant = "neutral",
  dot,
  children,
}: {
  variant?: TagVariant;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span className={`tag ${variant}`}>
      {dot && <span className="dt" />}
      {children}
    </span>
  );
}

/** Maps a status/plan/result string to a tag variant. */
const VARIANT_MAP: Record<string, TagVariant> = {
  // status
  Active: "ok", Paid: "ok", Hit: "ok", Published: "ok", Closed: "neutral",
  Pending: "warn", Scheduled: "warn", Draft: "neutral",
  Suspended: "bad", Failed: "bad", Miss: "bad", Open: "info", Refunded: "violet",
  // plans / priority
  Premium: "pro", Trial: "info", Free: "neutral",
  High: "bad", Medium: "warn", Low: "neutral",
  Admin: "pro", Analyst: "info", User: "neutral",
};

export function StatusTag({ value, dot }: { value: string; dot?: boolean }) {
  return (
    <Tag variant={VARIANT_MAP[value] ?? "neutral"} dot={dot}>
      {value}
    </Tag>
  );
}

export function Panel({
  title,
  icon,
  action,
  children,
  bodyStyle,
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  bodyStyle?: React.CSSProperties;
}) {
  return (
    <div className="panel">
      <div className="panel-hd">
        <h3>
          {icon && <span className="ic">{icon}</span>}
          {title}
        </h3>
        {action && <span className="spacer">{action}</span>}
      </div>
      <div className="panel-bd" style={bodyStyle}>
        {children}
      </div>
    </div>
  );
}

const NUM = new Intl.NumberFormat("en-GB");
export const fmtNum = (n: number) => NUM.format(n);
export const fmtMoney = (n: number) => `£${NUM.format(Math.round(n))}`;

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function relTime(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  const d = Math.floor(mins / 1440);
  return d === 1 ? "yesterday" : `${d}d ago`;
}
