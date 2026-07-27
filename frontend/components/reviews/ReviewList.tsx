"use client";

import * as React from "react";
import { ReviewItem } from "./ReviewItem";
import { ReviewSkeleton } from "./ReviewSkeleton";
import { ReviewErrorState } from "./ReviewErrorState";
import { ReviewEmptyState } from "./ReviewEmptyState";
import { ReviewPagination } from "./ReviewPagination";
import { Review } from "@/types/review";
import { cn } from "@/utils/cn";

export interface ReviewListProps {
  reviews: Review[];
  loading?: boolean;
  error?: string | null;
  page?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onRefresh?: () => void;
  onViewDetails?: (review: Review) => void;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
  onReply?: (review: Review) => void;
  currentUserId?: string;
  className?: string;
  emptyTitle?: string;
  emptyMessage?: string;
}

export function ReviewList({
  reviews,
  loading = false,
  error = null,
  page = 1,
  totalPages = 1,
  totalCount = 0,
  onPageChange,
  onRefresh,
  onViewDetails,
  onEdit,
  onDelete,
  onReply,
  currentUserId,
  className,
  emptyTitle,
  emptyMessage
}: ReviewListProps) {
  if (loading && reviews.length === 0) {
    return <ReviewSkeleton count={3} className={className} />;
  }

  if (error) {
    return <ReviewErrorState message={error} onRetry={onRefresh} className={className} />;
  }

  if (!loading && reviews.length === 0) {
    return (
      <ReviewEmptyState
        title={emptyTitle}
        description={emptyMessage}
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-4">
        {reviews.map((rev) => {
          const isReviewerOwner = currentUserId && (rev.reviewer_id === currentUserId || rev.client_id === currentUserId);

          return (
            <ReviewItem
              key={rev.id}
              id={rev.id}
              reviewerName={rev.reviewer?.name || rev.client?.name || "Verified Customer"}
              reviewerRole={rev.reviewer_role}
              rating={rev.rating}
              title={rev.review_title}
              text={rev.review_text || rev.comment}
              createdAt={rev.created_at}
              bookingId={rev.booking_id}
              replyText={rev.reply_comment}
              replyAt={rev.reply_at}
              images={rev.images || []}
              videos={rev.videos || []}
              onViewDetails={() => onViewDetails?.(rev)}
              onEdit={() => onEdit?.(rev)}
              onDelete={() => onDelete?.(rev)}
              onReply={() => onReply?.(rev)}
              canEdit={Boolean(isReviewerOwner)}
              canDelete={Boolean(isReviewerOwner)}
              canReply={Boolean(onReply)}
            />
          );
        })}
      </div>

      {totalPages > 1 && onPageChange && (
        <ReviewPagination
          page={page}
          pages={totalPages}
          total={totalCount}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
