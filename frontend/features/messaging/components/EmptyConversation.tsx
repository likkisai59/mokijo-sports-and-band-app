"use client";

import React from "react";
import { MessageSquare } from "lucide-react";

interface EmptyConversationProps {
  title?: string;
  description?: string;
}

export function EmptyConversation({
  title = "Select a Conversation",
  description = "Choose a conversation from the sidebar to start messaging and discussing booking details.",
}: EmptyConversationProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-bg-card/20 rounded-2xl border border-border/40 select-none">
      <div className="p-4 bg-primary/10 rounded-full text-primary mb-3">
        <MessageSquare className="h-8 w-8" />
      </div>
      <h3 className="text-sm font-bold text-text-primary mb-1">{title}</h3>
      <p className="text-xs text-text-secondary max-w-sm leading-relaxed">{description}</p>
    </div>
  );
}
