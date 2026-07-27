"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={cn(
            "absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 scale-100 rounded bg-bg-elevated border border-border px-3 py-1.5 text-xs text-text-primary shadow-md transition-all duration-200 animate-in fade-in duration-100 whitespace-nowrap",
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
