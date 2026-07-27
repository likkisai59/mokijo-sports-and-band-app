"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/utils/cn";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  onRatingChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StarRating({
  rating,
  maxRating = 5,
  onRatingChange,
  readOnly = true,
  size = "md",
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const starSizeClass = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-7 w-7",
  }[size];

  const handleStarClick = (idx: number) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(idx);
    }
  };

  const handleMouseEnter = (idx: number) => {
    if (!readOnly) {
      setHoverRating(idx);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverRating(null);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }).map((_, i) => {
        const starIndex = i + 1;
        const isActive = hoverRating !== null ? starIndex <= hoverRating : starIndex <= rating;
        
        return (
          <button
            key={i}
            type="button"
            className={cn(
              "p-0.5 rounded-full transition-all focus:outline-none focus:ring-1 focus:ring-primary/40",
              readOnly ? "cursor-default" : "cursor-pointer active:scale-90"
            )}
            onClick={() => handleStarClick(starIndex)}
            onMouseEnter={() => handleMouseEnter(starIndex)}
            onMouseLeave={handleMouseLeave}
            disabled={readOnly}
          >
            <Star
              className={cn(
                starSizeClass,
                isActive ? "text-accent fill-accent" : "text-text-muted fill-transparent"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
