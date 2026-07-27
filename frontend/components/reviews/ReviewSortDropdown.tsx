"use client";

import * as React from "react";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/utils/cn";

export type SortOptionValue = "created_at_desc" | "created_at_asc" | "rating_desc" | "rating_asc" | "most_helpful";

export interface ReviewSortDropdownProps {
  value?: SortOptionValue;
  onChange: (value: SortOptionValue) => void;
  className?: string;
}

const SORT_OPTIONS: { label: string; value: SortOptionValue }[] = [
  { label: "Newest First", value: "created_at_desc" },
  { label: "Oldest First", value: "created_at_asc" },
  { label: "Highest Rating", value: "rating_desc" },
  { label: "Lowest Rating", value: "rating_asc" },
  { label: "Most Helpful (Top Rated)", value: "most_helpful" }
];

export function ReviewSortDropdown({ value = "created_at_desc", onChange, className }: ReviewSortDropdownProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ArrowUpDown className="h-4 w-4 text-text-muted shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOptionValue)}
        className="h-9 px-3 rounded-xl border border-border/80 bg-bg-card text-text-primary text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
        aria-label="Sort reviews by"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
