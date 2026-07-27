"use client";

import * as React from "react";
import { MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

export interface ReviewHeaderProps {
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export function ReviewHeader({
  title = "Performance Reviews & Ratings",
  subtitle = "Read verified customer reviews, ratings, and host feedback.",
  onRefresh,
  action,
  className
}: ReviewHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2", className)}>
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary shrink-0" />
          <span>{title}</span>
        </h2>
        {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 self-start sm:self-center">
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="h-8 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reload</span>
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}
