"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { RatingStars } from "./RatingStars";
import { getQualitativeLabel } from "./ReviewRating";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

export interface ReviewSummaryCardProps {
  averageRating: number;
  totalReviews: number;
  distribution?: Record<number, number>;
  selectedRatingFilter?: number | undefined;
  onRatingFilterSelect?: (rating: number | undefined) => void;
  className?: string;
}

export function ReviewSummaryCard({
  averageRating,
  totalReviews,
  distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  selectedRatingFilter,
  onRatingFilterSelect,
  className
}: ReviewSummaryCardProps) {
  const labelObj = getQualitativeLabel(averageRating);

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 gap-6 rounded-2xl border border-border/80 bg-bg-card/60 backdrop-blur-md p-6 shadow-xl",
        className
      )}
    >
      {/* Overall Score Box */}
      <div className="flex flex-col items-center justify-center text-center md:border-r md:border-border/60 md:pr-6">
        <span className="text-[10px] text-text-muted uppercase font-extrabold tracking-wider mb-1">
          Overall Satisfaction Score
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black text-text-primary tracking-tight">
            {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
          </span>
          <span className="text-sm text-text-muted font-semibold">/ 5.0</span>
        </div>

        <div className="mt-2.5">
          <RatingStars rating={averageRating} size="lg" />
        </div>

        <Badge variant={labelObj.variant} className="mt-3 text-xs uppercase font-extrabold px-3 py-0.5">
          {labelObj.text}
        </Badge>

        <span className="text-xs text-text-muted mt-2 font-medium">
          Based on {totalReviews} verified performance reviews
        </span>
      </div>

      {/* Distribution Bars */}
      <div className="md:col-span-2 flex flex-col justify-center space-y-2.5">
        <div className="flex items-center justify-between text-xs text-text-muted font-bold mb-1">
          <span>Rating Breakdown</span>
          {selectedRatingFilter !== undefined && (
            <button
              onClick={() => onRatingFilterSelect?.(undefined)}
              className="text-primary hover:underline font-semibold"
            >
              Clear Filter ({selectedRatingFilter} Stars)
            </button>
          )}
        </div>

        {([5, 4, 3, 2, 1] as const).map((starVal) => {
          const count = distribution[starVal] || 0;
          const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
          const isSelected = selectedRatingFilter === starVal;

          return (
            <button
              key={starVal}
              type="button"
              onClick={() => onRatingFilterSelect?.(isSelected ? undefined : starVal)}
              className={cn(
                "flex items-center gap-3 text-xs w-full rounded-lg p-1.5 transition-all text-left group",
                isSelected
                  ? "bg-primary/15 border border-primary/40 font-bold"
                  : "hover:bg-bg-elevated/80"
              )}
            >
              <div className="flex items-center gap-1 w-12 shrink-0 text-text-primary font-bold">
                <span>{starVal}</span>
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              </div>

              <div className="flex-1 h-2.5 rounded-full bg-border/40 overflow-hidden relative">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isSelected ? "bg-primary" : "bg-amber-400 group-hover:bg-amber-500"
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="w-16 shrink-0 text-right flex items-center justify-end gap-1.5 text-text-muted">
                <span className="font-semibold text-text-primary">{count}</span>
                <span className="text-[10px] text-text-muted">({percentage}%)</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
