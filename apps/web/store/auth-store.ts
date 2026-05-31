import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PublicUser } from "../lib/types";

/** Auth state persisted to localStorage (Zustand). */
interface AuthState {
  token: string | null;
  user: PublicUser | null;
  setAuth: (token: string, user: PublicUser) => void;
  /** Refresh the cached profile (e.g. after a tier change) keeping the token. */
  setUser: (user: PublicUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: "insightxi-auth" },
  ),
);
