"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/utils/cn";

export interface DeleteReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewId?: string | null;
  onConfirm: (id: string) => Promise<boolean>;
  className?: string;
}

export function DeleteReviewDialog({
  open,
  onOpenChange,
  reviewId,
  onConfirm,
  className
}: DeleteReviewDialogProps) {
  const [deleting, setDeleting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  if (!reviewId) return null;

  const handleConfirm = async () => {
    setErrorMsg(null);
    setDeleting(true);
    try {
      const success = await onConfirm(reviewId);
      if (success) {
        onOpenChange(false);
      } else {
        setErrorMsg("Failed to delete review. Please try again.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete review.";
      setErrorMsg(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-md rounded-2xl bg-bg-card p-6 border border-border shadow-2xl space-y-4 text-text-primary", className)}>
        <DialogHeader className="flex flex-row items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-text-primary">
              Delete Review?
            </DialogTitle>
            <p className="text-xs text-text-secondary">
              This action cannot be undone. Your rating and comment will be permanently removed.
            </p>
          </div>
        </DialogHeader>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={deleting}
            onClick={handleConfirm}
            className="text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
          >
            {deleting ? "Deleting..." : "Permanently Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ReviewConfirmationDialog(props: DeleteReviewDialogProps) {
  return <DeleteReviewDialog {...props} />;
}
