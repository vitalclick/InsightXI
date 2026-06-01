"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

interface Tip {
  label: string;
  top: number;
  left: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const closeMobile = useUiStore((s) => s.closeMobile);
  const collapsed = useUiStore((s) => s.collapsed);

  // Tooltip for the collapsed icon rail: when labels are hidden, hovering or
  // keyboard-focusing an item surfaces its name. Rendered through a portal to
  // <body> so no ancestor's `transform`/`filter`/`overflow` can contain or clip
  // a `position: fixed` child (Framer Motion reveal wrappers do exactly that).
  // Inert when the sidebar is expanded — labels are already visible there.
  const [mounted, setMounted] = useState(false);
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => setMounted(true), []);

  function showTip(e: React.SyntheticEvent<HTMLElement>, label: string) {
    if (!collapsed) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ label, top: r.top + r.height / 2, left: r.right + 10 });
  }
  function hideTip() {
    setTip(null);
  }

  function tipHandlers(label: string) {
    return {
      onMouseEnter: (e: React.MouseEvent<HTMLElement>) => showTip(e, label),
      onFocus: (e: React.FocusEvent<HTMLElement>) => showTip(e, label),
      onMouseLeave: hideTip,
      onBlur: hideTip,
    };
  }

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
                  aria-label={it.label}
                  {...tipHandlers(it.label)}
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
          aria-label="Upgrade Premium"
          {...tipHandlers("Upgrade Premium")}
          style={{ background: "linear-gradient(135deg,rgba(232,194,112,.14),rgba(232,194,112,.03))", border: "1px solid rgba(232,194,112,.2)" }}
        >
          <Icon name="premium" />
          <span className="sb-foot-txt" style={{ color: "var(--gold)", fontWeight: 600 }}>
            Upgrade Premium
          </span>
        </Link>
      </div>
      {mounted &&
        collapsed &&
        tip &&
        createPortal(
          <div className="sb-tip" role="tooltip" style={{ top: tip.top, left: tip.left }}>
            {tip.label}
          </div>,
          document.body,
        )}
    </aside>
  );
}
