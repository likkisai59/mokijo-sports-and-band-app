"use client";

import * as React from "react";
import { Star, MessageSquare, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { cn } from "@/utils/cn";

export interface ReviewStatisticsGridProps {
  averageRating: number;
  totalReviews: number;
  publicReviewsCount?: number;
  privateReviewsCount?: number;
  fiveStarRatio?: number;
  className?: string;
}

export function ReviewStatisticsGrid({
  averageRating,
  totalReviews,
  publicReviewsCount = 0,
  privateReviewsCount = 0,
  fiveStarRatio = 0,
  className
}: ReviewStatisticsGridProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      <div className="rounded-2xl border border-border/80 bg-bg-card p-4 space-y-1 shadow-sm">
        <div className="flex items-center justify-between text-text-muted">
          <span className="text-[10px] font-bold uppercase tracking-wider">Average Rating</span>
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        </div>
        <span className="text-2xl font-black text-text-primary block">
          {averageRating > 0 ? averageRating.toFixed(1) : "0.0"} / 5.0
        </span>
        <span className="text-[10px] text-text-muted">Aggregate satisfaction score</span>
      </div>

      <div className="rounded-2xl border border-border/80 bg-bg-card p-4 space-y-1 shadow-sm">
        <div className="flex items-center justify-between text-text-muted">
          <span className="text-[10px] font-bold uppercase tracking-wider">Total Feedback</span>
          <MessageSquare className="h-4 w-4 text-primary" />
        </div>
        <span className="text-2xl font-black text-text-primary block">{totalReviews}</span>
        <span className="text-[10px] text-text-muted">Verified client submissions</span>
      </div>

      <div className="rounded-2xl border border-border/80 bg-bg-card p-4 space-y-1 shadow-sm">
        <div className="flex items-center justify-between text-text-muted">
          <span className="text-[10px] font-bold uppercase tracking-wider">Public vs Private</span>
          <div className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5 text-emerald-500" />
            <EyeOff className="h-3.5 w-3.5 text-text-muted" />
          </div>
        </div>
        <span className="text-2xl font-black text-text-primary block">
          {publicReviewsCount} <span className="text-xs text-text-muted font-bold">/ {privateReviewsCount}</span>
        </span>
        <span className="text-[10px] text-text-muted">Public listing visibility</span>
      </div>

      <div className="rounded-2xl border border-border/80 bg-bg-card p-4 space-y-1 shadow-sm">
        <div className="flex items-center justify-between text-text-muted">
          <span className="text-[10px] font-bold uppercase tracking-wider">5-Star Ratio</span>
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
        </div>
        <span className="text-2xl font-black text-emerald-500 block">{fiveStarRatio.toFixed(1)}%</span>
        <span className="text-[10px] text-text-muted">Exceptional rating ratio</span>
      </div>
    </div>
  );
}
