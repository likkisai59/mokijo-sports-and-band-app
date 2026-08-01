import * as React from "react";
import { useNotificationsStore } from "./store";

export function useNotifications() {
  const {
    notifications,
    unreadCount,
    total,
    loading,
    error,
    filters,
    setFilters,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications
  } = useNotificationsStore();

  React.useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [filters, fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    total,
    loading,
    error,
    filters,
    setFilters,
    refresh: fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications
  };
}

export function useUnreadCount(pollIntervalMs = 30000) {
  const { unreadCount, fetchUnreadCount } = useNotificationsStore();

  React.useEffect(() => {
    fetchUnreadCount();

    if (pollIntervalMs > 0) {
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchUnreadCount, pollIntervalMs]);

  return unreadCount;
}
