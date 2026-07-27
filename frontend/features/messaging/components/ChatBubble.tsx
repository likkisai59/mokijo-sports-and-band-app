"use client";

import React, { useState, useRef, useEffect } from "react";
import { Message, MessageReaction } from "../types";
import { formatDate } from "@/utils/format-date";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import {
  Reply,
  Edit2,
  Trash2,
  Forward,
  Check,
  CheckCheck,
  CornerDownRight,
  MoreHorizontal,
  FileText,
  FileArchive,
  Download,
  Music,
  Copy,
  Pin,
} from "lucide-react";

const SUPPORTED_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏"];

interface ChatBubbleProps {
  message: Message;
  isSelf: boolean;
  currentUserId?: string;
  isPinned?: boolean;
  parentMessage?: Message | null;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onPin?: (message: Message) => void;
  onUnpin?: () => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  onScrollToMessage?: (messageId: string) => void;
  onOpenLightbox?: (url: string, name?: string) => void;
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes === 0) return "File";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function ChatBubble({
  message,
  isSelf,
  currentUserId,
  isPinned = false,
  parentMessage,
  onReply,
  onEdit,
  onDelete,
  onForward,
  onPin,
  onUnpin,
  onAddReaction,
  onRemoveReaction,
  onScrollToMessage,
  onOpenLightbox,
}: ChatBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReactionsBar, setShowReactionsBar] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setShowReactionsBar(false);
      }
    }
    if (menuOpen || showReactionsBar) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen, showReactionsBar]);

  const isEditable = React.useMemo(() => {
    if (!isSelf || message.is_deleted || message.message_type !== "TEXT") return false;
    const createdTime = new Date(message.created_at).getTime();
    const nowTime = new Date().getTime();
    return nowTime - createdTime <= 900000;
  }, [isSelf, message.created_at, message.is_deleted, message.message_type]);

  const handleCopyText = () => {
    if (message.content && !message.is_deleted) {
      navigator.clipboard.writeText(message.content);
      toast.success("Message copied.");
    }
    setMenuOpen(false);
  };

  const handleEmojiClick = (emoji: string) => {
    if (!onAddReaction || !onRemoveReaction) return;
    const userReaction = (message.reactions || []).find(
      (r) => r.emoji === emoji && (currentUserId ? r.user_id === currentUserId : true)
    );

    if (userReaction) {
      onRemoveReaction(message.id, emoji);
    } else {
      onAddReaction(message.id, emoji);
    }
    setShowReactionsBar(false);
    setMenuOpen(false);
  };

  // Group reactions by emoji
  const groupedReactions = React.useMemo(() => {
    const map = new Map<string, { count: number; userReacted: boolean }>();
    (message.reactions || []).forEach((r: MessageReaction) => {
      const existing = map.get(r.emoji) || { count: 0, userReacted: false };
      existing.count += 1;
      if (currentUserId && r.user_id === currentUserId) {
        existing.userReacted = true;
      }
      map.set(r.emoji, existing);
    });
    return Array.from(map.entries());
  }, [message.reactions, currentUserId]);

  const renderAttachmentContent = () => {
    if (!message.attachment_url || message.is_deleted) return null;

    if (message.message_type === "IMAGE") {
      return (
        <div className="mt-1 mb-1 overflow-hidden rounded-xl border border-border/60 max-w-xs cursor-pointer group/img">
          <img
            src={message.attachment_url}
            alt={message.attachment_name || "Attachment"}
            loading="lazy"
            onClick={() => onOpenLightbox && onOpenLightbox(message.attachment_url!, message.attachment_name || undefined)}
            className="w-full h-auto max-h-60 object-cover group-hover/img:scale-105 transition-transform duration-200"
          />
        </div>
      );
    }

    if (message.message_type === "VIDEO") {
      return (
        <div className="mt-1 mb-1 overflow-hidden rounded-xl border border-border/60 max-w-sm">
          <video
            src={message.attachment_url}
            controls
            preload="metadata"
            className="w-full max-h-60 rounded-xl bg-black"
          />
        </div>
      );
    }

    if (message.message_type === "AUDIO") {
      return (
        <div className="mt-1.5 mb-1 p-2 bg-bg-card/70 border border-border/60 rounded-xl max-w-xs space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-text-primary">
            <Music className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate font-medium">{message.attachment_name || "Audio File"}</span>
          </div>
          <audio src={message.attachment_url} controls className="w-full h-8 scale-95 origin-left" />
        </div>
      );
    }

    const isZip = message.attachment_name?.endsWith(".zip") || message.attachment_type?.includes("zip");
    const FileIcon = isZip ? FileArchive : FileText;

    return (
      <div className="mt-1.5 mb-1 p-2.5 bg-bg-card/70 border border-border/80 rounded-xl max-w-xs flex items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
            <FileIcon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="truncate font-semibold text-text-primary">
              {message.attachment_name || "Document"}
            </span>
            <span className="text-[10px] text-text-muted">
              {formatBytes(message.attachment_size)}
            </span>
          </div>
        </div>
        <a
          href={message.attachment_url}
          download={message.attachment_name || "attachment"}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg bg-bg-card border border-border hover:bg-primary hover:text-white transition-colors shrink-0 text-text-secondary"
          title="Download File"
        >
          <Download className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  };

  return (
    <div
      id={`msg-${message.id}`}
      className={cn(
        "group relative flex flex-col max-w-[80%] text-xs leading-relaxed transition-all my-1",
        isSelf ? "ml-auto items-end" : "mr-auto items-start"
      )}
    >
      {/* Quoted Parent Reply Preview Box */}
      {parentMessage && (
        <div
          onClick={() => onScrollToMessage && onScrollToMessage(parentMessage.id)}
          className={cn(
            "flex items-center gap-1.5 p-2 rounded-xl mb-1 text-[11px] cursor-pointer border transition-colors max-w-full select-none",
            isSelf
              ? "bg-primary/20 border-primary/40 text-text-primary hover:bg-primary/30"
              : "bg-bg-card/80 border-border/80 text-text-secondary hover:bg-bg-card"
          )}
        >
          <CornerDownRight className="h-3 w-3 text-primary shrink-0" />
          <span className="truncate italic">
            "{parentMessage.content}"
          </span>
        </div>
      )}

      {/* Main Message Bubble & Hover Action Dropdown */}
      <div className="flex items-center gap-1 max-w-full relative">
        {/* Actions Dropdown Trigger (left side for self) */}
        {!message.is_deleted && isSelf && (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-text-muted hover:text-text-primary"
              aria-label="Message options"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-6 z-50 w-40 bg-bg-card border border-border/80 rounded-xl shadow-xl py-1 text-xs space-y-0.5 select-none">
                {/* Emoji Quick Picker Row */}
                <div className="px-2 py-1 flex items-center justify-between border-b border-border/40 mb-1">
                  {SUPPORTED_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleEmojiClick(emoji)}
                      className="hover:scale-125 transition-transform text-sm p-0.5"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {message.message_type === "TEXT" && (
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-primary/10 text-text-primary text-left cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5 text-text-muted shrink-0" />
                    <span>Copy Text</span>
                  </button>
                )}

                {onPin && !isPinned && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onPin(message);
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-primary/10 text-text-primary text-left cursor-pointer"
                  >
                    <Pin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>Pin Message</span>
                  </button>
                )}

                {onUnpin && isPinned && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onUnpin();
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-primary/10 text-text-primary text-left cursor-pointer"
                  >
                    <Pin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>Unpin Message</span>
                  </button>
                )}

                {onReply && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onReply(message);
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-primary/10 text-text-primary text-left cursor-pointer"
                  >
                    <Reply className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Reply</span>
                  </button>
                )}
                {isEditable && onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(message);
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-primary/10 text-text-primary text-left cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>Edit</span>
                  </button>
                )}
                {onForward && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onForward(message);
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-primary/10 text-text-primary text-left cursor-pointer"
                  >
                    <Forward className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span>Forward</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(message);
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-red-500/10 text-red-400 text-left cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bubble Text Body + Attachment Rendering */}
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl shadow-sm break-words whitespace-pre-wrap select-text flex flex-col relative",
            message.is_deleted
              ? "bg-bg-card/40 border border-border/40 text-text-muted italic rounded-2xl"
              : isSelf
              ? "bg-primary text-white rounded-br-none font-medium"
              : "bg-bg-card border border-border/80 text-text-primary rounded-bl-none"
          )}
        >
          {isPinned && (
            <div className="flex items-center gap-1 text-[10px] text-amber-300 font-semibold mb-1">
              <Pin className="h-3 w-3" />
              <span>Pinned</span>
            </div>
          )}
          {renderAttachmentContent()}
          {message.content && (
            <span>{message.content}</span>
          )}
        </div>

        {/* Actions Dropdown Trigger (right side for received messages) */}
        {!message.is_deleted && !isSelf && (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-text-muted hover:text-text-primary"
              aria-label="Message options"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>

            {menuOpen && (
              <div className="absolute left-0 top-6 z-50 w-40 bg-bg-card border border-border/80 rounded-xl shadow-xl py-1 text-xs space-y-0.5 select-none">
                {/* Emoji Quick Picker Row */}
                <div className="px-2 py-1 flex items-center justify-between border-b border-border/40 mb-1">
                  {SUPPORTED_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleEmojiClick(emoji)}
                      className="hover:scale-125 transition-transform text-sm p-0.5"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {message.message_type === "TEXT" && (
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-primary/10 text-text-primary text-left cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5 text-text-muted shrink-0" />
                    <span>Copy Text</span>
                  </button>
                )}

                {onPin && !isPinned && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onPin(message);
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-primary/10 text-text-primary text-left cursor-pointer"
                  >
                    <Pin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>Pin Message</span>
                  </button>
                )}

                {onUnpin && isPinned && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onUnpin();
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-primary/10 text-text-primary text-left cursor-pointer"
                  >
                    <Pin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>Unpin Message</span>
                  </button>
                )}

                {onReply && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onReply(message);
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-primary/10 text-text-primary text-left cursor-pointer"
                  >
                    <Reply className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Reply</span>
                  </button>
                )}
                {onForward && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onForward(message);
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-primary/10 text-text-primary text-left cursor-pointer"
                  >
                    <Forward className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span>Forward</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Aggregated Reaction Badges */}
      {groupedReactions.length > 0 && (
        <div className={cn("flex flex-wrap gap-1 mt-1 select-none", isSelf ? "justify-end" : "justify-start")}>
          {groupedReactions.map(([emoji, { count, userReacted }]) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer",
                userReacted
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-bg-card border-border/60 text-text-secondary hover:bg-bg-card/80"
              )}
            >
              <span>{emoji}</span>
              <span>{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Footer Timestamp & Status Badges */}
      <div className="flex items-center gap-1.5 text-[10px] text-text-muted mt-1 px-1">
        <span>{formatDate(message.created_at)}</span>

        {message.edited_at && !message.is_deleted && (
          <span className="font-semibold text-text-muted">(Edited)</span>
        )}

        {isSelf && !message.is_deleted && (
          <span className="inline-flex items-center ml-0.5">
            {message.read_at ? (
              <span title={`Read at ${formatDate(message.read_at)}`}>
                <CheckCheck className="h-3.5 w-3.5 text-sky-400" />
              </span>
            ) : (
              <span title="Sent">
                <Check className="h-3.5 w-3.5 text-text-muted" />
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
