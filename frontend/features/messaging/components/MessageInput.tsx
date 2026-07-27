"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Lock } from "lucide-react";
import { cn } from "@/utils/cn";

interface MessageInputProps {
  onSend: (content: string) => Promise<boolean>;
  disabled?: boolean;
  sending?: boolean;
}

export function MessageInput({ onSend, disabled = false, sending = false }: MessageInputProps) {
  const [content, setContent] = useState("");
  const MAX_LENGTH = 2000;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || disabled || sending) return;

    const success = await onSend(content);
    if (success) {
      setContent("");
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

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-bg-card/30 border-t border-border/60 space-y-1.5">
      <div className="flex items-end gap-2">
        <textarea
          rows={2}
          value={content}
          maxLength={MAX_LENGTH}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Press Enter to send)"
          className="flex-1 bg-bg-card border border-border/80 rounded-xl p-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary resize-none transition-colors"
        />
        <Button
          type="submit"
          disabled={!content.trim() || sending}
          size="icon"
          className="h-10 w-10 shrink-0 font-bold rounded-xl"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex justify-end text-[10px] text-text-muted px-1">
        <span className={cn(content.length >= MAX_LENGTH && "text-red-500 font-bold")}>
          {content.length} / {MAX_LENGTH}
        </span>
      </div>
    </form>
  );
}
