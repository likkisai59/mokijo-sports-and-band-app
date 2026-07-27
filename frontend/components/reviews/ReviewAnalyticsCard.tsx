"use client";

import * as React from "react";
import { Star, TrendingUp, Award, ShieldCheck } from "lucide-react";
import { getQualitativeLabel } from "./ReviewRating";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

export interface ReviewAnalyticsCardProps {
  averageRating: number;
  totalReviews: number;
  fiveStarRatio?: number;
  growthPercentage?: number;
  className?: string;
}

export function ReviewAnalyticsCard({
  averageRating,
  totalReviews,
  fiveStarRatio = 0,
  growthPercentage = 0,
  className
}: ReviewAnalyticsCardProps) {
  const labelObj = getQualitativeLabel(averageRating);

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-linear-to-br from-bg-card via-bg-card to-bg-elevated/30 p-6 shadow-sm space-y-4 relative overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-400" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-text-muted">
            Reputation & Satisfaction Score
          </span>
        </div>
        <Badge variant={labelObj.variant} className="text-[10px] uppercase font-bold">
          {labelObj.text}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-border/40">
        <div className="space-y-1">
          <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">
            Average Score
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-text-primary">
              {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
            </span>
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">
            Total Reviews
          </span>
          <span className="text-3xl font-black text-text-primary block">{totalReviews}</span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">
            5-Star Satisfaction
          </span>
          <span className="text-3xl font-black text-emerald-500 block">{fiveStarRatio.toFixed(1)}%</span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">
            Monthly Growth
          </span>
          <div className="flex items-center gap-1">
            <span className="text-3xl font-black text-text-primary">
              {growthPercentage > 0 ? `+${growthPercentage.toFixed(1)}%` : `${growthPercentage.toFixed(1)}%`}
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-text-muted border-t border-border/40 pt-3">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        <span>Verified platform ratings & performance audit complete.</span>
      </div>
    </div>
  );
}
