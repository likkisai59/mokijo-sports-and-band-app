"use client";

import * as React from "react";
import { Review } from "@/types/review";
import { CompactReviewCard } from "../CompactReviewCard";
import { ReviewSkeleton } from "../ReviewSkeleton";
import { MessageSquare, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";

export interface RecentReviewsWidgetProps {
  reviews: Review[];
  loading?: boolean;
  viewAllHref?: string;
  onReviewClick?: (review: Review) => void;
  className?: string;
}

export function RecentReviewsWidget({
  reviews,
  loading = false,
  viewAllHref,
  onReviewClick,
  className
}: RecentReviewsWidgetProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-bg-card p-5 shadow-sm space-y-4",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span>Recent Reviews</span>
          </h3>
          <p className="text-[11px] text-text-muted">Latest feedback from recent gigs & bookings.</p>
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

      {loading ? (
        <div className="space-y-2">
          <ReviewSkeleton count={2} />
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-8 text-center text-xs text-text-muted italic border border-dashed border-border/60 rounded-xl">
          No recent reviews submitted yet.
        </div>
      ) : (
        <div className="space-y-2.5">
          {reviews.slice(0, 3).map((rev) => (
            <CompactReviewCard
              key={rev.id}
              reviewerName={rev.reviewer?.name || rev.client?.name || "Verified Customer"}
              rating={rev.rating}
              title={rev.review_title}
              comment={rev.review_text || rev.comment}
              createdAt={rev.created_at}
              onClick={() => onReviewClick?.(rev)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
