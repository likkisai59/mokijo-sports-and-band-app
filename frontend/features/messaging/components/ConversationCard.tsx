"use client";

import React from "react";
import { Conversation } from "../types";
import { formatDate } from "@/utils/format-date";
import { cn } from "@/utils/cn";
import { Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ConversationCardProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (conversation: Conversation) => void;
}

export function ConversationCard({
  conversation,
  isSelected,
  onSelect,
}: ConversationCardProps) {
  const initial = (conversation.event_name || "E").charAt(0).toUpperCase();

  return (
    <div
      onClick={() => onSelect(conversation)}
      aria-label={`Select conversation for ${conversation.event_name || conversation.booking_id}`}
      className={cn(
        "p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 select-none border",
        isSelected
          ? "bg-primary/10 border-primary/40 shadow-sm"
          : "bg-bg-card/40 border-border/40 hover:bg-bg-card/80 hover:border-border/80"
      )}
    >
      {/* Participant Avatar */}
      <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black text-sm shrink-0 mt-0.5">
        {initial}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-bold text-text-primary truncate flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-primary shrink-0" />
            {conversation.event_name || `Booking ${conversation.booking_id.slice(0, 8)}`}
          </span>
          <span className="text-[10px] text-text-muted shrink-0">
            {conversation.last_message_at ? formatDate(conversation.last_message_at) : ""}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px] text-text-secondary">
          <span className="font-mono text-[10px] text-text-muted truncate">
            Ref: {conversation.booking_id.slice(0, 8)}
          </span>
          <Badge
            variant={conversation.status === "ACTIVE" ? "default" : "outline"}
            className="text-[9px] px-1.5 py-0 uppercase font-bold shrink-0"
          >
            {conversation.status}
          </Badge>
        </div>
      </div>
    </div>
  );
}
