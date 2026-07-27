"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

export interface ReviewSearchProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function ReviewSearch({
  value,
  onChange,
  placeholder = "Search review title, text, or reviewer name...",
  className
}: ReviewSearchProps) {
  return (
    <div className={cn("relative flex items-center flex-1 max-w-md", className)}>
      <Search className="absolute left-3 h-4 w-4 text-text-muted shrink-0 pointer-events-none" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-8 h-9 text-xs bg-bg-card border-border/80 focus:border-primary text-text-primary rounded-xl"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 text-text-muted hover:text-text-primary p-0.5 rounded-full transition-colors"
          aria-label="Clear search query"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
