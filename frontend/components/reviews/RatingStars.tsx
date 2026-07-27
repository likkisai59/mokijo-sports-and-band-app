"use client";

import * as React from "react";
import { Star, StarHalf } from "lucide-react";
import { cn } from "@/utils/cn";

export interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  allowHalf?: boolean;
  onRatingChange?: (newRating: number) => void;
  className?: string;
  showScore?: boolean;
}

const sizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-4.5 w-4.5",
  lg: "h-6 w-6"
};

const containerSizeClasses = {
  sm: "gap-0.5",
  md: "gap-1",
  lg: "gap-1.5"
};

export function RatingStars({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  allowHalf = false,
  onRatingChange,
  className,
  showScore = false
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const activeRating = hoverRating !== null ? hoverRating : rating;

  const handleKeyDown = (e: React.KeyboardEvent, currentVal: number) => {
    if (!interactive || !onRatingChange) return;

    let nextVal = currentVal;
    const step = allowHalf ? 0.5 : 1;

    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      nextVal = Math.min(maxRating, currentVal + step);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      nextVal = Math.max(step, currentVal - step);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRatingChange(currentVal);
      return;
    }

    if (nextVal !== currentVal) {
      setHoverRating(nextVal);
      onRatingChange(nextVal);
    }
  };

  return (
    <div
      className={cn("flex items-center select-none", containerSizeClasses[size], className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={`${rating} out of ${maxRating} stars`}
    >
      {Array.from({ length: maxRating }).map((_, index) => {
        const starValue = index + 1;
        const isFull = starValue <= Math.floor(activeRating);
        const isHalf = allowHalf && !isFull && starValue - 0.5 <= activeRating;

        return (
          <button
            key={starValue}
            type={interactive ? "button" : undefined}
            disabled={!interactive}
            role={interactive ? "radio" : undefined}
            aria-checked={interactive ? Math.round(activeRating) === starValue : undefined}
            aria-label={`${starValue} Star${starValue > 1 ? "s" : ""}`}
            tabIndex={interactive ? (starValue === Math.round(activeRating || 1) ? 0 : -1) : -1}
            onClick={() => interactive && onRatingChange?.(starValue)}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            onMouseLeave={() => interactive && setHoverRating(null)}
            onKeyDown={(e) => handleKeyDown(e, starValue)}
            className={cn(
              "relative transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-full",
              interactive ? "cursor-pointer hover:scale-115 active:scale-95" : "cursor-default"
            )}
          >
            {isHalf ? (
              <div className="relative">
                <Star className={cn(sizeClasses[size], "text-border/40 fill-transparent")} />
                <StarHalf
                  className={cn(
                    sizeClasses[size],
                    "absolute inset-0 text-amber-400 fill-amber-400"
                  )}
                />
              </div>
            ) : (
              <Star
                className={cn(
                  sizeClasses[size],
                  isFull
                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.3)]"
                    : "fill-border/30 text-text-muted/50"
                )}
              />
            )}
          </button>
        );
      })}

      {showScore && (
        <span className="ml-1.5 text-xs font-bold text-text-primary">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export function InteractiveRatingStars(props: Omit<RatingStarsProps, "interactive">) {
  return <RatingStars {...props} interactive={true} />;
}
