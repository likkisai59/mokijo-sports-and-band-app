import { create } from "zustand";
import { messagingClient } from "../api/client";
import toast from "react-hot-toast";

export const useMessagingStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  loadingConversations: false,
  loadingMessages: false,
  sendingMessage: false,
  error: null,
  searchQuery: "",
  mobileShowChat: false,

  replyingToMessage: null,
  editingMessage: null,
  forwardingMessage: null,

  uploadingAttachment: false,
  uploadProgress: 0,
  attachmentFile: null,
  uploadError: null,

  typingUsers: {},
  presenceMap: {},
  searchResults: [],
  selectedSearchIndex: -1,
  isSearching: false,
  messagesPage: 1,
  hasMoreMessages: true,
  loadingMoreMessages: false,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setMobileShowChat: (show) => set({ mobileShowChat: show }),
  setReplyingToMessage: (msg) => set({ replyingToMessage: msg }),
  setEditingMessage: (msg) => set({ editingMessage: msg }),
  setForwardingMessage: (msg) => set({ forwardingMessage: msg }),

  setAttachmentFile: (file) => set({ attachmentFile: file, uploadError: null, uploadProgress: 0 }),
  clearAttachment: () => set({ attachmentFile: null, uploadProgress: 0, uploadError: null }),

  fetchConversations: async () => {
    set({ loadingConversations: true, error: null });
    try {
      const data = await messagingClient.listConversations();
      set({ conversations: data, loadingConversations: false });
      
      const currentActive = get().activeConversation;
      if (!currentActive && data.length > 0) {
        get().selectConversation(data[0]);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to load conversations.";
      set({ error: msg, loadingConversations: false });
    }
  },

  selectConversation: async (conversation) => {
    set({
      activeConversation: conversation,
      mobileShowChat: true,
      replyingToMessage: null,
      editingMessage: null,
      attachmentFile: null,
      uploadProgress: 0,
      searchResults: [],
      selectedSearchIndex: -1,
      isSearching: false,
      messagesPage: 1,
      hasMoreMessages: true,
    });
    await get().fetchMessages(conversation.id);
    await get().markAsRead(conversation.id);
  },

  fetchMessages: async (conversationId) => {
    set({ loadingMessages: true, messagesPage: 1, hasMoreMessages: true });
    try {
      const data = await messagingClient.getMessages(conversationId, 1, 50);
      set({
        messages: data,
        loadingMessages: false,
        hasMoreMessages: data.length >= 50,
      });
    } catch {
      set({ loadingMessages: false });
    }
  },

  fetchOlderMessages: async () => {
    const { activeConversation, messagesPage, loadingMoreMessages, hasMoreMessages, messages } = get();
    if (!activeConversation || loadingMoreMessages || !hasMoreMessages) return;

    const nextPage = messagesPage + 1;
    set({ loadingMoreMessages: true });
    try {
      const olderData = await messagingClient.getMessages(activeConversation.id, nextPage, 50);
      if (olderData.length === 0) {
        set({ hasMoreMessages: false, loadingMoreMessages: false });
        return;
      }

      const existingIds = new Set(messages.map((m) => m.id));
      const filteredNew = olderData.filter((m) => !existingIds.has(m.id));

      set({
        messages: [...filteredNew, ...messages],
        messagesPage: nextPage,
        hasMoreMessages: olderData.length >= 50,
        loadingMoreMessages: false,
      });
    } catch {
      set({ loadingMoreMessages: false });
    }
  },

  sendMessage: async (conversationId, content, replyToMessageId) => {
    if (!content.trim()) return false;
    set({ sendingMessage: true });
    try {
      const newMsg = await messagingClient.sendMessage(conversationId, {
        content: content.trim(),
        reply_to_message_id: replyToMessageId,
      });
      
      get().handleIncomingMessage(newMsg);
      set({ sendingMessage: false, replyingToMessage: null });
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to send message.";
      toast.error(msg);
      set({ sendingMessage: false });
      return false;
    }
  },

  sendAttachmentMessage: async (
    conversationId,
    content = "",
    replyToMessageId
  ) => {
    const file = get().attachmentFile;
    if (!file) return false;

    set({ uploadingAttachment: true, uploadProgress: 0, uploadError: null });
    try {
      const newMsg = await messagingClient.sendAttachmentMessage(
        conversationId,
        file,
        content,
        replyToMessageId,
        (progress) => set({ uploadProgress: progress })
      );

      get().handleIncomingMessage(newMsg);
      set({
        uploadingAttachment: false,
        uploadProgress: 100,
        attachmentFile: null,
        replyingToMessage: null,
      });
      toast.success("Attachment sent successfully.");
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to upload attachment.";
      toast.error(msg);
      set({ uploadingAttachment: false, uploadProgress: 0, uploadError: msg });
      return false;
    }
  },

  markAsRead: async (conversationId) => {
    try {
      const readMsgs = await messagingClient.markAsRead(conversationId);
      if (readMsgs.length > 0) {
        const readIds = new Set(readMsgs.map((m) => m.id));
        set((state) => ({
          messages: state.messages.map((m) =>
            readIds.has(m.id) ? { ...m, read_at: m.read_at || new Date().toISOString() } : m
          ),
        }));
      }
    } catch {
      // Ignore background mark-as-read errors
    }
  },

  editMessage: async (messageId, content) => {
    if (!content.trim()) return false;
    try {
      const updated = await messagingClient.editMessage(messageId, content.trim());
      get().handleMessageUpdated(updated);
      set({ editingMessage: null });
      toast.success("Message edited.");
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to edit message.";
      toast.error(msg);
      return false;
    }
  },

  deleteMessage: async (messageId) => {
    try {
      const deleted = await messagingClient.deleteMessage(messageId);
      get().handleMessageDeleted(deleted);
      toast.success("Message deleted.");
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to delete message.";
      toast.error(msg);
      return false;
    }
  },

  forwardMessage: async (messageId, targetConversationId) => {
    try {
      const forwarded = await messagingClient.forwardMessage(messageId, targetConversationId);
      get().handleIncomingMessage(forwarded);
      set({ forwardingMessage: null });
      toast.success("Message forwarded successfully.");
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to forward message.";
      toast.error(msg);
      return false;
    }
  },

  createConversation: async (bookingId) => {
    set({ loadingConversations: true });
    try {
      const conversation = await messagingClient.createConversation({ booking_id: bookingId });
      toast.success("Conversation created.");
      
      await get().fetchConversations();
      await get().selectConversation(conversation);
      
      return conversation;
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to start conversation.";
      if (msg.includes("already exists")) {
        const conversations = get().conversations;
        const existing = conversations.find((c) => c.booking_id === bookingId);
        if (existing) {
          await get().selectConversation(existing);
          set({ loadingConversations: false });
          return existing;
        }
      }
      toast.error(msg);
      set({ loadingConversations: false });
      return null;
    }
  },

  // ── Phase 6 Advanced Features Actions ───────────────────────────────────

  addReaction: async (messageId, emoji) => {
    try {
      const reaction = await messagingClient.addReaction(messageId, emoji);
      get().handleReactionAdded({
        message_id: messageId,
        id: reaction.id,
        user_id: reaction.user_id,
        emoji: reaction.emoji,
        created_at: reaction.created_at,
      });
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to add reaction.";
      toast.error(msg);
      return false;
    }
  },

  removeReaction: async (messageId, emoji) => {
    try {
      await messagingClient.removeReaction(messageId, emoji);
      get().handleReactionRemoved({
        message_id: messageId,
        id: "",
        user_id: "",
        emoji: emoji,
      });
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to remove reaction.";
      toast.error(msg);
      return false;
    }
  },

  sendTypingStatus: async (isTyping) => {
    const activeConv = get().activeConversation;
    if (!activeConv) return;
    try {
      await messagingClient.sendTypingStatus(activeConv.id, isTyping);
    } catch {
      // Ignore background typing errors
    }
  },

  fetchUserPresence: async (userId) => {
    try {
      const presence = await messagingClient.getUserPresence(userId);
      set((state) => ({
        presenceMap: {
          ...state.presenceMap,
          [userId]: presence,
        },
      }));
    } catch {
      // Ignore background presence fetch errors
    }
  },

  searchMessages: async (query) => {
    const activeConv = get().activeConversation;
    if (!activeConv || !query.trim()) return;

    set({ isSearching: true });
    try {
      const res = await messagingClient.searchMessages(activeConv.id, query.trim());
      set({
        searchResults: res.messages,
        selectedSearchIndex: res.messages.length > 0 ? 0 : -1,
        isSearching: false,
      });
    } catch (err) {
      toast.error("Search failed.");
      set({ isSearching: false, searchResults: [], selectedSearchIndex: -1 });
    }
  },

  clearSearch: () => set({ searchResults: [], selectedSearchIndex: -1, isSearching: false }),

  navigateSearchResult: (direction) => {
    const { searchResults, selectedSearchIndex } = get();
    if (searchResults.length === 0) return;

    let nextIndex = direction === "next" ? selectedSearchIndex + 1 : selectedSearchIndex - 1;
    if (nextIndex >= searchResults.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = searchResults.length - 1;

    set({ selectedSearchIndex: nextIndex });
  },

  pinMessage: async (messageId) => {
    try {
      await messagingClient.pinMessage(messageId);
      const activeConv = get().activeConversation;
      const targetMsg = get().messages.find((m) => m.id === messageId);
      if (activeConv && targetMsg) {
        get().handleMessagePinned({
          conversation_id: activeConv.id,
          message_id: messageId,
          message: targetMsg,
        });
      }
      toast.success("Message pinned.");
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to pin message.";
      toast.error(msg);
      return false;
    }
  },

  unpinMessage: async () => {
    const activeConv = get().activeConversation;
    if (!activeConv) return false;

    try {
      await messagingClient.unpinMessage(activeConv.id);
      get().handleMessageUnpinned({ conversation_id: activeConv.id });
      toast.success("Message unpinned.");
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to unpin message.";
      toast.error(msg);
      return false;
    }
  },

  // ── Handlers for Incoming Realtime WS Events ───────────────────────────

  handleIncomingMessage: (newMsg) => {
    const { activeConversation, messages, conversations } = get();

    if (messages.some((m) => m.id === newMsg.id)) {
      return;
    }

    let updatedMessages = messages;
    if (activeConversation && activeConversation.id === newMsg.conversation_id) {
      updatedMessages = [...messages, newMsg];
    }

    const convIndex = conversations.findIndex((c) => c.id === newMsg.conversation_id);
    let updatedConversations = [...conversations];

    if (convIndex !== -1) {
      const targetConv = {
        ...conversations[convIndex],
        last_message_at: newMsg.created_at,
      };
      updatedConversations.splice(convIndex, 1);
      updatedConversations.unshift(targetConv);
    }

    set({
      messages: updatedMessages,
      conversations: updatedConversations,
    });
  },

  handleMessageUpdated: (updatedMsg) => {
    set((state) => ({
      messages: state.messages.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)),
    }));
  },

  handleMessageDeleted: (deletedMsg) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === deletedMsg.id
          ? {
              ...m,
              is_deleted: true,
              content: "This message was deleted.",
              edited_at: null,
            }
          : m
      ),
    }));
  },

  handleMessageRead: (payload) => {
    const { activeConversation } = get();
    if (!activeConversation || activeConversation.id !== payload.conversation_id) return;

    const readSet = new Set(payload.message_ids);
    set((state) => ({
      messages: state.messages.map((m) =>
        readSet.has(m.id) ? { ...m, read_at: payload.read_at } : m
      ),
    }));
  },

  handleConversationUpdated: (data) => {
    const { conversations, activeConversation } = get();
    const convIndex = conversations.findIndex((c) => c.id === data.id);
    if (convIndex === -1) return;

    const updatedConversations = [...conversations];
    const targetConv = {
      ...conversations[convIndex],
      last_message_at: data.last_message_at || conversations[convIndex].last_message_at,
      status: data.status ? data.status : conversations[convIndex].status,
      pinned_message_id: data.pinned_message_id !== undefined ? data.pinned_message_id : conversations[convIndex].pinned_message_id,
    };

    updatedConversations.splice(convIndex, 1);
    updatedConversations.unshift(targetConv);

    let updatedActive = activeConversation;
    if (activeConversation && activeConversation.id === data.id) {
      updatedActive = { ...targetConv };
    }

    set({ conversations: updatedConversations, activeConversation: updatedActive });
  },

  handleReactionAdded: (payload) => {
    set((state) => ({
      messages: state.messages.map((m) => {
        if (m.id !== payload.message_id) return m;
        const currentReactions = m.reactions || [];
        if (currentReactions.some((r) => r.user_id === payload.user_id && r.emoji === payload.emoji)) {
          return m;
        }
        const newReaction = {
          id: payload.id,
          message_id: payload.message_id,
          user_id: payload.user_id,
          emoji: payload.emoji,
          created_at: payload.created_at,
        };
        return { ...m, reactions: [...currentReactions, newReaction] };
      }),
    }));
  },

  handleReactionRemoved: (payload) => {
    set((state) => ({
      messages: state.messages.map((m) => {
        if (m.id !== payload.message_id) return m;
        const currentReactions = m.reactions || [];
        return {
          ...m,
          reactions: currentReactions.filter(
            (r) => !(r.emoji === payload.emoji && (payload.user_id ? r.user_id === payload.user_id : true))
          ),
        };
      }),
    }));
  },

  handleTypingStarted: (payload) => {
    const now = Date.now();
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [payload.user_id]: {
          userId: payload.user_id,
          userName: payload.user_name,
          expiresAt: now + 4000,
        },
      },
    }));
  },

  handleTypingStopped: (payload) => {
    set((state) => {
      const nextMap = { ...state.typingUsers };
      delete nextMap[payload.user_id];
      return { typingUsers: nextMap };
    });
  },

  handlePresenceOnline: (payload) => {
    set((state) => ({
      presenceMap: {
        ...state.presenceMap,
        [payload.user_id]: {
          user_id: payload.user_id,
          is_online: true,
          last_seen: null,
        },
      },
    }));
  },

  handlePresenceOffline: (payload) => {
    set((state) => ({
      presenceMap: {
        ...state.presenceMap,
        [payload.user_id]: {
          user_id: payload.user_id,
          is_online: false,
          last_seen: payload.last_seen || new Date().toISOString(),
        },
      },
    }));
  },

  handleMessagePinned: (payload) => {
    const { activeConversation, conversations } = get();
    const updatedConversations = conversations.map((c) =>
      c.id === payload.conversation_id ? { ...c, pinned_message_id: payload.message_id, pinned_message: payload.message } : c
    );

    let updatedActive = activeConversation;
    if (activeConversation && activeConversation.id === payload.conversation_id) {
      updatedActive = {
        ...activeConversation,
        pinned_message_id: payload.message_id,
        pinned_message: payload.message,
      };
    }

    set({ conversations: updatedConversations, activeConversation: updatedActive });
  },

  handleMessageUnpinned: (payload) => {
    const { activeConversation, conversations } = get();
    const updatedConversations = conversations.map((c) =>
      c.id === payload.conversation_id ? { ...c, pinned_message_id: null, pinned_message: null } : c
    );

    let updatedActive = activeConversation;
    if (activeConversation && activeConversation.id === payload.conversation_id) {
      updatedActive = {
        ...activeConversation,
        pinned_message_id: null,
        pinned_message: null,
      };
    }

    set({ conversations: updatedConversations, activeConversation: updatedActive });
  },
}));
