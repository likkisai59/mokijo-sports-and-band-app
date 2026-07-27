import { useEffect } from "react";
import { useMessagingStore } from "../store/messaging-store";
import { notificationWs } from "@/features/notifications/websocket";

export function useMessaging() {
  const {
    conversations,
    activeConversation,
    messages,
    loadingConversations,
    loadingMessages,
    sendingMessage,
    error,
    searchQuery,
    mobileShowChat,
    replyingToMessage,
    editingMessage,
    forwardingMessage,
    uploadingAttachment,
    uploadProgress,
    attachmentFile,
    uploadError,
    typingUsers,
    presenceMap,
    searchResults,
    selectedSearchIndex,
    isSearching,
    messagesPage,
    hasMoreMessages,
    loadingMoreMessages,
    fetchConversations,
    selectConversation,
    fetchMessages,
    fetchOlderMessages,
    sendMessage,
    sendAttachmentMessage,
    markAsRead,
    editMessage,
    deleteMessage,
    forwardMessage,
    createConversation,
    addReaction,
    removeReaction,
    sendTypingStatus,
    fetchUserPresence,
    searchMessages,
    clearSearch,
    navigateSearchResult,
    pinMessage,
    unpinMessage,
    setSearchQuery,
    setMobileShowChat,
    setReplyingToMessage,
    setEditingMessage,
    setForwardingMessage,
    setAttachmentFile,
    clearAttachment,
    handleIncomingMessage,
    handleMessageUpdated,
    handleMessageDeleted,
    handleMessageRead,
    handleConversationUpdated,
    handleReactionAdded,
    handleReactionRemoved,
    handleTypingStarted,
    handleTypingStopped,
    handlePresenceOnline,
    handlePresenceOffline,
    handleMessagePinned,
    handleMessageUnpinned,
  } = useMessagingStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Subscribe to real-time messaging WebSocket events over existing notificationWs connection
  useEffect(() => {
    const unsubscribe = notificationWs.onMessagingEvent((eventData) => {
      if (eventData.type === "messaging") {
        const { event, data } = eventData;
        if (!data) return;

        if (event === "message.created" || event === "message.replied" || event === "message.forwarded") {
          handleIncomingMessage(data);
        } else if (event === "message.updated") {
          handleMessageUpdated(data);
        } else if (event === "message.deleted") {
          handleMessageDeleted(data);
        } else if (event === "message.read") {
          handleMessageRead(data);
        } else if (event === "conversation.updated") {
          handleConversationUpdated(data);
        } else if (event === "message.reaction_added") {
          handleReactionAdded(data);
        } else if (event === "message.reaction_removed") {
          handleReactionRemoved(data);
        } else if (event === "typing.started") {
          handleTypingStarted(data);
        } else if (event === "typing.stopped") {
          handleTypingStopped(data);
        } else if (event === "presence.online") {
          handlePresenceOnline(data);
        } else if (event === "presence.offline") {
          handlePresenceOffline(data);
        } else if (event === "message.pinned") {
          handleMessagePinned(data);
        } else if (event === "message.unpinned") {
          handleMessageUnpinned(data);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [
    handleIncomingMessage,
    handleMessageUpdated,
    handleMessageDeleted,
    handleMessageRead,
    handleConversationUpdated,
    handleReactionAdded,
    handleReactionRemoved,
    handleTypingStarted,
    handleTypingStopped,
    handlePresenceOnline,
    handlePresenceOffline,
    handleMessagePinned,
    handleMessageUnpinned,
  ]);

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.event_name && c.event_name.toLowerCase().includes(q)) ||
      c.booking_id.toLowerCase().includes(q)
    );
  });

  return {
    conversations: filteredConversations,
    allConversations: conversations,
    activeConversation,
    messages,
    loadingConversations,
    loadingMessages,
    sendingMessage,
    error,
    searchQuery,
    mobileShowChat,
    replyingToMessage,
    editingMessage,
    forwardingMessage,
    uploadingAttachment,
    uploadProgress,
    attachmentFile,
    uploadError,
    typingUsers,
    presenceMap,
    searchResults,
    selectedSearchIndex,
    isSearching,
    messagesPage,
    hasMoreMessages,
    loadingMoreMessages,
    fetchConversations,
    selectConversation,
    fetchMessages,
    fetchOlderMessages,
    sendMessage,
    sendAttachmentMessage,
    markAsRead,
    editMessage,
    deleteMessage,
    forwardMessage,
    createConversation,
    addReaction,
    removeReaction,
    sendTypingStatus,
    fetchUserPresence,
    searchMessages,
    clearSearch,
    navigateSearchResult,
    pinMessage,
    unpinMessage,
    setSearchQuery,
    setMobileShowChat,
    setReplyingToMessage,
    setEditingMessage,
    setForwardingMessage,
    setAttachmentFile,
    clearAttachment,
  };
}
