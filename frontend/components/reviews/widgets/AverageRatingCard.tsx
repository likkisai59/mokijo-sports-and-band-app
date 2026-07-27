"use client";

import * as React from "react";
import { MessageSquare, ArrowUpRight } from "lucide-react";
import { RatingStars } from "../RatingStars";
import { getQualitativeLabel } from "../ReviewRating";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/utils/cn";

export interface AverageRatingCardProps {
  averageRating: number;
  totalReviews: number;
  viewAllHref?: string;
  className?: string;
}

export function AverageRatingCard({
  averageRating,
  totalReviews,
  viewAllHref,
  className
}: AverageRatingCardProps) {
  const labelObj = getQualitativeLabel(averageRating);

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-bg-card p-5 shadow-sm space-y-3 relative overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span>Average Rating</span>
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-0.5 text-xs text-primary hover:underline font-semibold"
          >
            <span>View All</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-black text-text-primary tracking-tight">
          {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
        </span>
        <span className="text-xs text-text-muted font-bold">out of 5.0</span>
      </div>

      <div className="flex items-center justify-between pt-1">
        <RatingStars rating={averageRating} size="md" />
        <Badge variant={labelObj.variant} className="text-[10px] uppercase font-bold">
          {labelObj.text}
        </Badge>
      </div>

      <p className="text-[11px] text-text-muted border-t border-border/40 pt-2 font-medium">
        Based on {totalReviews} verified reviews
      </p>
    </div>
  );
}
