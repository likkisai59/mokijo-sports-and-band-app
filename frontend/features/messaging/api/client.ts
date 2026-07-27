import { api } from "@/services/api";
import {
  Conversation,
  Message,
  CreateConversationPayload,
  SendMessagePayload,
  DownloadAttachmentResponse,
  MessageReaction,
  PresenceState,
  SearchMessagesResponse,
} from "../types";

export const messagingClient = {
  listConversations: async (): Promise<Conversation[]> => {
    const response = await api.get("/conversations");
    return response.data.data;
  },

  getConversation: async (id: string): Promise<Conversation> => {
    const response = await api.get(`/conversations/${id}`);
    return response.data.data;
  },

  createConversation: async (payload: CreateConversationPayload): Promise<Conversation> => {
    const response = await api.post("/conversations", payload);
    return response.data.data;
  },

  getMessages: async (conversationId: string, page = 1, limit = 50): Promise<Message[]> => {
    const response = await api.get(`/conversations/${conversationId}/messages`, {
      params: { page, limit },
    });
    return response.data.data;
  },

  sendMessage: async (conversationId: string, payload: SendMessagePayload): Promise<Message> => {
    const response = await api.post(`/conversations/${conversationId}/messages`, payload);
    return response.data.data;
  },

  sendAttachmentMessage: async (
    conversationId: string,
    file: File,
    content = "",
    replyToMessageId?: string,
    onProgress?: (percent: number) => void
  ): Promise<Message> => {
    const formData = new FormData();
    formData.append("file", file);
    if (content) formData.append("content", content);
    if (replyToMessageId) formData.append("reply_to_message_id", replyToMessageId);

    const response = await api.post(`/conversations/${conversationId}/messages/attachment`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data.data;
  },

  downloadAttachment: async (messageId: string): Promise<DownloadAttachmentResponse> => {
    const response = await api.get(`/messages/${messageId}/download`);
    return response.data.data;
  },

  markAsRead: async (conversationId: string): Promise<Message[]> => {
    const response = await api.post(`/conversations/${conversationId}/messages/read`);
    return response.data.data;
  },

  editMessage: async (messageId: string, content: string): Promise<Message> => {
    const response = await api.patch(`/messages/${messageId}`, { content });
    return response.data.data;
  },

  deleteMessage: async (messageId: string): Promise<Message> => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data.data;
  },

  forwardMessage: async (messageId: string, targetConversationId: string): Promise<Message> => {
    const response = await api.post(`/messages/${messageId}/forward`, {
      target_conversation_id: targetConversationId,
    });
    return response.data.data;
  },

  addReaction: async (messageId: string, emoji: string): Promise<MessageReaction> => {
    const response = await api.post(`/messages/${messageId}/reactions`, { emoji });
    return response.data.data;
  },

  removeReaction: async (messageId: string, emoji: string): Promise<boolean> => {
    const response = await api.delete(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
    return response.data.data;
  },

  sendTypingStatus: async (conversationId: string, isTyping: boolean): Promise<boolean> => {
    const response = await api.post(`/conversations/${conversationId}/typing`, { is_typing: isTyping });
    return response.data.data;
  },

  searchMessages: async (conversationId: string, query: string, page = 1, limit = 20): Promise<SearchMessagesResponse> => {
    const response = await api.get(`/conversations/${conversationId}/search`, {
      params: { query, page, limit },
    });
    return response.data.data;
  },

  pinMessage: async (messageId: string): Promise<boolean> => {
    const response = await api.post(`/messages/${messageId}/pin`);
    return response.data.data;
  },

  unpinMessage: async (conversationId: string): Promise<boolean> => {
    const response = await api.delete(`/conversations/${conversationId}/pin`);
    return response.data.data;
  },

  getUserPresence: async (userId: string): Promise<PresenceState> => {
    const response = await api.get(`/users/${userId}/presence`);
    return response.data.data;
  },
};
