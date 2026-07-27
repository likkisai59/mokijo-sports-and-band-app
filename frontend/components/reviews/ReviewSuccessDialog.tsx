"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface ReviewSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export function ReviewSuccessDialog({
  open,
  onOpenChange,
  className
}: ReviewSuccessDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={cn(
          "w-full max-w-sm rounded-2xl border border-border bg-bg-elevated p-6 shadow-2xl text-center space-y-4 text-text-primary",
          className
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mx-auto">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-text-primary">Review Submitted!</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Thank you for contributing to the BandConnect community. Your review is now live.
          </p>
        </div>
        <Button
          onClick={() => onOpenChange(false)}
          className="w-full text-xs font-bold bg-primary text-white hover:bg-primary-hover transition-colors"
        >
          Close
        </Button>
      </div>
    </div>
  );
}
