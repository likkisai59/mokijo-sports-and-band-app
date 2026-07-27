"use client";

import * as React from "react";
import { Calendar, MessageSquarePlus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

export interface PendingReviewItem {
  bookingId: string;
  eventName: string;
  eventDate: string;
  targetName: string;
}

export interface PendingReviewsWidgetProps {
  pendingBookings: PendingReviewItem[];
  onLeaveReview: (bookingId: string) => void;
  className?: string;
}

export function PendingReviewsWidget({
  pendingBookings,
  onLeaveReview,
  className
}: PendingReviewsWidgetProps) {
  if (pendingBookings.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-sm space-y-3",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
          <Clock className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-text-primary">Pending Reviews ({pendingBookings.length})</h4>
          <p className="text-[11px] text-text-secondary">You have completed events waiting for your review.</p>
        </div>
      </div>

      <div className="space-y-2">
        {pendingBookings.slice(0, 2).map((item) => (
          <div
            key={item.bookingId}
            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-bg-card border border-border/60 text-xs"
          >
            <div className="space-y-0.5 overflow-hidden">
              <h5 className="font-bold text-text-primary truncate">{item.eventName}</h5>
              <div className="flex items-center gap-2 text-[10px] text-text-muted">
                <span>{item.targetName}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {item.eventDate}
                </span>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => onLeaveReview(item.bookingId)}
              className="h-8 text-xs font-bold bg-primary text-white hover:bg-primary-hover shrink-0"
            >
              <MessageSquarePlus className="h-3.5 w-3.5 mr-1" />
              Review
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
