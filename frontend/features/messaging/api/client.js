import { api } from "@/services/api";

export const messagingClient = {
  listConversations: async () => {
    const response = await api.get("/conversations");
    return response.data.data;
  },

  getConversation: async (id) => {
    const response = await api.get(`/conversations/${id}`);
    return response.data.data;
  },

  createConversation: async (payload) => {
    const response = await api.post("/conversations", payload);
    return response.data.data;
  },

  getMessages: async (conversationId, page = 1, limit = 50) => {
    const response = await api.get(`/conversations/${conversationId}/messages`, {
      params: { page, limit },
    });
    return response.data.data;
  },

  sendMessage: async (conversationId, payload) => {
    const response = await api.post(`/conversations/${conversationId}/messages`, payload);
    return response.data.data;
  },

  sendAttachmentMessage: async (
    conversationId,
    file,
    content = "",
    replyToMessageId,
    onProgress
  ) => {
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

  downloadAttachment: async (messageId) => {
    const response = await api.get(`/messages/${messageId}/download`);
    return response.data.data;
  },

  markAsRead: async (conversationId) => {
    const response = await api.post(`/conversations/${conversationId}/messages/read`);
    return response.data.data;
  },

  editMessage: async (messageId, content) => {
    const response = await api.patch(`/messages/${messageId}`, { content });
    return response.data.data;
  },

  deleteMessage: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data.data;
  },

  forwardMessage: async (messageId, targetConversationId) => {
    const response = await api.post(`/messages/${messageId}/forward`, {
      target_conversation_id: targetConversationId,
    });
    return response.data.data;
  },

  addReaction: async (messageId, emoji) => {
    const response = await api.post(`/messages/${messageId}/reactions`, { emoji });
    return response.data.data;
  },

  removeReaction: async (messageId, emoji) => {
    const response = await api.delete(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
    return response.data.data;
  },

  sendTypingStatus: async (conversationId, isTyping) => {
    const response = await api.post(`/conversations/${conversationId}/typing`, { is_typing: isTyping });
    return response.data.data;
  },

  searchMessages: async (conversationId, query, page = 1, limit = 20) => {
    const response = await api.get(`/conversations/${conversationId}/search`, {
      params: { query, page, limit },
    });
    return response.data.data;
  },

  pinMessage: async (messageId) => {
    const response = await api.post(`/messages/${messageId}/pin`);
    return response.data.data;
  },

  unpinMessage: async (conversationId) => {
    const response = await api.delete(`/conversations/${conversationId}/pin`);
    return response.data.data;
  },

  getUserPresence: async (userId) => {
    const response = await api.get(`/users/${userId}/presence`);
    return response.data.data;
  },
};
