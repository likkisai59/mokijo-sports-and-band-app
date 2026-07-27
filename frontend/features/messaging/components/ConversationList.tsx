"use client";

import React from "react";
import { Conversation } from "../types";
import { formatDate } from "@/utils/format-date";
import { cn } from "@/utils/cn";
import { MessageSquare, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onSelect: (conversation: Conversation) => void;
  loading: boolean;
}

export function ConversationList({
  conversations,
  activeConversation,
  onSelect,
  loading,
}: ConversationListProps) {
  if (loading && conversations.length === 0) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-bg-card/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-text-secondary">
        <MessageSquare className="h-6 w-6 mx-auto mb-2 text-text-muted" />
        No active conversations yet.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/40 overflow-y-auto max-h-[600px] scrollbar-none">
      {conversations.map((conv) => {
        const isSelected = activeConversation?.id === conv.id;

        return (
          <div
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={cn(
              "p-4 cursor-pointer transition-all hover:bg-bg-card/60 flex flex-col gap-1.5 select-none",
              isSelected
                ? "bg-primary/10 border-l-4 border-primary font-semibold"
                : "bg-transparent"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-text-primary truncate flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                {conv.event_name || `Booking ${conv.booking_id.slice(0, 8)}`}
              </span>
              <Badge
                variant={conv.status === "ACTIVE" ? "default" : "outline"}
                className="text-[10px] px-1.5 py-0 uppercase"
              >
                {conv.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-[11px] text-text-secondary">
              <span className="font-mono text-[10px] text-text-muted">
                Ref: {conv.booking_id.slice(0, 8)}
              </span>
              <span>
                {conv.last_message_at ? formatDate(conv.last_message_at) : "No messages"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
