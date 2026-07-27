"use client";

import * as React from "react";
import { RatingStars } from "./RatingStars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, X, Send, AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";

interface LeaveReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  targetUserId?: string;
  targetRole?: string;
  onSubmit: (data: {
    booking_id: string;
    reviewee_id?: string;
    reviewee_role?: string;
    rating: number;
    review_title: string;
    review_text: string;
  }) => Promise<boolean>;
  className?: string;
}

export function LeaveReviewDialog({
  open,
  onOpenChange,
  bookingId,
  targetUserId,
  targetRole,
  onSubmit,
  className
}: LeaveReviewDialogProps) {
  const [rating, setRating] = React.useState<number>(5);
  const [title, setTitle] = React.useState<string>("");
  const [comment, setComment] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (rating < 1 || rating > 5) {
      setErrorMsg("Please select a rating score between 1 and 5 stars.");
      return;
    }

    setSubmitting(true);
    try {
      const success = await onSubmit({
        booking_id: bookingId,
        reviewee_id: targetUserId,
        reviewee_role: targetRole,
        rating,
        review_title: title.trim(),
        review_text: comment.trim()
      });

      if (success) {
        onOpenChange(false);
        setTitle("");
        setComment("");
        setRating(5);
      } else {
        setErrorMsg("Failed to submit review. Please try again.");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(error.response?.data?.message || error.message || "Review submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={cn(
          "w-full max-w-lg rounded-2xl border border-border bg-bg-elevated p-6 shadow-2xl space-y-4 relative text-text-primary",
          className
        )}
      >
        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">Leave a Performance Review</h3>
            <p className="text-xs text-text-secondary">Share your rating score and thoughts for this completed booking.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Star Rating */}
          <div className="space-y-1.5 text-center sm:text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Overall Rating</label>
            <div className="flex justify-center sm:justify-start">
              <RatingStars rating={rating} size="lg" interactive onRatingChange={setRating} />
            </div>
          </div>

          {/* Review Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary">Review Title (Optional)</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Exceptional acoustics & punctual band!"
              className="text-xs bg-bg-card border-border/80"
              maxLength={100}
            />
          </div>

          {/* Review Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary">Detailed Review & Feedback</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe your experience with performance, timing, communication, and professionalism..."
              rows={4}
              className="text-xs bg-bg-card border-border/80 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="text-xs font-bold bg-primary text-white hover:bg-primary-hover transition-colors"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
