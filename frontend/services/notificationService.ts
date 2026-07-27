import { api } from "./api";

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  notification_type?: string;
  link?: string;
  created_at: string;
}

export interface NotificationsListResponse {
  notifications: NotificationItem[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
}

export const notificationService = {
  /**
   * Fetch paginated notifications for the current authenticated user.
   */
  getNotifications: async (
    page: number = 1,
    limit: number = 20,
    unread_only: boolean = false
  ): Promise<NotificationsListResponse> => {
    const response = await api.get<any>("/notifications", {
      params: { page, limit, unread_only },
    });
    return response.data.data;
  },

  /**
   * Mark a single notification as read.
   */
  markAsRead: async (notificationId: string): Promise<NotificationItem> => {
    const response = await api.put<any>(`/notifications/${notificationId}/read`);
    return response.data.data;
  },

  /**
   * Mark all notifications as read for the current user.
   */
  markAllAsRead: async (): Promise<void> => {
    await api.put<any>("/notifications/read-all");
  },

  /**
   * Delete a single notification.
   */
  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete<any>(`/notifications/${notificationId}`);
  },
};
