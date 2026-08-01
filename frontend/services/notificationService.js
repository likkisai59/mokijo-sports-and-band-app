import { api } from "./api";

export const notificationService = {
  /**
   * Fetch paginated notifications for the current authenticated user.
   */
  getNotifications: async (
    page = 1,
    limit = 20,
    unread_only = false
  ) => {
    const response = await api.get("/notifications", {
      params: { page, limit, unread_only },
    });
    return response.data.data;
  },

  /**
   * Mark a single notification as read.
   */
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data.data;
  },

  /**
   * Mark all notifications as read for the current user.
   */
  markAllAsRead: async () => {
    await api.put("/notifications/read-all");
  },

  /**
   * Delete a single notification.
   */
  deleteNotification: async (notificationId) => {
    await api.delete(`/notifications/${notificationId}`);
  },
};
