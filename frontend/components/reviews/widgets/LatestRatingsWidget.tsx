"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { RatingStars } from "../RatingStars";
import { cn } from "@/utils/cn";

export interface LatestRatingItem {
  id: string;
  rating: number;
  reviewerName: string;
  createdAt: string;
}

export interface LatestRatingsWidgetProps {
  ratings: LatestRatingItem[];
  className?: string;
}

export function LatestRatingsWidget({ ratings, className }: LatestRatingsWidgetProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-bg-card p-5 shadow-sm space-y-3",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5 uppercase tracking-wider">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span>Latest Ratings Activity</span>
        </h4>
        <span className="text-[10px] text-text-muted font-medium">Real-time Feed</span>
      </div>

      {ratings.length === 0 ? (
        <p className="text-xs text-text-muted italic py-4 text-center">No recent rating activity.</p>
      ) : (
        <div className="space-y-2">
          {ratings.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-bg-elevated/40">
              <span className="font-semibold text-text-primary truncate">{item.reviewerName}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <RatingStars rating={item.rating} size="sm" />
                <span className="font-extrabold text-text-primary text-[11px]">{item.rating.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
