"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

interface ReviewLoadingProps {
  label?: string;
  className?: string;
}

export function ReviewLoading({ label = "Loading reviews...", className }: ReviewLoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center text-text-secondary select-none", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}
