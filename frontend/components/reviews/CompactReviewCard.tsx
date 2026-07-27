"use client";

import * as React from "react";
import { ReviewRating } from "./ReviewRating";
import { User, Calendar } from "lucide-react";
import { cn } from "@/utils/cn";

export interface CompactReviewCardProps {
  reviewerName?: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  createdAt?: string | null;
  onClick?: () => void;
  className?: string;
}

export function CompactReviewCard({
  reviewerName = "Verified Customer",
  rating,
  title,
  comment,
  createdAt,
  onClick,
  className
}: CompactReviewCardProps) {
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border border-border/70 bg-bg-card p-3.5 shadow-xs transition-all hover:border-primary/40 hover:shadow-md",
        onClick ? "cursor-pointer" : "",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
            <User className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-text-primary truncate">{reviewerName}</span>
        </div>
        <ReviewRating rating={rating} size="sm" showLabel={false} />
      </div>

      {title && <h5 className="text-xs font-bold text-text-primary truncate">{title}</h5>}
      {comment && (
        <p className="text-xs text-text-secondary line-clamp-2 mt-1 leading-relaxed">
          {comment}
        </p>
      )}

      {formattedDate && (
        <div className="mt-2.5 flex items-center justify-end gap-1 text-[10px] text-text-muted">
          <Calendar className="h-3 w-3" />
          <span>{formattedDate}</span>
        </div>
      )}
    </div>
  );
}
