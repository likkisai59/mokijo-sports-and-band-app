"use client";

import * as React from "react";
import { RatingStars } from "./RatingStars";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

export interface ReviewRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function getQualitativeLabel(rating: number): { text: string; variant: "success" | "default" | "secondary" | "outline" | "destructive" } {
  if (rating >= 4.8) return { text: "Exceptional", variant: "success" };
  if (rating >= 4.0) return { text: "Excellent", variant: "default" };
  if (rating >= 3.0) return { text: "Very Good", variant: "secondary" };
  if (rating >= 2.0) return { text: "Average", variant: "outline" };
  return { text: "Poor", variant: "destructive" };
}

export function ReviewRating({
  rating,
  maxRating = 5,
  size = "md",
  showLabel = true,
  className
}: ReviewRatingProps) {
  const labelObj = getQualitativeLabel(rating);

  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <RatingStars rating={rating} maxRating={maxRating} size={size} />
      <span className="text-xs font-extrabold text-text-primary">
        {rating.toFixed(1)}
      </span>
      {showLabel && (
        <Badge variant={labelObj.variant} className="text-[10px] uppercase tracking-wider font-bold">
          {labelObj.text}
        </Badge>
      )}
    </div>
  );
}
