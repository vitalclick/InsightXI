"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "../ui/icon";
import { useNotifications } from "../../hooks/use-notifications";
import { useAuthStore } from "../../store/auth-store";
import { timeAgo } from "../../lib/relative-time";

export function NotificationsBell() {
  const token = useAuthStore((s) => s.token);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { unreadCount, items, isLoading, markRead, markAllRead } = useNotifications(open);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Signed-out users get the plain link to sign in (no live notifications).
  if (!token) {
    return (
      <Link href="/account" className="tb-icon" title="Notifications" aria-label="Notifications">
        <Icon name="bell" size={17} />
      </Link>
    );
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        className="tb-icon"
        title="Notifications"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="bell" size={17} />
        {unreadCount > 0 && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              minWidth: 15,
              height: 15,
              padding: "0 3px",
              borderRadius: 8,
              background: "var(--red, #ef4444)",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              display: "grid",
              placeItems: "center",
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="card"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 320,
            maxHeight: 420,
            overflowY: "auto",
            zIndex: 60,
            boxShadow: "0 12px 40px rgba(0,0,0,.35)",
          }}
        >
          <div
            className="flex jcb aic"
            style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)" }}
          >
            <strong style={{ fontSize: 13 }}>Notifications</strong>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="btn btn-ghost"
                style={{ padding: "2px 8px", fontSize: 11 }}
              >
                Mark all read
              </button>
            )}
          </div>

          {isLoading && (
            <p className="dim" style={{ padding: 16, fontSize: 13 }}>Loading…</p>
          )}

          {!isLoading && items.length === 0 && (
            <p className="dim" style={{ padding: 20, fontSize: 13, textAlign: "center" }}>
              You&rsquo;re all caught up.
            </p>
          )}

          {items.map((n) => {
            const inner = (
              <div
                style={{
                  padding: "11px 14px",
                  borderBottom: "1px solid var(--line)",
                  background: n.read ? "transparent" : "rgba(46,125,255,.06)",
                  cursor: n.link ? "pointer" : "default",
                }}
              >
                <div className="flex jcb aic gap-8">
                  <strong style={{ fontSize: 12.5 }}>{n.title}</strong>
                  <span className="dim" style={{ fontSize: 10.5, whiteSpace: "nowrap" }}>
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                <div className="dim" style={{ fontSize: 12, marginTop: 3, lineHeight: 1.45 }}>
                  {n.body}
                </div>
              </div>
            );
            const onActivate = () => {
              if (!n.read) markRead(n.id);
              setOpen(false);
            };
            return n.link ? (
              <Link key={n.id} href={n.link} onClick={onActivate} role="menuitem" style={{ display: "block", color: "inherit" }}>
                {inner}
              </Link>
            ) : (
              <button
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                role="menuitem"
                style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: 0, padding: 0, color: "inherit" }}
              >
                {inner}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
