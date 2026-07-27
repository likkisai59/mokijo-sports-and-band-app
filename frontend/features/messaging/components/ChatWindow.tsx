"use client";

import React, { useState } from "react";
import { Conversation, Message } from "../types";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageComposer } from "./MessageComposer";
import { EmptyConversation } from "./EmptyConversation";
import { ForwardMessageDialog } from "./ForwardMessageDialog";
import { LightboxModal } from "./LightboxModal";

interface ChatWindowProps {
  conversation: Conversation | null;
  conversations: Conversation[];
  messages: Message[];
  loadingMessages: boolean;
  sendingMessage: boolean;
  hasMoreMessages?: boolean;
  loadingMoreMessages?: boolean;
  replyingToMessage: Message | null;
  editingMessage: Message | null;
  forwardingMessage: Message | null;
  attachmentFile?: File | null;
  uploadingAttachment?: boolean;
  uploadProgress?: number;
  typingText?: string | null;
  presenceInfo?: { is_online: boolean; last_seen?: string | null } | null;
  pinnedMessage?: Message | null;
  searchResultCount?: number;
  currentSearchIndex?: number;

  onSendMessage: (content: string, replyToMessageId?: string) => Promise<boolean>;
  onSendAttachmentMessage: (content?: string, replyToMessageId?: string) => Promise<boolean>;
  onSaveEdit: (messageId: string, content: string) => Promise<boolean>;
  onDeleteMessage: (messageId: string) => Promise<boolean>;
  onForwardMessage: (messageId: string, targetConversationId: string) => Promise<boolean>;
  onLoadOlderMessages?: () => void;
  onAddReaction?: (messageId: string, emoji: string) => Promise<boolean>;
  onRemoveReaction?: (messageId: string, emoji: string) => Promise<boolean>;
  onPinMessage?: (messageId: string) => Promise<boolean>;
  onUnpinMessage?: () => Promise<boolean>;
  onTyping?: (isTyping: boolean) => void;
  onSearch?: (query: string) => void;
  onNavigateSearch?: (direction: "next" | "prev") => void;
  onClearSearch?: () => void;

  onSetReplyingMessage: (msg: Message | null) => void;
  onSetEditingMessage: (msg: Message | null) => void;
  onSetForwardingMessage: (msg: Message | null) => void;
  onSetAttachmentFile: (file: File | null) => void;
  onClearAttachment: () => void;
  onBackMobile?: () => void;
}

export function ChatWindow({
  conversation,
  conversations,
  messages,
  loadingMessages,
  sendingMessage,
  hasMoreMessages = false,
  loadingMoreMessages = false,
  replyingToMessage,
  editingMessage,
  forwardingMessage,
  attachmentFile,
  uploadingAttachment = false,
  uploadProgress = 0,
  typingText,
  presenceInfo,
  pinnedMessage,
  searchResultCount = 0,
  currentSearchIndex = -1,
  onSendMessage,
  onSendAttachmentMessage,
  onSaveEdit,
  onDeleteMessage,
  onForwardMessage,
  onLoadOlderMessages,
  onAddReaction,
  onRemoveReaction,
  onPinMessage,
  onUnpinMessage,
  onTyping,
  onSearch,
  onNavigateSearch,
  onClearSearch,
  onSetReplyingMessage,
  onSetEditingMessage,
  onSetForwardingMessage,
  onSetAttachmentFile,
  onClearAttachment,
  onBackMobile,
}: ChatWindowProps) {
  const [lightboxState, setLightboxState] = useState<{ isOpen: boolean; url: string | null; name?: string | null }>({
    isOpen: false,
    url: null,
    name: null,
  });

  if (!conversation) {
    return <EmptyConversation />;
  }

  const handleJumpToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "ring-offset-2");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary", "ring-offset-2");
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-card/20 rounded-2xl border border-border/60 overflow-hidden shadow-xl">
      {/* Header */}
      <ChatHeader
        conversation={conversation}
        onBack={onBackMobile}
        typingText={typingText}
        presenceInfo={presenceInfo}
        pinnedMessage={pinnedMessage}
        onUnpin={onUnpinMessage}
        onJumpToMessage={handleJumpToMessage}
        onSearch={onSearch}
        searchResultCount={searchResultCount}
        currentSearchIndex={currentSearchIndex}
        onNavigateSearch={onNavigateSearch}
        onClearSearch={onClearSearch}
      />

      {/* Message History */}
      <MessageList
        messages={messages}
        loading={loadingMessages}
        hasMore={hasMoreMessages}
        loadingMore={loadingMoreMessages}
        pinnedMessageId={pinnedMessage?.id}
        onLoadOlder={onLoadOlderMessages}
        onReply={(msg) => onSetReplyingMessage(msg)}
        onEdit={(msg) => onSetEditingMessage(msg)}
        onDelete={(msg) => onDeleteMessage(msg.id)}
        onForward={(msg) => onSetForwardingMessage(msg)}
        onPin={(msg) => onPinMessage && onPinMessage(msg.id)}
        onUnpin={onUnpinMessage}
        onAddReaction={onAddReaction}
        onRemoveReaction={onRemoveReaction}
        onOpenLightbox={(url, name) => setLightboxState({ isOpen: true, url, name })}
      />

      {/* Input Composer */}
      <MessageComposer
        onSend={onSendMessage}
        onSendAttachment={onSendAttachmentMessage}
        onSaveEdit={onSaveEdit}
        onTyping={onTyping}
        replyingToMessage={replyingToMessage}
        editingMessage={editingMessage}
        attachmentFile={attachmentFile}
        uploadingAttachment={uploadingAttachment}
        uploadProgress={uploadProgress}
        onSelectAttachment={onSetAttachmentFile}
        onClearAttachment={onClearAttachment}
        onCancelReply={() => onSetReplyingMessage(null)}
        onCancelEdit={() => onSetEditingMessage(null)}
        disabled={conversation.status === "CLOSED"}
        sending={sendingMessage}
      />

      {/* Forward Dialog */}
      {forwardingMessage && (
        <ForwardMessageDialog
          message={forwardingMessage}
          conversations={conversations}
          isOpen={!!forwardingMessage}
          onClose={() => onSetForwardingMessage(null)}
          onForward={onForwardMessage}
        />
      )}

      {/* Image Lightbox Viewer */}
      <LightboxModal
        imageUrl={lightboxState.url}
        imageName={lightboxState.name}
        isOpen={lightboxState.isOpen}
        onClose={() => setLightboxState({ isOpen: false, url: null, name: null })}
      />
    </div>
  );
}
