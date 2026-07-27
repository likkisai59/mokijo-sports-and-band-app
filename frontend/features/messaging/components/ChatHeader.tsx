"use client";

import React, { useState } from "react";
import { Conversation, Message } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, ArrowLeft, Search, Pin, X, ChevronUp, ChevronDown } from "lucide-react";
import { format } from "date-fns";

interface ChatHeaderProps {
  conversation: Conversation;
  onBack?: () => void;
  typingText?: string | null;
  presenceInfo?: { is_online: boolean; last_seen?: string | null } | null;
  pinnedMessage?: Message | null;
  onUnpin?: () => void;
  onJumpToMessage?: (messageId: string) => void;
  onSearch?: (query: string) => void;
  searchResultCount?: number;
  currentSearchIndex?: number;
  onNavigateSearch?: (direction: "next" | "prev") => void;
  onClearSearch?: () => void;
}

export function ChatHeader({
  conversation,
  onBack,
  typingText,
  presenceInfo,
  pinnedMessage,
  onUnpin,
  onJumpToMessage,
  onSearch,
  searchResultCount = 0,
  currentSearchIndex = -1,
  onNavigateSearch,
  onClearSearch,
}: ChatHeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");

  const initial = (conversation.event_name || "E").charAt(0).toUpperCase();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && onSearch) {
      onSearch(query.trim());
    }
  };

  const handleCloseSearch = () => {
    setShowSearch(false);
    setQuery("");
    if (onClearSearch) onClearSearch();
  };

  const formatLastSeen = (isoStr?: string | null) => {
    if (!isoStr) return "Offline";
    try {
      return `Last seen ${format(new Date(isoStr), "p")}`;
    } catch {
      return "Offline";
    }
  };

  return (
    <div className="flex flex-col border-b border-border/60 bg-bg-card/40 select-none">
      {/* Primary Header Row */}
      <div className="p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8 md:hidden text-text-secondary hover:text-text-primary shrink-0"
              aria-label="Back to conversation list"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          <div className="relative shrink-0">
            <div className="h-9 w-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black text-sm">
              {initial}
            </div>
            {presenceInfo && (
              <span
                className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-bg-card ${
                  presenceInfo.is_online ? "bg-emerald-500" : "bg-text-muted/50"
                }`}
              />
            )}
          </div>

          <div className="space-y-0.5 min-w-0">
            <h2 className="text-xs font-bold text-text-primary truncate flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
              {conversation.event_name || `Booking ${conversation.booking_id.slice(0, 8)}`}
            </h2>

            {/* Dynamic Status / Typing subtitle */}
            {typingText ? (
              <p className="text-[11px] text-primary font-medium animate-pulse truncate">
                {typingText}
              </p>
            ) : presenceInfo ? (
              <p className="text-[10px] text-text-muted truncate">
                {presenceInfo.is_online ? (
                  <span className="text-emerald-500 font-semibold">Online</span>
                ) : (
                  formatLastSeen(presenceInfo.last_seen)
                )}
              </p>
            ) : (
              <span className="font-mono text-[10px] text-text-muted block truncate">
                Booking Ref: {conversation.booking_id}
              </span>
            )}
          </div>
        </div>

        {/* Actions & Search Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowSearch(!showSearch);
              if (showSearch && onClearSearch) onClearSearch();
            }}
            className="h-8 w-8 text-text-muted hover:text-text-primary"
            aria-label="Search conversation"
          >
            <Search className="h-4 w-4" />
          </Button>

          <Badge
            variant={conversation.status === "ACTIVE" ? "default" : "outline"}
            className="text-[10px] uppercase font-bold"
          >
            {conversation.status}
          </Badge>
        </div>
      </div>

      {/* In-Chat Search Bar Overlay */}
      {showSearch && (
        <form onSubmit={handleSearchSubmit} className="px-3 pb-3 flex items-center gap-2 border-t border-border/40 pt-2">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (onSearch && e.target.value.trim()) {
                onSearch(e.target.value.trim());
              }
            }}
            placeholder="Search messages & files..."
            className="h-8 text-xs bg-bg-card"
            autoFocus
          />
          {searchResultCount > 0 && (
            <div className="flex items-center gap-1 shrink-0 text-xs text-text-muted">
              <span>
                {currentSearchIndex + 1}/{searchResultCount}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onNavigateSearch && onNavigateSearch("prev")}
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onNavigateSearch && onNavigateSearch("next")}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={handleCloseSearch}>
            <X className="h-4 w-4" />
          </Button>
        </form>
      )}

      {/* Pinned Message Banner */}
      {pinnedMessage && (
        <div className="bg-primary/10 border-t border-primary/20 px-3 py-1.5 flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={() => onJumpToMessage && onJumpToMessage(pinnedMessage.id)}
            className="flex items-center gap-2 min-w-0 text-left hover:underline text-primary"
          >
            <Pin className="h-3.5 w-3.5 shrink-0" />
            <span className="font-semibold shrink-0">Pinned Message:</span>
            <span className="truncate text-text-primary">{pinnedMessage.content}</span>
          </button>
          {onUnpin && (
            <button
              type="button"
              onClick={onUnpin}
              className="text-text-muted hover:text-text-primary p-0.5 rounded"
              title="Unpin message"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
