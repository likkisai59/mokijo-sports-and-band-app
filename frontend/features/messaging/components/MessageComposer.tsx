"use client";

import React, { useState, useEffect, useRef } from "react";
import { Message } from "../types";
import { Button } from "@/components/ui/button";
import { Send, Lock, Loader2, X, Reply, Edit2, Check, Paperclip, FileText, Image as ImageIcon, UploadCloud } from "lucide-react";
import { cn } from "@/utils/cn";

interface MessageComposerProps {
  onSend: (content: string, replyToMessageId?: string) => Promise<boolean>;
  onSendAttachment?: (content: string, replyToMessageId?: string) => Promise<boolean>;
  onSaveEdit?: (messageId: string, content: string) => Promise<boolean>;
  onTyping?: (isTyping: boolean) => void;
  replyingToMessage?: Message | null;
  editingMessage?: Message | null;
  attachmentFile?: File | null;
  uploadingAttachment?: boolean;
  uploadProgress?: number;
  onSelectAttachment?: (file: File | null) => void;
  onClearAttachment?: () => void;
  onCancelReply?: () => void;
  onCancelEdit?: () => void;
  disabled?: boolean;
  sending?: boolean;
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function MessageComposer({
  onSend,
  onSendAttachment,
  onSaveEdit,
  onTyping,
  replyingToMessage,
  editingMessage,
  attachmentFile,
  uploadingAttachment = false,
  uploadProgress = 0,
  onSelectAttachment,
  onClearAttachment,
  onCancelReply,
  onCancelEdit,
  disabled = false,
  sending = false,
}: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const MAX_LENGTH = 2000;

  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
    }
  }, [editingMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    if (onTyping && val.trim()) {
      const now = Date.now();
      if (now - lastTypingSentRef.current > 2000) {
        onTyping(true);
        lastTypingSentRef.current = now;
      }

      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      typingTimerRef.current = setTimeout(() => {
        onTyping(false);
      }, 3000);
    }
  };

  const stopTypingNow = () => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (onTyping) {
      onTyping(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && onSelectAttachment) {
      onSelectAttachment(files[0]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData && e.clipboardData.files.length > 0 && onSelectAttachment) {
      const file = e.clipboardData.files[0];
      onSelectAttachment(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !editingMessage) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && !editingMessage && e.dataTransfer.files.length > 0 && onSelectAttachment) {
      onSelectAttachment(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (disabled || sending || uploadingAttachment) return;
    stopTypingNow();

    if (editingMessage && onSaveEdit) {
      const success = await onSaveEdit(editingMessage.id, content);
      if (success) {
        setContent("");
      }
    } else if (attachmentFile && onSendAttachment) {
      const success = await onSendAttachment(content, replyingToMessage?.id);
      if (success) {
        setContent("");
      }
    } else {
      if (!content.trim()) return;
      const success = await onSend(content, replyingToMessage?.id);
      if (success) {
        setContent("");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (disabled) {
    return (
      <div className="p-3 bg-bg-card/40 border-t border-border/60 text-center text-xs text-text-muted flex items-center justify-center gap-2 select-none">
        <Lock className="h-3.5 w-3.5" />
        <span>This conversation is closed and read-only.</span>
      </div>
    );
  }

  const isImage = attachmentFile?.type.startsWith("image/");

  return (
    <form
      onSubmit={handleSubmit}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative p-3 bg-bg-card/30 border-t border-border/60 space-y-2 transition-all",
        isDragging && "bg-primary/10 border-primary/50"
      )}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-20 bg-primary/20 backdrop-blur-sm border-2 border-dashed border-primary rounded-xl flex items-center justify-center gap-2 text-primary font-bold text-xs select-none">
          <UploadCloud className="h-5 w-5 animate-bounce" />
          <span>Drop file here to attach</span>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
      />

      {/* Reply Banner */}
      {replyingToMessage && !editingMessage && (
        <div className="flex items-center justify-between p-2 bg-primary/10 border border-primary/30 rounded-xl text-xs text-text-primary">
          <div className="flex items-center gap-2 min-w-0">
            <Reply className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-bold shrink-0">Replying to:</span>
            <span className="truncate italic text-text-secondary">"{replyingToMessage.content}"</span>
          </div>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="p-1 text-text-muted hover:text-text-primary shrink-0 cursor-pointer"
              aria-label="Cancel reply"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Edit Banner */}
      {editingMessage && (
        <div className="flex items-center justify-between p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-text-primary">
          <div className="flex items-center gap-2 min-w-0">
            <Edit2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="font-bold text-amber-400 shrink-0">Editing Message:</span>
            <span className="truncate text-text-secondary">{editingMessage.content}</span>
          </div>
          {onCancelEdit && (
            <button
              type="button"
              onClick={() => {
                setContent("");
                onCancelEdit();
              }}
              className="p-1 text-text-muted hover:text-text-primary shrink-0 cursor-pointer"
              aria-label="Cancel editing"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Attachment Preview Banner */}
      {attachmentFile && !editingMessage && (
        <div className="flex items-center justify-between p-2 bg-bg-card border border-border rounded-xl text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {isImage ? (
              <ImageIcon className="h-4 w-4 text-sky-400 shrink-0" />
            ) : (
              <FileText className="h-4 w-4 text-primary shrink-0" />
            )}
            <div className="flex flex-col min-w-0">
              <span className="truncate font-semibold text-text-primary">{attachmentFile.name}</span>
              <span className="text-[10px] text-text-muted">{formatBytes(attachmentFile.size)}</span>
            </div>
          </div>
          {onClearAttachment && !uploadingAttachment && (
            <button
              type="button"
              onClick={onClearAttachment}
              className="p-1 text-text-muted hover:text-red-400 shrink-0 cursor-pointer"
              aria-label="Remove attachment"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Upload Progress Bar */}
      {uploadingAttachment && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-text-secondary font-medium">
            <span>Uploading attachment...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-bg-card border border-border/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Input Row */}
      <div className="flex items-end gap-2">
        {!editingMessage && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAttachment}
            className="h-10 w-10 shrink-0 rounded-xl border-border/80 text-text-secondary hover:text-primary hover:border-primary cursor-pointer"
            aria-label="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        )}

        <textarea
          rows={2}
          value={content}
          maxLength={MAX_LENGTH}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            editingMessage
              ? "Edit your message..."
              : attachmentFile
              ? "Add a caption for this file... (Optional)"
              : replyingToMessage
              ? "Type your reply..."
              : "Type a message... (Press Enter to send, Shift+Enter for new line)"
          }
          className="flex-1 bg-bg-card border border-border/80 rounded-xl p-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary resize-none transition-colors"
          aria-label="Message text input"
        />

        <Button
          type="submit"
          disabled={
            (!content.trim() && !attachmentFile) || sending || uploadingAttachment
          }
          size="icon"
          className={cn(
            "h-10 w-10 shrink-0 font-bold rounded-xl text-white cursor-pointer",
            editingMessage ? "bg-amber-500 hover:bg-amber-600" : "bg-primary hover:bg-primary/90"
          )}
          aria-label={editingMessage ? "Save edit" : "Send message"}
        >
          {sending || uploadingAttachment ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : editingMessage ? (
            <Check className="h-4 w-4" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex justify-between items-center text-[10px] text-text-muted px-1">
        <span className="italic text-[9.5px]">Drag & drop or paste image to attach</span>
        <span className={cn(content.length >= MAX_LENGTH && "text-red-500 font-bold")}>
          {content.length} / {MAX_LENGTH}
        </span>
      </div>
    </form>
  );
}
