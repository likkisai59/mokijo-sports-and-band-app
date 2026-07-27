"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/utils/cn";

interface ReviewValidationAlertProps {
  message: string;
  type?: "warning" | "error";
  className?: string;
}

export function ReviewValidationAlert({
  message,
  type = "warning",
  className
}: ReviewValidationAlertProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 p-3.5 rounded-xl border text-xs font-medium select-none",
        type === "warning"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
          : "border-rose-500/30 bg-rose-500/10 text-rose-400",
        className
      )}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
