"use client";

import { useEffect, type ReactNode } from "react";

function CloseIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/** Right-side slide-over panel used for admin detail/edit views. */
export function Drawer({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <button
        className={`adm-scrim${open ? " show" : ""}`}
        aria-label="Close panel"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />
      <aside className={`adm-drawer${open ? " show" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="adm-drawer-hd">
          <b>{title}</b>
          <button className="icon-b" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="adm-drawer-bd">{children}</div>
        {footer && <div className="adm-drawer-ft">{footer}</div>}
      </aside>
    </>
  );
}
