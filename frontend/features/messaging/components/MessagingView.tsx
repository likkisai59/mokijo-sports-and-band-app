"use client";

import React, { useEffect } from "react";
import { useMessaging } from "../hooks/use-messaging";
import { ConversationSidebar } from "./ConversationSidebar";
import { ChatWindow } from "./ChatWindow";
import { MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function MessagingView() {
  const { user } = useAuth();
  const {
    conversations,
    allConversations,
    activeConversation,
    messages,
    loadingConversations,
    loadingMessages,
    sendingMessage,
    searchQuery,
    mobileShowChat,
    replyingToMessage,
    editingMessage,
    forwardingMessage,
    uploadingAttachment,
    uploadProgress,
    attachmentFile,
    typingUsers,
    presenceMap,
    searchResults,
    selectedSearchIndex,
    hasMoreMessages,
    loadingMoreMessages,
    fetchConversations,
    selectConversation,
    fetchOlderMessages,
    sendMessage,
    sendAttachmentMessage,
    editMessage,
    deleteMessage,
    forwardMessage,
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
  } = useMessaging();

  // Find other participant ID in active conversation for presence check
  const otherParticipantId = React.useMemo(() => {
    if (!activeConversation || !user) return null;
    if (activeConversation.client_id !== user.id) return activeConversation.client_id;
    if (activeConversation.band_id !== user.id) return activeConversation.band_id;
    if (activeConversation.venue_owner_id && activeConversation.venue_owner_id !== user.id) {
      return activeConversation.venue_owner_id;
    }
    return null;
  }, [activeConversation, user]);

  // Fetch presence when active conversation participant changes
  useEffect(() => {
    if (otherParticipantId) {
      fetchUserPresence(otherParticipantId);
    }
  }, [otherParticipantId, fetchUserPresence]);

  // Derive typing user text
  const typingText = React.useMemo(() => {
    if (!activeConversation) return null;
    const now = Date.now();
    const activeTypers = Object.values(typingUsers).filter(
      (t) => t.expiresAt > now && t.userId !== user?.id
    );
    if (activeTypers.length === 0) return null;
    if (activeTypers.length === 1) return `${activeTypers[0].userName} is typing...`;
    return "Multiple people are typing...";
  }, [typingUsers, activeConversation, user?.id]);

  const activePresence = otherParticipantId ? presenceMap[otherParticipantId] : null;

  // Active conversation pinned message lookup
  const pinnedMessage = React.useMemo(() => {
    if (!activeConversation) return null;
    if (activeConversation.pinned_message) return activeConversation.pinned_message;
    if (activeConversation.pinned_message_id) {
      return messages.find((m) => m.id === activeConversation.pinned_message_id) || null;
    }
    return null;
  }, [activeConversation, messages]);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Messages & Conversations
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Booking-centric messaging workspace for active event agreements.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchConversations()}
          disabled={loadingConversations}
          className="h-8 text-xs font-bold gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loadingConversations ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Main Responsive Chat Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[620px]">
        {/* Left Column: Sidebar */}
        <div
          className={`h-full md:col-span-4 ${
            mobileShowChat ? "hidden md:block" : "block"
          }`}
        >
          <ConversationSidebar
            conversations={conversations}
            activeConversation={activeConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelect={selectConversation}
            loading={loadingConversations}
          />
        </div>

        {/* Right Column: Chat Window */}
        <div
          className={`h-full md:col-span-8 ${
            !mobileShowChat ? "hidden md:block" : "block"
          }`}
        >
          <ChatWindow
            conversation={activeConversation}
            conversations={allConversations}
            messages={messages}
            loadingMessages={loadingMessages}
            sendingMessage={sendingMessage}
            hasMoreMessages={hasMoreMessages}
            loadingMoreMessages={loadingMoreMessages}
            replyingToMessage={replyingToMessage}
            editingMessage={editingMessage}
            forwardingMessage={forwardingMessage}
            attachmentFile={attachmentFile}
            uploadingAttachment={uploadingAttachment}
            uploadProgress={uploadProgress}
            typingText={typingText}
            presenceInfo={activePresence}
            pinnedMessage={pinnedMessage}
            searchResultCount={searchResults.length}
            currentSearchIndex={selectedSearchIndex}
            onSendMessage={(content, replyToId) =>
              activeConversation
                ? sendMessage(activeConversation.id, content, replyToId)
                : Promise.resolve(false)
            }
            onSendAttachmentMessage={(content, replyToId) =>
              activeConversation
                ? sendAttachmentMessage(activeConversation.id, content, replyToId)
                : Promise.resolve(false)
            }
            onSaveEdit={(msgId, content) => editMessage(msgId, content)}
            onDeleteMessage={(msgId) => deleteMessage(msgId)}
            onForwardMessage={(msgId, targetConvId) => forwardMessage(msgId, targetConvId)}
            onLoadOlderMessages={fetchOlderMessages}
            onAddReaction={addReaction}
            onRemoveReaction={removeReaction}
            onPinMessage={pinMessage}
            onUnpinMessage={unpinMessage}
            onTyping={sendTypingStatus}
            onSearch={searchMessages}
            onNavigateSearch={navigateSearchResult}
            onClearSearch={clearSearch}
            onSetReplyingMessage={setReplyingToMessage}
            onSetEditingMessage={setEditingMessage}
            onSetForwardingMessage={setForwardingMessage}
            onSetAttachmentFile={setAttachmentFile}
            onClearAttachment={clearAttachment}
            onBackMobile={() => setMobileShowChat(false)}
          />
        </div>
      </div>
    </div>
  );
}
