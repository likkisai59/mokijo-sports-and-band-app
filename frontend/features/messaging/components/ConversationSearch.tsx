"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ConversationSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ConversationSearch({ value, onChange }: ConversationSearchProps) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search conversations..."
        className="pl-9 pr-8 h-8 text-xs bg-bg-card border-border/80 focus:ring-1 focus:ring-primary rounded-xl"
        aria-label="Search conversations"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-2 text-text-muted hover:text-text-primary p-0.5"
          aria-label="Clear search query"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
