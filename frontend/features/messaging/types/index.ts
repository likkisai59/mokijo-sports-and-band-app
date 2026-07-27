export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  booking_id: string;
  client_id: string;
  band_id: string;
  venue_owner_id?: string | null;
  pinned_message_id?: string | null;
  status: "ACTIVE" | "CLOSED";
  last_message_at?: string | null;
  created_at: string;
  updated_at: string;
  event_name?: string;
  pinned_message?: Message | null;
}

export type MessageType = "TEXT" | "IMAGE" | "DOCUMENT" | "VIDEO" | "AUDIO" | "FILE";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: MessageType;
  content: string;
  reply_to_message_id?: string | null;
  edited_at?: string | null;
  read_at?: string | null;
  is_deleted?: boolean;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
  attachment_type?: string | null;
  thumbnail_url?: string | null;
  reactions?: MessageReaction[];
  created_at: string;
  updated_at: string;
}

export interface CreateConversationPayload {
  booking_id: string;
}

export interface SendMessagePayload {
  content: string;
  reply_to_message_id?: string | null;
}

export interface DownloadAttachmentResponse {
  attachment_url: string;
  attachment_name: string;
  attachment_size: number;
  attachment_type: string;
}

export interface PresenceState {
  user_id: string;
  is_online: boolean;
  last_seen?: string | null;
}

export interface SearchMessagesResponse {
  total: number;
  page: number;
  limit: number;
  messages: Message[];
}
