"use client";

import * as React from "react";
import { ReviewTrendPoint } from "@/types/review";
import { TrendingUp, Star } from "lucide-react";
import { cn } from "@/utils/cn";

export interface ReviewTrendChartProps {
  data: ReviewTrendPoint[];
  className?: string;
}

export function ReviewTrendChart({ data, className }: ReviewTrendChartProps) {
  const [activeIdx, setActiveIdx] = React.useState<number | null>(null);

  const hasData = data && data.length > 0;
  const maxScore = 5.0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-bg-card p-5 shadow-sm space-y-4 relative overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Rating Performance Trend
          </h4>
        </div>
        <span className="text-[10px] font-semibold text-text-muted bg-bg-elevated border border-border/60 px-2 py-0.5 rounded-full">
          Historical Timeline
        </span>
      </div>

      {!hasData ? (
        <div className="h-48 flex items-center justify-center text-xs text-text-muted italic">
          No rating trend history available yet.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="h-48 flex items-end gap-3 sm:gap-6 pt-6 px-2 relative border-b border-border/40">
            {/* Horizontal grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30">
              <div className="w-full border-t border-border/40" />
              <div className="w-full border-t border-border/40" />
              <div className="w-full border-t border-border/40" />
            </div>

            {data.map((item, idx) => {
              const heightPct = Math.max(15, (item.average_rating / maxScore) * 100);
              const isActive = activeIdx === idx;

              return (
                <div
                  key={item.period || idx}
                  className="flex-1 flex flex-col items-center gap-2 group cursor-pointer relative"
                  onMouseEnter={() => setActiveIdx(idx)}
                  onMouseLeave={() => setActiveIdx(null)}
                >
                  {/* Tooltip */}
                  {isActive && (
                    <div className="absolute -top-12 bg-bg-elevated text-text-primary border border-border/80 text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-xl z-20 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>{item.average_rating.toFixed(1)} / 5.0</span>
                      </div>
                      <span className="text-[9px] text-text-muted block font-medium">
                        {item.count} reviews in {item.period}
                      </span>
                    </div>
                  )}

                  {/* Bar */}
                  <div className="w-full relative rounded-t-xl overflow-hidden bg-bg-elevated/40 border border-border/40 h-36 flex items-end">
                    <div
                      className={cn(
                        "w-full rounded-t-xl transition-all duration-500 bg-linear-to-t from-primary/70 via-primary to-primary-light",
                        isActive && "from-primary to-emerald-400"
                      )}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>

                  <span
                    className={cn(
                      "text-[10px] font-bold truncate transition-colors",
                      isActive ? "text-primary" : "text-text-muted"
                    )}
                  >
                    {item.period}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
            <span>Score Baseline: 1.0 - 5.0</span>
            <span className="font-semibold text-emerald-500">Positive Score Trajectory</span>
          </div>
        </div>
      )}
    </div>
  );
}
