"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, Logo } from "../ui/icon";
import { useThemeStore } from "../../store/theme-store";
import { useAuthStore } from "../../store/auth-store";
import { initials } from "./ui";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}
interface NavSection {
  section: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    section: "Insights",
    items: [
      { href: "/admin", label: "Overview", icon: "grid" },
      { href: "/admin/users", label: "Users", icon: "players" },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: "premium" },
      { href: "/admin/predictions", label: "Predictions", icon: "target" },
    ],
  },
  {
    section: "Operations",
    items: [
      { href: "/admin/fixtures", label: "Fixtures & Matches", icon: "fixtures" },
      { href: "/admin/content", label: "Content", icon: "doc" },
      { href: "/admin/support", label: "Support", icon: "bell" },
    ],
  },
  {
    section: "System",
    items: [
      { href: "/admin/audit", label: "Audit Log", icon: "history" },
      { href: "/admin/settings", label: "Settings & Team", icon: "bolt" },
    ],
  },
];

const TITLES: Record<string, string> = {
  "/admin": "Overview",
  "/admin/users": "Users",
  "/admin/subscriptions": "Subscriptions",
  "/admin/predictions": "Predictions & Model",
  "/admin/fixtures": "Fixtures & Matches",
  "/admin/content": "Content",
  "/admin/support": "Support",
  "/admin/audit": "Audit Log",
  "/admin/settings": "Settings & Team",
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const user = useAuthStore((s) => s.user);

  const title = TITLES[pathname ?? ""] ?? "Admin";
  const name = user?.name ?? user?.email ?? "Administrator";

  return (
    <div className={`adm${collapsed ? " collapsed" : ""}`}>
      <aside className="adm-sb">
        <div className="adm-brand">
          <div className="lg">
            <Logo />
          </div>
          <div className="nm">
            Insight<span>XI</span>
            <small>Admin Console</small>
          </div>
        </div>

        <nav className="adm-nav">
          {NAV.map((sec) => (
            <div key={sec.section}>
              <div className="adm-sec">{sec.section}</div>
              {sec.items.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`adm-i${active ? " active" : ""}`}
                  >
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="adm-sb-foot">
          <Link href="/dashboard" className="adm-me">
            <span
              className="av"
              style={{ background: "linear-gradient(135deg,#2e7dff,#1b54c9)" }}
            >
              {initials(name)}
            </span>
            <span className="mt">
              <b>{name}</b>
              <span>Super Admin</span>
            </span>
          </Link>
        </div>
      </aside>

      <div className="adm-main">
        <div className="adm-top">
          <button
            className="icon-b"
            aria-label="Toggle sidebar"
            onClick={() => setCollapsed((c) => !c)}
          >
            <Icon name="menu" />
          </button>
          <div className="adm-crumb">
            Admin <span className="muted">/</span> <b>{title}</b>
          </div>
          <div className="adm-search">
            <Icon name="search" size={16} />
            <input placeholder="Search users, invoices, tickets…" aria-label="Global search" />
          </div>
          <div className="env-pill">
            <span className="d" />
            Production
          </div>
          <button
            className="icon-b"
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>
        </div>
        <div className="adm-page">{children}</div>
      </div>
    </div>
  );
}
