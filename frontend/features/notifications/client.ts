import { api } from "@/services/api";
import {
  ListNotificationsParams,
  ListNotificationsResponse,
  NotificationItem,
  SystemNotificationCreatePayload,
  NotificationPreference
} from "./types";

export const notificationsClient = {
  listNotifications: async (params: ListNotificationsParams): Promise<ListNotificationsResponse> => {
    const response = await api.get("/notifications", { params });
    return response.data.data;
  },

  getUnreadCount: async (targetUserId?: string): Promise<number> => {
    const response = await api.get("/notifications/unread-count", {
      params: targetUserId ? { target_user_id: targetUserId } : undefined
    });
    return response.data.data.unread_count;
  },

  getNotificationDetails: async (notificationId: string): Promise<NotificationItem> => {
    const response = await api.get(`/notifications/${notificationId}`);
    return response.data.data;
  },

  markRead: async (notificationId: string): Promise<NotificationItem> => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data.data;
  },

  markAllRead: async (targetUserId?: string): Promise<void> => {
    await api.patch("/notifications/read-all", null, {
      params: targetUserId ? { target_user_id: targetUserId } : undefined
    });
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
  },

  bulkDeleteNotifications: async (targetUserId?: string): Promise<void> => {
    await api.delete("/notifications", {
      params: targetUserId ? { target_user_id: targetUserId } : undefined
    });
  },

  createSystemNotification: async (payload: SystemNotificationCreatePayload): Promise<NotificationItem> => {
    const response = await api.post("/notifications", payload);
    return response.data.data;
  },

  getPreferences: async (): Promise<NotificationPreference> => {
    const response = await api.get("/notifications/preferences");
    return response.data.data;
  },

  updatePreferences: async (payload: Partial<NotificationPreference>): Promise<NotificationPreference> => {
    const response = await api.patch("/notifications/preferences", payload);
    return response.data.data;
  }
};
