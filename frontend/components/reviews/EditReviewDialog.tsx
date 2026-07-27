"use client";

import * as React from "react";
import { Review, UpdateReviewPayload } from "@/types/review";
import { RatingStars } from "./RatingStars";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, AlertCircle, Save } from "lucide-react";
import { cn } from "@/utils/cn";

export interface EditReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: Review | null;
  onSubmit: (id: string, payload: UpdateReviewPayload) => Promise<boolean>;
  className?: string;
}

export function EditReviewDialog({
  open,
  onOpenChange,
  review,
  onSubmit,
  className
}: EditReviewDialogProps) {
  const [rating, setRating] = React.useState<number>(5);
  const [title, setTitle] = React.useState<string>("");
  const [comment, setComment] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (review) {
      setRating(review.rating || 5);
      setTitle(review.review_title || "");
      setComment(review.review_text || review.comment || "");
      setErrorMsg(null);
    }
  }, [review]);

  if (!review) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (rating < 1 || rating > 5) {
      setErrorMsg("Please select a valid star rating score between 1 and 5.");
      return;
    }

    setSubmitting(true);
    try {
      const success = await onSubmit(review.id, {
        rating,
        review_title: title.trim(),
        review_text: comment.trim(),
        comment: comment.trim()
      });

      if (success) {
        onOpenChange(false);
      } else {
        setErrorMsg("Failed to update review. Please check inputs.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update review.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-lg rounded-2xl bg-bg-card p-6 border border-border shadow-2xl space-y-4 text-text-primary", className)}>
        <DialogHeader className="flex flex-row items-center gap-3 border-b border-border/40 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Edit3 className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-text-primary">
              Edit Performance Review
            </DialogTitle>
            <p className="text-xs text-text-secondary">Update your rating or written feedback.</p>
          </div>
        </DialogHeader>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Overall Rating</label>
            <div className="flex items-center gap-2">
              <RatingStars rating={rating} size="lg" interactive onRatingChange={setRating} />
              <span className="text-sm font-bold text-text-primary">{rating} / 5</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary">Review Title</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Great show & high energy!"
              className="text-xs bg-bg-card border-border/80"
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary">Review Content</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Provide updated review text..."
              rows={4}
              className="text-xs bg-bg-card border-border/80 resize-none"
            />
          </div>

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
              className="text-xs font-bold bg-primary text-white hover:bg-primary-hover"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
