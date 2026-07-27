"use client";

import * as React from "react";
import { MessageSquareOff } from "lucide-react";
import { cn } from "@/utils/cn";

interface ReviewEmptyStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function ReviewEmptyState({
  title = "No Reviews Found",
  description = "No customer feedback or rating score entries matched your filters.",
  className
}: ReviewEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-border bg-bg-card/50 my-4",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
        <MessageSquareOff className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-bold text-text-primary mb-1">{title}</h3>
      <p className="text-xs text-text-secondary max-w-sm leading-relaxed">{description}</p>
    </div>
  );
}
