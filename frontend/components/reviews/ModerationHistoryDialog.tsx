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
import { Spinner } from "@/components/ui/spinner";
import { History, Clock, User, MessageSquare } from "lucide-react";
import { useReviewHistory } from "@/hooks/use-review-moderation";
import { formatDate } from "@/utils/format-date";

interface ModerationHistoryDialogProps {
  reviewId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModerationHistoryDialog({
  reviewId,
  open,
  onOpenChange
}: ModerationHistoryDialogProps) {
  const { history, loading, error, refetch } = useReviewHistory(reviewId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-bg-card/95 backdrop-blur-xl border border-border/80 text-text-primary rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-primary">
            <History className="h-5 w-5" />
            Immutable Moderation Audit Log History
          </DialogTitle>
          <DialogDescription className="text-xs text-text-secondary">
            Verifiable chronological trail of administrator actions, status shifts, and policy decision notes.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 max-h-96 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-xs text-text-secondary">
              <Spinner className="h-4 w-4 text-primary" />
              <span>Loading moderation history...</span>
            </div>
          ) : error ? (
            <div className="p-4 text-xs text-red-400 text-center">{error}</div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted">
              No moderation history entries recorded yet.
            </div>
          ) : (
            history.map((log) => (
              <div
                key={log.id}
                className="bg-bg-surface/50 border border-border/60 rounded-xl p-3 space-y-1.5 text-xs hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {log.action}
                    </span>
                    <span className="text-text-muted text-[11px]">
                      {log.old_status || "initial"} → <strong className="text-text-primary">{log.new_status}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-text-muted">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(log.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-text-secondary pt-0.5">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-purple-400" />
                    <span>Moderator: <strong className="text-text-primary">{log.moderator?.name || log.moderated_by.slice(0, 8)}</strong></span>
                  </div>

                  {log.report_id && (
                    <span className="text-[10px] font-mono text-text-muted">Report #{log.report_id.slice(0, 8)}</span>
                  )}
                </div>

                {log.moderator_notes && (
                  <p className="text-[11px] text-text-secondary bg-bg-card/70 border border-border/40 p-2 rounded-lg italic flex items-start gap-1">
                    <MessageSquare className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                    <span>{`"${log.moderator_notes}"`}</span>
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        <DialogFooter className="pt-2 flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={refetch}
            className="text-xs h-8"
          >
            Refresh Logs
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
