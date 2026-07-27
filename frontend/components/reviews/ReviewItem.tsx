"use client";

import * as React from "react";
import { ReviewAuthor } from "./ReviewAuthor";
import { ReviewRating } from "./ReviewRating";
import { ReviewActions } from "./ReviewActions";
import { ReviewFooter } from "./ReviewFooter";
import { CornerDownRight, Play } from "lucide-react";
import { cn } from "@/utils/cn";

export interface ReviewItemProps {
  id: string;
  reviewerName?: string;
  reviewerRole?: string | null;
  reviewerAvatar?: string | null;
  rating: number;
  title?: string | null;
  text?: string | null;
  createdAt?: string | null;
  bookingId?: string | null;
  replyText?: string | null;
  replyAt?: string | null;
  images?: string[];
  videos?: string[];
  onViewDetails?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReply?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canReply?: boolean;
  onMediaClick?: (src: string, type: "image" | "video") => void;
  className?: string;
}

export function ReviewItem({
  id: _id,
  reviewerName = "Verified Customer",
  reviewerRole,
  reviewerAvatar,
  rating,
  title,
  text,
  createdAt,
  bookingId,
  replyText,
  replyAt,
  images = [],
  videos = [],
  onViewDetails,
  onEdit,
  onDelete,
  onReply,
  canEdit = false,
  canDelete = false,
  canReply = false,
  onMediaClick,
  className
}: ReviewItemProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-bg-card p-5 shadow-sm transition-all hover:border-border hover:shadow-md space-y-3.5 relative",
        className
      )}
    >
      {/* Header: Author & Rating & Actions */}
      <div className="flex items-start justify-between gap-4">
        <ReviewAuthor
          name={reviewerName}
          role={reviewerRole}
          avatarUrl={reviewerAvatar}
          createdAt={createdAt}
        />
        <div className="flex items-center gap-2">
          <ReviewRating rating={rating} size="sm" />
          <ReviewActions
            onView={onViewDetails}
            onEdit={onEdit}
            onDelete={onDelete}
            onReply={onReply}
            canEdit={canEdit}
            canDelete={canDelete}
            canReply={canReply}
          />
        </div>
      </div>

      {/* Review Content */}
      <div className="space-y-1">
        {title && <h5 className="text-sm font-bold text-text-primary">{title}</h5>}
        {text && (
          <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
            {text}
          </p>
        )}
      </div>

      {/* Media Attachments */}
      {(images.length > 0 || videos.length > 0) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {images.map((img, idx) => (
            <button
              key={`img-${idx}`}
              type="button"
              onClick={() => onMediaClick?.(img, "image")}
              className="h-16 w-16 rounded-xl overflow-hidden border border-border/60 bg-bg-elevated transition-transform hover:scale-105 focus:outline-none"
            >
              <img src={img} alt="Review attachment" className="h-full w-full object-cover" />
            </button>
          ))}
          {videos.map((vid, idx) => (
            <button
              key={`vid-${idx}`}
              type="button"
              onClick={() => onMediaClick?.(vid, "video")}
              className="h-16 w-16 rounded-xl overflow-hidden border border-border/60 bg-bg-elevated relative flex items-center justify-center transition-transform hover:scale-105 focus:outline-none"
            >
              <video src={vid} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                <Play className="h-4 w-4" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Host / Artist Response Reply */}
      {replyText && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-1">
          <div className="flex items-center justify-between font-bold text-primary">
            <div className="flex items-center gap-1.5">
              <CornerDownRight className="h-3.5 w-3.5 shrink-0" />
              <span>Official Response</span>
            </div>
            {replyAt && (
              <span className="text-[10px] text-text-muted font-normal">
                {new Date(replyAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <p className="text-text-secondary leading-relaxed pl-5">{replyText}</p>
        </div>
      )}

      {/* Footer */}
      <ReviewFooter createdAt={createdAt} bookingId={bookingId} replyAt={replyAt} />
    </div>
  );
}
