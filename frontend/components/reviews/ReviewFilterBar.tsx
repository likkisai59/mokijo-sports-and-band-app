"use client";

import * as React from "react";
import { Search, Filter, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface ReviewFilterBarProps {
  search?: string;
  rating?: number;
  onSearchChange: (val: string) => void;
  onRatingChange: (val?: number) => void;
  onReset?: () => void;
  className?: string;
}

export function ReviewFilterBar({
  search = "",
  rating,
  onSearchChange,
  onRatingChange,
  onReset,
  className
}: ReviewFilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-border/70 bg-bg-card/80",
        className
      )}
    >
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search reviews by keyword or reviewer name..."
          className="pl-9 h-9 text-xs bg-bg-elevated/50 border-border/60"
        />
      </div>

      {/* Filter by star rating */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <span className="text-[11px] font-bold text-text-muted flex items-center gap-1 mr-1 shrink-0">
          <Filter className="h-3 w-3" /> Stars:
        </span>
        <Button
          size="sm"
          variant={rating === undefined ? "default" : "outline"}
          onClick={() => onRatingChange(undefined)}
          className="h-7 px-2.5 text-xs font-semibold rounded-lg"
        >
          All
        </Button>
        {[5, 4, 3, 2, 1].map((score) => (
          <Button
            key={score}
            size="sm"
            variant={rating === score ? "default" : "outline"}
            onClick={() => onRatingChange(rating === score ? undefined : score)}
            className="h-7 px-2 text-xs font-semibold rounded-lg shrink-0"
          >
            {score} ★
          </Button>
        ))}
        {onReset && (search || rating !== undefined) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onReset}
            className="h-7 px-2 text-xs text-text-muted hover:text-text-primary"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
