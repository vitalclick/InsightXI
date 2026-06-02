"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth-store";
import { useAdminToast } from "../store/admin-toast";
import { ApiError } from "../services/api-client";

/** Fetches an admin endpoint with the current bearer token (gated to admins). */
export function useAdminData<T>(key: string, fetcher: (token: string) => Promise<T>) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["admin", key],
    queryFn: () => fetcher(token as string),
    enabled: !!token,
  });
}

/**
 * Wraps a write action: injects the bearer token, surfaces a success/error
 * toast, and invalidates the listed admin queries so the UI re-fetches.
 */
export function useAdminAction<TArgs>(
  action: (args: TArgs, token: string) => Promise<unknown>,
  opts: { success: string; invalidate: string[] },
) {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const push = useAdminToast((s) => s.push);

  return useMutation({
    mutationFn: (args: TArgs) => action(args, token as string),
    onSuccess: () => {
      push(opts.success, "ok");
      for (const key of opts.invalidate) {
        queryClient.invalidateQueries({ queryKey: ["admin", key] });
      }
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "Action failed";
      push(msg, "error");
    },
  });
}
