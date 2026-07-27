"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/utils/cn";

interface ReviewBadgeProps {
  rating: number;
  showIcon?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function ReviewBadge({
  rating,
  showIcon = true,
  size = "md",
  className
}: ReviewBadgeProps) {
  const formattedRating = Number(rating || 0).toFixed(1);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 font-bold rounded-full border shadow-sm select-none",
        rating >= 4.5
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : rating >= 3.5
          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
          : "bg-rose-500/10 text-rose-400 border-rose-500/20",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className
      )}
    >
      {showIcon && <Star className={cn("fill-current", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />}
      <span>{formattedRating}</span>
    </div>
  );
}
