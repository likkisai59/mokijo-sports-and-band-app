"use client";

import * as React from "react";
import { ReviewTrendPoint } from "@/types/review";
import { BarChart3 } from "lucide-react";
import { cn } from "@/utils/cn";

export interface ReviewActivityChartProps {
  data: ReviewTrendPoint[];
  className?: string;
}

export function ReviewActivityChart({ data, className }: ReviewActivityChartProps) {
  const maxVolume = data.length > 0 ? Math.max(...data.map((d) => d.count), 1) : 1;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-bg-card p-5 shadow-sm space-y-4 relative overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Platform Review Volume Activity
          </h4>
        </div>
        <span className="text-[10px] text-text-muted font-bold">Monthly Submissions</span>
      </div>

      <div className="h-40 flex items-end gap-4 pt-4 px-2 relative border-b border-border/40">
        {data.map((item, idx) => {
          const heightPct = (item.count / maxVolume) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
              <div className="w-full rounded-t-lg bg-bg-elevated/40 border border-border/40 h-28 flex items-end overflow-hidden">
                <div
                  className="w-full rounded-t-lg bg-primary/80 group-hover:bg-primary transition-all duration-300"
                  style={{ height: `${Math.max(10, heightPct)}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-text-muted truncate">{item.period}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
