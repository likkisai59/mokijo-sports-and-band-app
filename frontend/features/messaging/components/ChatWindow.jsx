"use client";

import React, { useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageComposer } from "./MessageComposer";
import { EmptyConversation } from "./EmptyConversation";
import { ForwardMessageDialog } from "./ForwardMessageDialog";
import { LightboxModal } from "./LightboxModal";

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
}) {
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    url: null,
    name: null,
  });

  if (!conversation) {
    return <EmptyConversation />;
  }

  const handleJumpToMessage = (messageId) => {
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

      {forwardingMessage && (
        <ForwardMessageDialog
          message={forwardingMessage}
          conversations={conversations}
          isOpen={!!forwardingMessage}
          onClose={() => onSetForwardingMessage(null)}
          onForward={onForwardMessage}
        />
      )}

      <LightboxModal
        imageUrl={lightboxState.url}
        imageName={lightboxState.name}
        isOpen={lightboxState.isOpen}
        onClose={() => setLightboxState({ isOpen: false, url: null, name: null })}
      />
    </div>
  );
}
