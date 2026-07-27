export interface NotificationItem {
  id: string;
  user_id: string;
  recipient_user_id?: string | null;
  recipient_role?: string | null;
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string | null;
  notification_type?: string | null;
  link?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  metadata?: any;
  created_at: string;
  updated_at?: string | null;
}

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
  unread_only?: boolean;
  recipient_role?: string;
  notification_type?: string;
  reference_type?: string;
  target_user_id?: string;
}

export interface ListNotificationsResponse {
  notifications: NotificationItem[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
}

export interface SystemNotificationCreatePayload {
  recipient_user_id: string;
  recipient_role?: string;
  notification_type: string;
  title: string;
  message: string;
  reference_type?: string;
  reference_id?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  booking_enabled: boolean;
  payment_enabled: boolean;
  review_enabled: boolean;
  message_enabled: boolean;
  system_enabled: boolean;
  realtime_enabled: boolean;
  created_at: string;
  updated_at?: string | null;
}

