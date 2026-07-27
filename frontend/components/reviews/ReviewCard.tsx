"use client";

import * as React from "react";
import { User, CornerDownRight, Calendar } from "lucide-react";
import { RatingStars } from "./RatingStars";
import { ReviewBadge } from "./ReviewBadge";
import { cn } from "@/utils/cn";

interface ReviewCardProps {
  reviewerName?: string;
  reviewerRole?: string;
  rating: number;
  title?: string | null;
  text?: string | null;
  createdAt?: string;
  replyText?: string | null;
  replyAt?: string | null;
  images?: string[];
  videos?: string[];
  className?: string;
}

export function ReviewCard({
  reviewerName = "Verified Customer",
  reviewerRole,
  rating,
  title,
  text,
  createdAt,
  replyText,
  replyAt,
  images = [],
  videos = [],
  className
}: ReviewCardProps) {
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    : null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-bg-card p-5 shadow-sm transition-all hover:border-border",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary">{reviewerName}</h4>
            {reviewerRole && (
              <span className="text-[11px] uppercase tracking-wider font-semibold text-text-muted">
                {reviewerRole}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RatingStars rating={rating} size="sm" />
          <ReviewBadge rating={rating} size="sm" />
        </div>
      </div>

      {/* Title & Body Text */}
      <div className="mt-3.5 space-y-1.5">
        {title && <h5 className="text-sm font-semibold text-text-primary">{title}</h5>}
        {text && <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">{text}</p>}
      </div>

      {/* Media thumbnails */}
      {(images.length > 0 || videos.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt="Review asset"
              className="h-14 w-14 rounded-lg object-cover border border-border/50"
            />
          ))}
        </div>
      )}

      {/* Date */}
      {formattedDate && (
        <div className="mt-4 flex items-center gap-1 text-[11px] text-text-muted">
          <Calendar className="h-3 w-3" />
          <span>{formattedDate}</span>
        </div>
      )}

      {/* Response Reply */}
      {replyText && (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
          <div className="flex items-center justify-between font-bold text-primary mb-1">
            <div className="flex items-center gap-1.5">
              <CornerDownRight className="h-3.5 w-3.5" />
              <span>Response Reply</span>
            </div>
            {replyAt && (
              <span className="text-[10px] text-text-muted font-normal">
                {new Date(replyAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <p className="text-text-secondary">{replyText}</p>
        </div>
      )}
    </div>
  );
}
