import { create } from "zustand";
import { notificationsClient } from "./client";
import { ListNotificationsParams, NotificationItem, NotificationPreference } from "./types";


interface NotificationsState {
  notifications: NotificationItem[];
  unreadCount: number;
  total: number;
  loading: boolean;
  error: string | null;
  filters: ListNotificationsParams;
  wsConnected: boolean;
  preferences: NotificationPreference | null;
  setFilters: (filters: Partial<ListNotificationsParams>) => void;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  setWsConnected: (connected: boolean) => void;
  addRealtimeNotification: (notification: NotificationItem) => void;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreference>) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  loading: false,
  error: null,
  wsConnected: false,
  preferences: null,
  filters: {
    page: 1,
    limit: 10,
    unread_only: false
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
    get().fetchNotifications();
  },

  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const response = await notificationsClient.listNotifications(get().filters);
      set({
        notifications: response.notifications,
        total: response.total,
        unreadCount: response.unread_count,
        loading: false
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to load notifications.",
        loading: false
      });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await notificationsClient.getUnreadCount();
      set({ unreadCount: count });
    } catch (err) {
      console.error("Failed to fetch unread notifications count:", err);
    }
  },

  markAsRead: async (id) => {
    try {
      await notificationsClient.markRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (err) {
      console.error(`Failed to mark notification ${id} as read:`, err);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsClient.markAllRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          is_read: true,
          read_at: new Date().toISOString()
        })),
        unreadCount: 0
      }));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  },

  deleteNotification: async (id) => {
    try {
      const wasUnread = get().notifications.find((n) => n.id === id)?.is_read === false;
      await notificationsClient.deleteNotification(id);
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        total: Math.max(0, state.total - 1),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      }));
    } catch (err) {
      console.error(`Failed to delete notification ${id}:`, err);
    }
  },

  clearNotifications: async () => {
    try {
      await notificationsClient.bulkDeleteNotifications();
      set({
        notifications: [],
        total: 0,
        unreadCount: 0
      });
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  },

  setWsConnected: (connected) => {
    set({ wsConnected: connected });
  },

  addRealtimeNotification: (notification) => {
    const exists = get().notifications.some((n) => n.id === notification.id);
    if (exists) return;

    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
      total: state.total + 1
    }));
  },

  fetchPreferences: async () => {
    set({ loading: true, error: null });
    try {
      const prefs = await notificationsClient.getPreferences();
      set({ preferences: prefs, loading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to load notification preferences.",
        loading: false
      });
    }
  },

  updatePreferences: async (newPrefs) => {
    set({ loading: true, error: null });
    try {
      const updated = await notificationsClient.updatePreferences(newPrefs);
      set({ preferences: updated, loading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to update notification preferences.",
        loading: false
      });
      throw err;
    }
  }
}));
