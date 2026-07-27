"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Flag, ShieldAlert } from "lucide-react";
import { useReviewModeration } from "@/hooks/use-review-moderation";
import { ReportReason } from "@/types/review";

interface ReportReviewDialogProps {
  reviewId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const REPORT_REASONS: ReportReason[] = [
  "Spam",
  "Harassment",
  "Abusive Language",
  "Hate Speech",
  "Discrimination",
  "Violence",
  "Fake Review",
  "Sexual Content",
  "Personal Information",
  "Copyright",
  "Scam",
  "Other"
];

export function ReportReviewDialog({
  reviewId,
  open,
  onOpenChange,
  onSuccess
}: ReportReviewDialogProps) {
  const [selectedReason, setSelectedReason] = React.useState<ReportReason>("Harassment");
  const [description, setDescription] = React.useState<string>("");
  const { reportReview, submitting } = useReviewModeration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await reportReview(reviewId, {
        reason: selectedReason,
        description: description.trim() || undefined
      });
      onOpenChange(false);
      setDescription("");
      if (onSuccess) onSuccess();
    } catch {
      // Error handled in hook toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-bg-card/95 backdrop-blur-xl border border-border/80 text-text-primary rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-red-400">
            <Flag className="h-5 w-5" />
            Report Inappropriate Review
          </DialogTitle>
          <DialogDescription className="text-xs text-text-secondary">
            Flag this review for community safety or policy violations. Administrators will review your submission.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Reason Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Select Violation Reason
            </Label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value as ReportReason)}
              className="w-full bg-bg-surface/60 border border-border/80 rounded-xl px-3 py-2 text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r} className="bg-bg-card text-text-primary">
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Detailed Context (Optional)
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details about why this review violates platform terms..."
              rows={3}
              className="text-xs bg-bg-surface/40 border-border/70 rounded-xl resize-none"
            />
          </div>

          <DialogFooter className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={submitting}
              className="text-xs h-9 font-bold flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Spinner className="h-3.5 w-3.5 text-white" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Submit Report</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
