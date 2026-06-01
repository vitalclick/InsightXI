"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api-client";
import { useAuthStore } from "../store/auth-store";

/**
 * In-app notifications for the signed-in user. The unread count polls on a
 * light interval for near-real-time badge updates; the full list is fetched on
 * demand (when the dropdown opens). All queries are disabled when logged out.
 */
export function useNotifications(open: boolean) {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const unread = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => api.notificationsUnread(token!),
    enabled: Boolean(token),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const list = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => api.notifications(token!),
    enabled: Boolean(token) && open,
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  const markRead = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id, token!),
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.markAllNotificationsRead(token!),
    onSuccess: invalidate,
  });

  return {
    unreadCount: unread.data?.count ?? 0,
    items: list.data ?? [],
    isLoading: list.isLoading,
    markRead: markRead.mutate,
    markAllRead: markAllRead.mutate,
  };
}
