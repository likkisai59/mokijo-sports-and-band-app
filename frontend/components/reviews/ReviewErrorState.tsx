"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

export interface ReviewErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ReviewErrorState({
  title = "Failed to load reviews",
  message = "An error occurred while fetching review data. Please try again.",
  onRetry,
  className
}: ReviewErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 text-center space-y-3",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div>
        <h4 className="text-base font-bold text-text-primary">{title}</h4>
        <p className="text-xs text-text-secondary mt-1 max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-2 text-xs flex items-center gap-1.5 border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try Again</span>
        </Button>
      )}
    </div>
  );
}
