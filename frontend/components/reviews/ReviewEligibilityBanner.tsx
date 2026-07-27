"use client";

import * as React from "react";
import { Star, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewEligibility } from "@/types/review";
import { cn } from "@/utils/cn";

export interface ReviewEligibilityBannerProps {
  bookingId?: string;
  bookingStatus?: string;
  canReview?: boolean;
  eligible?: boolean;
  alreadyReviewed?: boolean;
  reason?: string | null;
  eligibility?: ReviewEligibility | null;
  onOpenReviewModal?: () => void;
  className?: string;
}

export function ReviewEligibilityBanner({
  bookingId: _bookingId,
  bookingStatus = "completed",
  canReview,
  eligible,
  alreadyReviewed = false,
  reason,
  eligibility,
  onOpenReviewModal,
  className
}: ReviewEligibilityBannerProps) {
  const isAlreadyReviewed = alreadyReviewed || (eligibility?.already_reviewed ?? false);
  const isCanReview = canReview ?? eligible ?? (eligibility?.eligible ?? false);
  const displayReason = reason || eligibility?.reason || null;

  if (isAlreadyReviewed) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-semibold select-none",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>Review Submitted — Thank you for your feedback on this performance!</span>
        </div>
      </div>
    );
  }

  if (isCanReview) {
    return (
      <div
        className={cn(
          "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold select-none",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
          <span>This booking is complete! Share your feedback with the community.</span>
        </div>
        {onOpenReviewModal && (
          <Button
            size="sm"
            onClick={onOpenReviewModal}
            className="h-8 text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-colors shrink-0"
          >
            Leave Review
          </Button>
        )}
      </div>
    );
  }

  if (bookingStatus.toLowerCase() !== "completed") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 p-3.5 rounded-xl border border-border/60 bg-bg-card/50 text-text-muted text-xs font-medium select-none",
          className
        )}
      >
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Reviews can only be submitted once the booking status is marked as COMPLETED.</span>
      </div>
    );
  }

  if (displayReason) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs font-medium select-none",
          className
        )}
      >
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{displayReason}</span>
      </div>
    );
  }

  return null;
}
