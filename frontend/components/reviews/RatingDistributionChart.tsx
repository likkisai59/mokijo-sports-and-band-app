"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/utils/cn";

export interface RatingDistributionChartProps {
  distribution: Record<number, number>;
  totalReviews?: number;
  onStarSelect?: (rating: number | null) => void;
  selectedStar?: number | null;
  className?: string;
}

export function RatingDistributionChart({
  distribution,
  totalReviews,
  onStarSelect,
  selectedStar,
  className
}: RatingDistributionChartProps) {
  const total = totalReviews ?? Object.values(distribution).reduce((acc, curr) => acc + curr, 0);

  return (
    <div className={cn("space-y-2.5", className)}>
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
        Rating Breakdown
      </h4>
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[star] || 0;
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        const isSelected = selectedStar === star;

        return (
          <div
            key={star}
            onClick={() => onStarSelect?.(isSelected ? null : star)}
            className={cn(
              "flex items-center gap-3 text-xs group cursor-pointer p-1.5 rounded-lg transition-colors",
              isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-bg-elevated/50"
            )}
          >
            <div className="flex items-center gap-1 w-12 shrink-0 font-bold text-text-primary">
              <span>{star}</span>
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            </div>

            <div className="flex-1 h-3 rounded-full bg-bg-elevated/60 overflow-hidden border border-border/40 relative">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  star >= 4 ? "bg-linear-to-r from-emerald-500 to-teal-400" : star === 3 ? "bg-amber-400" : "bg-rose-400"
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="w-14 text-right text-[11px] shrink-0 font-medium text-text-muted">
              <span className="font-bold text-text-primary">{count}</span> ({percentage}%)
            </div>
          </div>
        );
      })}
    </div>
  );
}
