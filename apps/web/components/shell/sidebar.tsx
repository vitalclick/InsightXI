"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, Logo } from "../ui/icon";
import { useUiStore } from "../../store/ui-store";
import { SIDENAV, type NavTag } from "./nav-config";

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

function TagBadge({ tag }: { tag: NavTag }) {
  if (tag === "LIVE")
    return (
      <span className="live-pill" style={{ marginLeft: "auto", height: 18, padding: "0 6px", fontSize: 9 }}>
        <span className="pulse" />
        LIVE
      </span>
    );
  if (tag === "AI")
    return (
      <span className="badge blue" style={{ marginLeft: "auto", height: 18, fontSize: 9 }}>
        AI
      </span>
    );
  if (tag === "HOT")
    return (
      <span
        className="badge gold"
        style={{ marginLeft: "auto", height: 18, fontSize: 9, color: "var(--amber)", borderColor: "rgba(255,177,61,.3)", background: "rgba(255,177,61,.1)" }}
      >
        HOT
      </span>
    );
  return (
    <span className="badge gold" style={{ marginLeft: "auto", height: 18, fontSize: 9 }}>
      PRO
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const closeMobile = useUiStore((s) => s.closeMobile);

  return (
    <aside className="sidebar">
      <Link href="/" className="sb-brand" onClick={closeMobile}>
        <div className="sb-logo">
          <Logo />
        </div>
        <div className="sb-brand-name">
          Insight<b>XI</b>
        </div>
      </Link>
      <nav className="sb-nav" aria-label="Sidebar">
        {SIDENAV.map((sec) => (
          <div key={sec.section}>
            <div className="sb-sec-label">{sec.section}</div>
            {sec.items.map((it) => {
              const active = isActive(pathname, it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={closeMobile}
                  className={`nav-i${active ? " active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon name={it.icon} />
                  <span>{it.label}</span>
                  {it.tag && <TagBadge tag={it.tag} />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="sb-foot">
        <Link
          href="/premium"
          onClick={closeMobile}
          className="nav-i"
          style={{ background: "linear-gradient(135deg,rgba(232,194,112,.14),rgba(232,194,112,.03))", border: "1px solid rgba(232,194,112,.2)" }}
        >
          <Icon name="premium" />
          <span className="sb-foot-txt" style={{ color: "var(--gold)", fontWeight: 600 }}>
            Upgrade Premium
          </span>
        </Link>
      </div>
    </aside>
  );
}
