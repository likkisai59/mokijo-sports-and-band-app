"use client";

import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { Message } from "../types";
import { ChatBubble } from "./ChatBubble";
import { MessageListSkeleton } from "./LoadingSkeleton";
import { useAuth } from "@/hooks/use-auth";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { MessageSquare, ArrowDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  pinnedMessageId?: string | null;
  onLoadOlder?: () => void;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onPin?: (message: Message) => void;
  onUnpin?: () => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  onOpenLightbox?: (url: string, name?: string) => void;
}

function formatDateSeparator(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export function MessageList({
  messages,
  loading,
  hasMore = false,
  loadingMore = false,
  pinnedMessageId,
  onLoadOlder,
  onReply,
  onEdit,
  onDelete,
  onForward,
  onPin,
  onUnpin,
  onAddReaction,
  onRemoveReaction,
  onOpenLightbox,
}: MessageListProps) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const prevScrollHeightRef = useRef<number>(0);

  // Map messages by ID
  const messageMap = React.useMemo(() => {
    const map = new Map<string, Message>();
    messages.forEach((m) => map.set(m.id, m));
    return map;
  }, [messages]);

  // Determine first unread message ID for unread divider
  const firstUnreadMessageId = React.useMemo(() => {
    if (!user) return null;
    const unread = messages.find(
      (m) => !m.read_at && m.sender_id !== user.id && !m.is_deleted
    );
    return unread ? unread.id : null;
  }, [messages, user]);

  // Initial scroll to bottom
  useEffect(() => {
    if (!loading && messages.length > 0 && !prevScrollHeightRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [loading, messages.length]);

  // Preserve scroll offset when loading older prepended messages
  useLayoutEffect(() => {
    if (containerRef.current && prevScrollHeightRef.current > 0) {
      const newScrollHeight = containerRef.current.scrollHeight;
      const heightDiff = newScrollHeight - prevScrollHeightRef.current;
      containerRef.current.scrollTop = containerRef.current.scrollTop + heightDiff;
    }
    if (containerRef.current) {
      prevScrollHeightRef.current = containerRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

    // Show Jump to Latest button when scrolled up by > 300px
    const isUp = scrollHeight - scrollTop - clientHeight > 300;
    setShowJumpToLatest(isUp);

    // Infinite scroll triggering near top
    if (scrollTop < 80 && hasMore && !loadingMore && onLoadOlder) {
      onLoadOlder();
    }
  };

  const scrollToBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  const handleScrollToMessage = (targetId: string) => {
    const el = document.getElementById(`msg-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "ring-offset-2");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary", "ring-offset-2");
      }, 1500);
    }
  };

  if (loading && messages.length === 0) {
    return <MessageListSkeleton />;
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-text-secondary select-none">
        <MessageSquare className="h-6 w-6 text-text-muted mb-2 opacity-40" />
        <p className="font-semibold text-text-primary">No messages yet</p>
        <p className="text-[11px] text-text-muted">Send the first message below to start the conversation.</p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { dateLabel: string; msgs: Message[] }[] = [];
  let currentDateLabel = "";

  messages.forEach((msg) => {
    const label = formatDateSeparator(msg.created_at);
    if (label !== currentDateLabel) {
      currentDateLabel = label;
      groupedMessages.push({ dateLabel: label, msgs: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].msgs.push(msg);
    }
  });

  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      {/* Messages Scroll Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[480px] scrollbar-none"
      >
        {/* Loading Spinner for older messages */}
        {loadingMore && (
          <div className="flex items-center justify-center py-2 text-xs text-text-muted gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Loading older messages...</span>
          </div>
        )}

        {groupedMessages.map((group, gIdx) => (
          <React.Fragment key={`group-${gIdx}`}>
            <div className="flex items-center justify-center my-3">
              <span className="text-[10px] font-bold text-text-muted bg-bg-elevated/60 border border-border/40 px-3 py-0.5 rounded-full uppercase tracking-wider select-none">
                {group.dateLabel}
              </span>
            </div>

            {group.msgs.map((msg) => (
              <React.Fragment key={msg.id}>
                {/* Unread Messages Divider */}
                {firstUnreadMessageId === msg.id && (
                  <div className="flex items-center my-4 select-none">
                    <div className="flex-1 border-t border-error/40" />
                    <span className="px-3 py-0.5 text-[10px] font-bold text-error bg-error/10 border border-error/30 rounded-full uppercase tracking-wider">
                      Unread Messages
                    </span>
                    <div className="flex-1 border-t border-error/40" />
                  </div>
                )}

                <ChatBubble
                  message={msg}
                  isSelf={user?.id === msg.sender_id}
                  currentUserId={user?.id}
                  isPinned={pinnedMessageId === msg.id}
                  parentMessage={msg.reply_to_message_id ? messageMap.get(msg.reply_to_message_id) : null}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onForward={onForward}
                  onPin={onPin}
                  onUnpin={onUnpin}
                  onAddReaction={onAddReaction}
                  onRemoveReaction={onRemoveReaction}
                  onScrollToMessage={handleScrollToMessage}
                  onOpenLightbox={onOpenLightbox}
                />
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Floating Jump to Latest Button */}
      {showJumpToLatest && (
        <Button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-4 right-4 h-9 rounded-full px-3 text-xs shadow-xl font-bold bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5 animate-bounce"
        >
          <ArrowDown className="h-4 w-4" />
          <span>Jump to Latest</span>
        </Button>
      )}
    </div>
  );
}
