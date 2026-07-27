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
import { ReportReasonBadge, ReviewVisibilityBadge } from "./ReportReasonBadge";
import { ReviewReport } from "@/types/review";
import { Star, ShieldAlert, EyeOff, CheckCircle, Trash2, MessageSquare } from "lucide-react";
import { formatDate } from "@/utils/format-date";
import { useReviewModeration } from "@/hooks/use-review-moderation";

interface ReportDetailsDialogProps {
  report: ReviewReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ReportDetailsDialog({
  report,
  open,
  onOpenChange,
  onSuccess
}: ReportDetailsDialogProps) {
  const [moderatorNotes, setModeratorNotes] = React.useState<string>("");
  const { updateReport, hideReview, restoreReview, removeReview, submitting } = useReviewModeration();

  if (!report) return null;

  const review = report.review;
  const rating = review?.rating ?? 5;
  const comment = review?.review_text || review?.comment || "No content.";

  const handleAction = async (action: "approve" | "dismiss" | "hide" | "restore" | "remove" | "archive") => {
    try {
      if (action === "hide") {
        await hideReview(report.review_id, moderatorNotes);
      } else if (action === "restore") {
        await restoreReview(report.review_id, moderatorNotes);
      } else if (action === "remove") {
        await removeReview(report.review_id, moderatorNotes);
      } else {
        await updateReport(report.id, {
          action,
          moderator_notes: moderatorNotes.trim() || undefined
        });
      }
      onOpenChange(false);
      setModeratorNotes("");
      if (onSuccess) onSuccess();
    } catch {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-bg-card/95 backdrop-blur-xl border border-border/80 text-text-primary rounded-2xl shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-text-primary">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Report Inspection & Moderation Action
            </DialogTitle>
            <div className="flex items-center gap-2">
              <ReportReasonBadge reason={report.reason} />
              {review?.moderation_status && (
                <ReviewVisibilityBadge status={review.moderation_status} />
              )}
            </div>
          </div>
          <DialogDescription className="text-xs text-text-secondary">
            Inspect reported review payload, flag details, reporter notes, and trigger moderation visibility actions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Review Details Box */}
          <div className="bg-bg-surface/60 border border-border/70 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold uppercase tracking-wider text-[10px] text-text-muted">
                Original Review Content
              </span>
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    className={`h-3.5 w-3.5 ${
                      idx < rating ? "fill-amber-400 text-amber-400" : "text-border"
                    }`}
                  />
                ))}
                <span className="font-bold text-text-primary ml-1">{rating}.0</span>
              </div>
            </div>

            {review?.review_title && (
              <h4 className="font-bold text-text-primary text-sm">{review.review_title}</h4>
            )}
            <p className="text-text-secondary leading-relaxed bg-bg-card/50 p-3 rounded-lg border border-border/40 italic">
              {`"${comment}"`}
            </p>

            <div className="flex justify-between text-[11px] text-text-muted pt-1">
              <span>Author: {review?.reviewer?.name || review?.client?.name || "Client"}</span>
              <span>Submitted: {review?.created_at ? formatDate(review.created_at) : "N/A"}</span>
            </div>
          </div>

          {/* Report Context Box */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="font-bold text-amber-400">Reported By: {report.reporter?.name || "User"}</span>
              <span className="text-text-muted">{formatDate(report.created_at)}</span>
            </div>
            {report.description ? (
              <p className="text-text-secondary">{report.description}</p>
            ) : (
              <p className="text-text-muted italic text-[11px]">No additional description provided by reporter.</p>
            )}
          </div>

          {/* Moderator Notes Input */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              Moderator Audit Notes
            </Label>
            <Textarea
              value={moderatorNotes}
              onChange={(e) => setModeratorNotes(e.target.value)}
              placeholder="Record audit reason or policy note for this moderation action..."
              rows={2}
              className="text-xs bg-bg-surface/50 border-border/70 rounded-xl resize-none"
            />
          </div>
        </div>

        <DialogFooter className="pt-2 flex flex-wrap justify-between items-center gap-2 border-t border-border/40">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="text-xs h-9"
          >
            Cancel
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAction("dismiss")}
              disabled={submitting}
              className="text-xs h-9 bg-gray-500/10 text-gray-300 border-gray-500/30"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              Dismiss Report
            </Button>

            {review?.moderation_status === "hidden" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAction("restore")}
                disabled={submitting}
                className="text-xs h-9 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Restore Public
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAction("hide")}
                disabled={submitting}
                className="text-xs h-9 bg-orange-500/10 text-orange-400 border-orange-500/30 font-bold"
              >
                <EyeOff className="h-3.5 w-3.5 mr-1" />
                Hide Review
              </Button>
            )}

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => handleAction("remove")}
              disabled={submitting}
              className="text-xs h-9 font-bold flex items-center gap-1"
            >
              {submitting ? (
                <Spinner className="h-3.5 w-3.5 text-white" />
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove Review</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
