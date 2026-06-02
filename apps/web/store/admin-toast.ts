import { create } from "zustand";

export interface Toast {
  id: number;
  message: string;
  tone: "ok" | "error";
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, tone?: "ok" | "error") => void;
  dismiss: (id: number) => void;
}

/** Minimal transient toast queue for admin write-action feedback. */
export const useAdminToast = create<ToastState>((set) => ({
  toasts: [],
  push: (message, tone = "ok") => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2600);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
