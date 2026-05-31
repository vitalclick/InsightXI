"use client";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Ticker } from "./ticker";
import { Assistant } from "./assistant";
import { useUiStore } from "../../store/ui-store";

/** App chrome: collapsible sidebar + topbar + live ticker wrapping the page. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const collapsed = useUiStore((s) => s.collapsed);
  const mobileOpen = useUiStore((s) => s.mobileOpen);
  const closeMobile = useUiStore((s) => s.closeMobile);

  return (
    <div className={`layout${collapsed ? " collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`}>
      <Sidebar />
      <div className="content">
        <Topbar />
        <Ticker />
        {children}
      </div>
      {mobileOpen && (
        <button
          aria-label="Close menu"
          onClick={closeMobile}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 35,
            background: "rgba(0,0,0,.45)",
            border: "none",
          }}
        />
      )}
      <Assistant />
    </div>
  );
}
