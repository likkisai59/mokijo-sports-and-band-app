"use client";

import * as React from "react";
import { MessageSquare, Award, ThumbsUp } from "lucide-react";
import { cn } from "@/utils/cn";

export interface ReviewCounterWidgetProps {
  totalReviews: number;
  fiveStarCount?: number;
  responseRate?: number;
  className?: string;
}

export function ReviewCounterWidget({
  totalReviews,
  fiveStarCount = 0,
  responseRate = 100,
  className
}: ReviewCounterWidgetProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-3 rounded-2xl border border-border/80 bg-bg-card p-4 shadow-sm text-center",
        className
      )}
    >
      <div className="space-y-1 p-2 rounded-xl bg-bg-elevated/40">
        <div className="flex justify-center text-primary">
          <MessageSquare className="h-4 w-4" />
        </div>
        <span className="text-xl font-black text-text-primary block">{totalReviews}</span>
        <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Total Reviews</span>
      </div>

      <div className="space-y-1 p-2 rounded-xl bg-bg-elevated/40">
        <div className="flex justify-center text-amber-400">
          <Award className="h-4 w-4" />
        </div>
        <span className="text-xl font-black text-text-primary block">{fiveStarCount}</span>
        <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">5-Star Gigs</span>
      </div>

      <div className="space-y-1 p-2 rounded-xl bg-bg-elevated/40">
        <div className="flex justify-center text-emerald-500">
          <ThumbsUp className="h-4 w-4" />
        </div>
        <span className="text-xl font-black text-text-primary block">{responseRate}%</span>
        <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Response Rate</span>
      </div>
    </div>
  );
}
