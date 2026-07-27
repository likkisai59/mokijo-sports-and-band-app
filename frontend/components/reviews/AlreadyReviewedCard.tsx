"use client";

import * as React from "react";
import { CheckCircle, Star } from "lucide-react";
import { cn } from "@/utils/cn";

interface AlreadyReviewedCardProps {
  rating?: number;
  reviewTitle?: string | null;
  reviewText?: string | null;
  createdAt?: string;
  className?: string;
}

export function AlreadyReviewedCard({
  rating,
  reviewTitle,
  reviewText,
  createdAt,
  className
}: AlreadyReviewedCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs space-y-2 text-text-primary",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-emerald-400">
          <CheckCircle className="h-4 w-4" />
          <span>Already Reviewed</span>
        </div>
        {rating && (
          <div className="flex items-center gap-1 font-bold text-amber-400">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>{rating}.0</span>
          </div>
        )}
      </div>
      {reviewTitle && <h5 className="font-semibold text-text-primary">{reviewTitle}</h5>}
      {reviewText && <p className="text-text-secondary text-[11px] leading-relaxed">{reviewText}</p>}
      {createdAt && (
        <span className="block text-[10px] text-text-muted">
          Submitted on {new Date(createdAt).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
