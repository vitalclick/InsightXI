"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth-store";

/** Fetches an admin endpoint with the current bearer token (gated to admins). */
export function useAdminData<T>(key: string, fetcher: (token: string) => Promise<T>) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["admin", key],
    queryFn: () => fetcher(token as string),
    enabled: !!token,
  });
}
