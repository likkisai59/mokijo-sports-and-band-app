"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportReasonBadge, ReviewVisibilityBadge } from "./ReportReasonBadge";
import { ReviewReport } from "@/types/review";
import { Star, EyeOff, CheckCircle, Clock, UserCheck } from "lucide-react";
import { formatDate } from "@/utils/format-date";

interface ReportedReviewCardProps {
  report: ReviewReport;
  onSelectReport?: (report: ReviewReport) => void;
  onHide?: (reviewId: string) => void;
  onRestore?: (reviewId: string) => void;
  onDismiss?: (reportId: string) => void;
}

export function ReportedReviewCard({
  report,
  onSelectReport,
  onHide,
  onRestore,
  onDismiss
}: ReportedReviewCardProps) {
  const review = report.review;
  const rating = review?.rating ?? 5;
  const comment = review?.review_text || review?.comment || "No review content provided.";
  const reporterName = report.reporter?.name || "Anonymous User";
  const status = report.status;

  return (
    <Card className="bg-bg-card/40 backdrop-blur-md border border-border/80 rounded-2xl p-4 shadow-sm hover:border-primary/40 transition-all">
      <CardContent className="p-0 space-y-3">
        {/* Header Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/30 pb-2">
          <div className="flex items-center gap-2">
            <ReportReasonBadge reason={report.reason} />
            {review?.moderation_status && (
              <ReviewVisibilityBadge status={review.moderation_status} />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
            <Clock className="h-3 w-3 text-text-muted" />
            <span>{formatDate(report.created_at)}</span>
          </div>
        </div>

        {/* Reported Review Snippet */}
        <div className="bg-bg-surface/50 border border-border/40 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={idx}
                  className={`h-3.5 w-3.5 ${
                    idx < rating ? "fill-amber-400 text-amber-400" : "text-border"
                  }`}
                />
              ))}
              <span className="text-xs font-bold text-text-primary ml-1">{rating}.0</span>
            </div>
            <span className="text-[10px] text-text-muted font-mono">
              Rev ID: {report.review_id.slice(0, 8)}
            </span>
          </div>

          <p className="text-xs text-text-primary line-clamp-2 italic">
            {`"${comment}"`}
          </p>
        </div>

        {/* Reporter Context */}
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <div>
            <span className="text-text-muted">Reported by: </span>
            <span className="font-semibold text-text-primary">{reporterName}</span>
          </div>

          {report.assigned_admin ? (
            <div className="flex items-center gap-1 text-[11px] text-purple-400">
              <UserCheck className="h-3 w-3" />
              <span>Assigned: {report.assigned_admin.name}</span>
            </div>
          ) : (
            <span className="text-[10px] uppercase font-bold text-amber-400/90">
              Status: {status}
            </span>
          )}
        </div>

        {report.description && (
          <p className="text-[11px] text-text-muted bg-amber-500/5 border border-amber-500/10 rounded-lg p-2">
            <span className="font-bold text-amber-400">Reporter Note: </span>
            {report.description}
          </p>
        )}

        {/* Action Controls Toolbar */}
        <div className="flex items-center justify-between pt-1 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectReport?.(report)}
            className="text-[11px] h-8 px-3 font-semibold text-text-primary border-border/80"
          >
            Review Details
          </Button>

          <div className="flex items-center gap-1.5">
            {review?.moderation_status === "hidden" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRestore?.(report.review_id)}
                className="text-[11px] h-8 px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Restore
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onHide?.(report.review_id)}
                className="text-[11px] h-8 px-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/30"
              >
                <EyeOff className="h-3 w-3 mr-1" />
                Hide
              </Button>
            )}

            {onDismiss && status === "pending" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(report.id)}
                className="text-[11px] h-8 px-2 text-text-muted hover:text-text-primary"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
