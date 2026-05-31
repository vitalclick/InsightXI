"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../ui/icon";
import { ThemeToggle } from "../theme/theme-toggle";
import { useUiStore } from "../../store/ui-store";
import { useAuthStore } from "../../store/auth-store";
import { TOPNAV } from "./nav-config";
import { SearchBox } from "./search-box";
import { Freshness } from "./freshness";
import { NotificationsBell } from "./notifications-bell";

export function Topbar() {
  const pathname = usePathname();
  const toggleCollapsed = useUiStore((s) => s.toggleCollapsed);
  const toggleMobile = useUiStore((s) => s.toggleMobile);
  const toggleAssistant = useUiStore((s) => s.toggleAssistant);
  const assistantOpen = useUiStore((s) => s.assistantOpen);
  const user = useAuthStore((s) => s.user);
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "IX";

  const onToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 860) toggleMobile();
    else toggleCollapsed();
  };

  return (
    <header className="topbar">
      <button className="sb-toggle" onClick={onToggle} aria-label="Toggle sidebar">
        <Icon name="menu" size={18} />
      </button>
      <nav className="topnav" aria-label="Primary">
        {TOPNAV.map((l) => {
          const active = pathname.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
              {l.label}
            </Link>
          );
        })}
      </nav>
      <SearchBox />
      <span className="tb-freshness">
        <Freshness />
      </span>
      <ThemeToggle />
      <button
        className="tb-icon"
        title="Ask Insight (AI assistant)"
        aria-label="Open Insight AI assistant"
        aria-haspopup="dialog"
        aria-expanded={assistantOpen}
        onClick={toggleAssistant}
        style={assistantOpen ? { color: "var(--blue-2)", borderColor: "rgba(46,125,255,.3)", background: "rgba(46,125,255,.1)" } : undefined}
      >
        <Icon name="bolt" size={17} />
      </button>
      <NotificationsBell />
      <Link href="/account" className="tb-avatar" aria-label="Account">
        {initials}
      </Link>
    </header>
  );
}
