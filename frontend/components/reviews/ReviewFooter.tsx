"use client";

import * as React from "react";
import { ShieldCheck, Calendar } from "lucide-react";
import { cn } from "@/utils/cn";

export interface ReviewFooterProps {
  createdAt?: string | null;
  bookingId?: string | null;
  isVerified?: boolean;
  replyAt?: string | null;
  className?: string;
}

export function ReviewFooter({
  createdAt,
  bookingId,
  isVerified = true,
  replyAt: _replyAt,
  className
}: ReviewFooterProps) {
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : null;

  return (
    <div className={cn("flex items-center justify-between gap-3 text-[11px] text-text-muted border-t border-border/40 pt-3 mt-3", className)}>
      <div className="flex items-center gap-3">
        {formattedDate && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formattedDate}</span>
          </span>
        )}
        {bookingId && (
          <span className="text-[10px] uppercase font-mono text-text-muted/80 bg-bg-elevated px-1.5 py-0.5 rounded">
            Booking #{bookingId.slice(0, 8)}
          </span>
        )}
      </div>

      {isVerified && (
        <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Verified Platform Stay & Performance</span>
        </span>
      )}
    </div>
  );
}
