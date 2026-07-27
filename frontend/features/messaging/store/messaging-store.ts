import { create } from "zustand";
import { Conversation, Message, MessageReaction, PresenceState } from "../types";
import { messagingClient } from "../api/client";
import toast from "react-hot-toast";

interface TypingUser {
  userId: string;
  userName: string;
  expiresAt: number;
}

interface MessagingState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  loadingConversations: boolean;
  loadingMessages: boolean;
  sendingMessage: boolean;
  error: string | null;
  searchQuery: string;
  mobileShowChat: boolean;

  replyingToMessage: Message | null;
  editingMessage: Message | null;
  forwardingMessage: Message | null;

  uploadingAttachment: boolean;
  uploadProgress: number;
  attachmentFile: File | null;
  uploadError: string | null;

  // Phase 6 Advanced Features State
  typingUsers: Record<string, TypingUser>; // key: userId
  presenceMap: Record<string, PresenceState>; // key: userId
  searchResults: Message[];
  selectedSearchIndex: number;
  isSearching: boolean;
  messagesPage: number;
  hasMoreMessages: boolean;
  loadingMoreMessages: boolean;

  fetchConversations: () => Promise<void>;
  selectConversation: (conversation: Conversation) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  fetchOlderMessages: () => Promise<void>;
  sendMessage: (conversationId: string, content: string, replyToMessageId?: string) => Promise<boolean>;
  sendAttachmentMessage: (conversationId: string, content?: string, replyToMessageId?: string) => Promise<boolean>;
  markAsRead: (conversationId: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  forwardMessage: (messageId: string, targetConversationId: string) => Promise<boolean>;
  createConversation: (bookingId: string) => Promise<Conversation | null>;

  addReaction: (messageId: string, emoji: string) => Promise<boolean>;
  removeReaction: (messageId: string, emoji: string) => Promise<boolean>;
  sendTypingStatus: (isTyping: boolean) => Promise<void>;
  fetchUserPresence: (userId: string) => Promise<void>;
  searchMessages: (query: string) => Promise<void>;
  clearSearch: () => void;
  navigateSearchResult: (direction: "next" | "prev") => void;
  pinMessage: (messageId: string) => Promise<boolean>;
  unpinMessage: () => Promise<boolean>;

  setSearchQuery: (query: string) => void;
  setMobileShowChat: (show: boolean) => void;
  setReplyingToMessage: (msg: Message | null) => void;
  setEditingMessage: (msg: Message | null) => void;
  setForwardingMessage: (msg: Message | null) => void;
  setAttachmentFile: (file: File | null) => void;
  clearAttachment: () => void;

  handleIncomingMessage: (message: Message) => void;
  handleMessageUpdated: (message: Message) => void;
  handleMessageDeleted: (message: Message) => void;
  handleMessageRead: (payload: { conversation_id: string; read_at: string; message_ids: string[] }) => void;
  handleConversationUpdated: (data: { id: string; last_message_at: string; status?: string; pinned_message_id?: string | null }) => void;
  handleReactionAdded: (payload: { message_id: string; id: string; user_id: string; emoji: string; created_at: string }) => void;
  handleReactionRemoved: (payload: { message_id: string; id: string; user_id: string; emoji: string }) => void;
  handleTypingStarted: (payload: { conversation_id: string; user_id: string; user_name: string }) => void;
  handleTypingStopped: (payload: { conversation_id: string; user_id: string }) => void;
  handlePresenceOnline: (payload: { user_id: string }) => void;
  handlePresenceOffline: (payload: { user_id: string; last_seen?: string | null }) => void;
  handleMessagePinned: (payload: { conversation_id: string; message_id: string; message: Message }) => void;
  handleMessageUnpinned: (payload: { conversation_id: string }) => void;
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
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

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setMobileShowChat: (show: boolean) => set({ mobileShowChat: show }),
  setReplyingToMessage: (msg: Message | null) => set({ replyingToMessage: msg }),
  setEditingMessage: (msg: Message | null) => set({ editingMessage: msg }),
  setForwardingMessage: (msg: Message | null) => set({ forwardingMessage: msg }),

  setAttachmentFile: (file: File | null) => set({ attachmentFile: file, uploadError: null, uploadProgress: 0 }),
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
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to load conversations.";
      set({ error: msg, loadingConversations: false });
    }
  },

  selectConversation: async (conversation: Conversation) => {
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

  fetchMessages: async (conversationId: string) => {
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

  sendMessage: async (conversationId: string, content: string, replyToMessageId?: string): Promise<boolean> => {
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
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to send message.";
      toast.error(msg);
      set({ sendingMessage: false });
      return false;
    }
  },

  sendAttachmentMessage: async (
    conversationId: string,
    content = "",
    replyToMessageId?: string
  ): Promise<boolean> => {
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
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to upload attachment.";
      toast.error(msg);
      set({ uploadingAttachment: false, uploadProgress: 0, uploadError: msg });
      return false;
    }
  },

  markAsRead: async (conversationId: string) => {
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

  editMessage: async (messageId: string, content: string): Promise<boolean> => {
    if (!content.trim()) return false;
    try {
      const updated = await messagingClient.editMessage(messageId, content.trim());
      get().handleMessageUpdated(updated);
      set({ editingMessage: null });
      toast.success("Message edited.");
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to edit message.";
      toast.error(msg);
      return false;
    }
  },

  deleteMessage: async (messageId: string): Promise<boolean> => {
    try {
      const deleted = await messagingClient.deleteMessage(messageId);
      get().handleMessageDeleted(deleted);
      toast.success("Message deleted.");
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to delete message.";
      toast.error(msg);
      return false;
    }
  },

  forwardMessage: async (messageId: string, targetConversationId: string): Promise<boolean> => {
    try {
      const forwarded = await messagingClient.forwardMessage(messageId, targetConversationId);
      get().handleIncomingMessage(forwarded);
      set({ forwardingMessage: null });
      toast.success("Message forwarded successfully.");
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to forward message.";
      toast.error(msg);
      return false;
    }
  },

  createConversation: async (bookingId: string): Promise<Conversation | null> => {
    set({ loadingConversations: true });
    try {
      const conversation = await messagingClient.createConversation({ booking_id: bookingId });
      toast.success("Conversation created.");
      
      await get().fetchConversations();
      await get().selectConversation(conversation);
      
      return conversation;
    } catch (err: any) {
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

  addReaction: async (messageId: string, emoji: string): Promise<boolean> => {
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
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to add reaction.";
      toast.error(msg);
      return false;
    }
  },

  removeReaction: async (messageId: string, emoji: string): Promise<boolean> => {
    try {
      await messagingClient.removeReaction(messageId, emoji);
      get().handleReactionRemoved({
        message_id: messageId,
        id: "",
        user_id: "",
        emoji: emoji,
      });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to remove reaction.";
      toast.error(msg);
      return false;
    }
  },

  sendTypingStatus: async (isTyping: boolean) => {
    const activeConv = get().activeConversation;
    if (!activeConv) return;
    try {
      await messagingClient.sendTypingStatus(activeConv.id, isTyping);
    } catch {
      // Ignore background typing errors
    }
  },

  fetchUserPresence: async (userId: string) => {
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

  searchMessages: async (query: string) => {
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
    } catch (err: any) {
      toast.error("Search failed.");
      set({ isSearching: false, searchResults: [], selectedSearchIndex: -1 });
    }
  },

  clearSearch: () => set({ searchResults: [], selectedSearchIndex: -1, isSearching: false }),

  navigateSearchResult: (direction: "next" | "prev") => {
    const { searchResults, selectedSearchIndex } = get();
    if (searchResults.length === 0) return;

    let nextIndex = direction === "next" ? selectedSearchIndex + 1 : selectedSearchIndex - 1;
    if (nextIndex >= searchResults.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = searchResults.length - 1;

    set({ selectedSearchIndex: nextIndex });
  },

  pinMessage: async (messageId: string): Promise<boolean> => {
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
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to pin message.";
      toast.error(msg);
      return false;
    }
  },

  unpinMessage: async (): Promise<boolean> => {
    const activeConv = get().activeConversation;
    if (!activeConv) return false;

    try {
      await messagingClient.unpinMessage(activeConv.id);
      get().handleMessageUnpinned({ conversation_id: activeConv.id });
      toast.success("Message unpinned.");
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to unpin message.";
      toast.error(msg);
      return false;
    }
  },

  // ── Handlers for Incoming Realtime WS Events ───────────────────────────

  handleIncomingMessage: (newMsg: Message) => {
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

  handleMessageUpdated: (updatedMsg: Message) => {
    set((state) => ({
      messages: state.messages.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)),
    }));
  },

  handleMessageDeleted: (deletedMsg: Message) => {
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

  handleMessageRead: (payload: { conversation_id: string; read_at: string; message_ids: string[] }) => {
    const { activeConversation } = get();
    if (!activeConversation || activeConversation.id !== payload.conversation_id) return;

    const readSet = new Set(payload.message_ids);
    set((state) => ({
      messages: state.messages.map((m) =>
        readSet.has(m.id) ? { ...m, read_at: payload.read_at } : m
      ),
    }));
  },

  handleConversationUpdated: (data: { id: string; last_message_at: string; status?: string; pinned_message_id?: string | null }) => {
    const { conversations, activeConversation } = get();
    const convIndex = conversations.findIndex((c) => c.id === data.id);
    if (convIndex === -1) return;

    const updatedConversations = [...conversations];
    const targetConv = {
      ...conversations[convIndex],
      last_message_at: data.last_message_at || conversations[convIndex].last_message_at,
      status: data.status ? (data.status as any) : conversations[convIndex].status,
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

  handleReactionAdded: (payload: { message_id: string; id: string; user_id: string; emoji: string; created_at: string }) => {
    set((state) => ({
      messages: state.messages.map((m) => {
        if (m.id !== payload.message_id) return m;
        const currentReactions = m.reactions || [];
        if (currentReactions.some((r) => r.user_id === payload.user_id && r.emoji === payload.emoji)) {
          return m;
        }
        const newReaction: MessageReaction = {
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

  handleReactionRemoved: (payload: { message_id: string; id: string; user_id: string; emoji: string }) => {
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

  handleTypingStarted: (payload: { conversation_id: string; user_id: string; user_name: string }) => {
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

  handleTypingStopped: (payload: { conversation_id: string; user_id: string }) => {
    set((state) => {
      const nextMap = { ...state.typingUsers };
      delete nextMap[payload.user_id];
      return { typingUsers: nextMap };
    });
  },

  handlePresenceOnline: (payload: { user_id: string }) => {
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

  handlePresenceOffline: (payload: { user_id: string; last_seen?: string | null }) => {
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

  handleMessagePinned: (payload: { conversation_id: string; message_id: string; message: Message }) => {
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

  handleMessageUnpinned: (payload: { conversation_id: string }) => {
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
