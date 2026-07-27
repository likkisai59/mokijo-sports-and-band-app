"use client";

import React from "react";
import { Conversation } from "../types";
import { ConversationCard } from "./ConversationCard";
import { ConversationSearch } from "./ConversationSearch";
import { ConversationSidebarSkeleton } from "./LoadingSkeleton";
import { MessageSquare } from "lucide-react";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelect: (conversation: Conversation) => void;
  loading: boolean;
}

export function ConversationSidebar({
  conversations,
  activeConversation,
  searchQuery,
  onSearchChange,
  onSelect,
  loading,
}: ConversationSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl overflow-hidden shadow-xl">
      {/* Header & Search */}
      <div className="p-3 border-b border-border/60 bg-bg-card/40 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span>Conversations</span>
          </h2>
          <span className="text-[10px] font-mono text-text-muted bg-bg-elevated px-2 py-0.5 rounded-full">
            {conversations.length}
          </span>
        </div>
        <ConversationSearch value={searchQuery} onChange={onSearchChange} />
      </div>

      {/* Conversations List View */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-none">
        {loading && conversations.length === 0 ? (
          <ConversationSidebarSkeleton />
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-xs text-text-secondary space-y-1">
            <MessageSquare className="h-6 w-6 mx-auto mb-2 text-text-muted opacity-40" />
            <p className="font-semibold text-text-primary">No conversations found</p>
            <p className="text-[11px] text-text-muted">
              {searchQuery ? "No matches for your search criteria." : "You have no active booking conversations."}
            </p>
          </div>
        ) : (
          conversations.map((conv) => (
            <ConversationCard
              key={conv.id}
              conversation={conv}
              isSelected={activeConversation?.id === conv.id}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
