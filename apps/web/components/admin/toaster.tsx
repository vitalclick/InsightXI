"use client";

import { useAdminToast } from "../../store/admin-toast";

/** Renders the transient admin toast queue (mounted once in AdminShell). */
export function AdminToaster() {
  const toasts = useAdminToast((s) => s.toasts);
  return (
    <div className="adm-toaster" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`adm-toast ${t.tone}`}>
          <span className="dot" />
          {t.message}
        </div>
      ))}
    </div>
  );
}
