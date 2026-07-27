"use client";

import * as React from "react";
import { Sparkles, ThumbsUp, CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/cn";

export interface ReviewInsightsPanelProps {
  categoryScores?: {
    punctuality?: number;
    acoustics?: number;
    communication?: number;
    professionalism?: number;
  };
  className?: string;
}

export function ReviewInsightsPanel({ categoryScores, className }: ReviewInsightsPanelProps) {
  const scores = categoryScores || {
    punctuality: 4.9,
    acoustics: 4.8,
    communication: 5.0,
    professionalism: 4.9
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-bg-card p-5 shadow-sm space-y-4 relative overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Key Quality Insights & Criteria
          </h4>
        </div>
        <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          High Performance
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {Object.entries(scores).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-bg-elevated/30"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="font-bold text-text-primary capitalize">{key}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-text-primary">{value.toFixed(1)}</span>
              <span className="text-[10px] text-text-muted">/ 5.0</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs flex items-center gap-2 text-text-secondary">
        <ThumbsUp className="h-4 w-4 text-primary shrink-0" />
        <span>Performers maintain an exceptional 98%+ client satisfaction rate on communication and timing.</span>
      </div>
    </div>
  );
}
