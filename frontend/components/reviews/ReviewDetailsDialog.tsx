"use client";

import * as React from "react";
import { Review } from "@/types/review";
import { ReviewRating } from "./ReviewRating";
import { ReviewAuthor } from "./ReviewAuthor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CornerDownRight, Play, X, ShieldCheck } from "lucide-react";
import { cn } from "@/utils/cn";

export interface ReviewDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: Review | null;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
  onReply?: (review: Review) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canReply?: boolean;
  className?: string;
}

export function ReviewDetailsDialog({
  open,
  onOpenChange,
  review,
  onEdit,
  onDelete,
  onReply,
  canEdit = false,
  canDelete = false,
  canReply = false,
  className
}: ReviewDetailsDialogProps) {
  const [activeMedia, setActiveMedia] = React.useState<{ src: string; type: "image" | "video" } | null>(null);

  if (!review) return null;

  const reviewerName = review.reviewer?.name || review.client?.name || "Verified Customer";
  const images = review.images || [];
  const videos = review.videos || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-xl rounded-2xl bg-bg-card p-6 border border-border shadow-2xl space-y-4 text-text-primary", className)}>
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-3">
          <DialogTitle className="text-base font-bold text-text-primary">
            Review Details
          </DialogTitle>
        </DialogHeader>

        {/* Author Header */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <ReviewAuthor
            name={reviewerName}
            role={review.reviewer_role}
            createdAt={review.created_at}
          />
          <ReviewRating rating={review.rating} size="md" />
        </div>

        {/* Title & Content */}
        <div className="space-y-2 py-2">
          {review.review_title && (
            <h4 className="text-base font-extrabold text-text-primary leading-snug">
              {review.review_title}
            </h4>
          )}
          <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line bg-bg-elevated/40 p-4 rounded-xl border border-border/40">
            {review.review_text || review.comment || "No written review text provided."}
          </p>
        </div>

        {/* Media Attachments */}
        {(images.length > 0 || videos.length > 0) && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Photos & Media Attachments ({images.length + videos.length})
            </span>
            <div className="flex flex-wrap gap-2.5">
              {images.map((img, idx) => (
                <button
                  key={`img-${idx}`}
                  onClick={() => setActiveMedia({ src: img, type: "image" })}
                  className="h-20 w-20 rounded-xl overflow-hidden border border-border bg-bg-elevated hover:scale-105 transition-transform"
                >
                  <img src={img} alt="Attachment" className="h-full w-full object-cover" />
                </button>
              ))}
              {videos.map((vid, idx) => (
                <button
                  key={`vid-${idx}`}
                  onClick={() => setActiveMedia({ src: vid, type: "video" })}
                  className="h-20 w-20 rounded-xl overflow-hidden border border-border bg-bg-elevated relative flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <video src={vid} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                    <Play className="h-5 w-5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reply Section */}
        {review.reply_comment && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-bold text-primary">
              <div className="flex items-center gap-1.5">
                <CornerDownRight className="h-4 w-4" />
                <span>Response Reply</span>
              </div>
              {review.reply_at && (
                <span className="text-[10px] text-text-muted font-normal">
                  {new Date(review.reply_at).toLocaleDateString()}
                </span>
              )}
            </div>
            <p className="text-text-secondary leading-relaxed pl-5">{review.reply_comment}</p>
          </div>
        )}

        {/* Footer info & actions */}
        <div className="flex items-center justify-between border-t border-border/40 pt-4 text-xs">
          <div className="flex items-center gap-2 text-[11px] text-text-muted">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Verified Booking #{review.booking_id?.slice(0, 8)}</span>
          </div>

          <div className="flex items-center gap-2">
            {canReply && onReply && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onReply(review);
                }}
                className="text-xs text-primary border-primary/40 hover:bg-primary/10"
              >
                Respond
              </Button>
            )}

            {canEdit && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(review);
                }}
                className="text-xs"
              >
                Edit
              </Button>
            )}

            {canDelete && onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onDelete(review);
                }}
                className="text-xs text-rose-500 border-rose-500/40 hover:bg-rose-500/10"
              >
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Media Lightbox overlay */}
        {activeMedia && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <button
              onClick={() => setActiveMedia(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
            >
              <X className="h-6 w-6" />
            </button>
            {activeMedia.type === "image" ? (
              <img src={activeMedia.src} alt="Enlarged preview" className="max-h-[80vh] max-w-[90vw] rounded-xl object-contain" />
            ) : (
              <video src={activeMedia.src} controls autoPlay className="max-h-[80vh] max-w-[90vw] rounded-xl" />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
