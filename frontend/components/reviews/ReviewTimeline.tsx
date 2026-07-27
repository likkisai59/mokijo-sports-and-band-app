"use client";

import * as React from "react";
import { Review } from "@/types/review";
import { Calendar, Star, CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/cn";

export interface ReviewTimelineProps {
  reviews: Review[];
  className?: string;
}

export function ReviewTimeline({ reviews, className }: ReviewTimelineProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-bg-card p-5 shadow-sm space-y-4 relative overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Review History & Performance Timeline
          </h4>
        </div>
        <span className="text-[10px] text-text-muted font-bold">Chronological Stream</span>
      </div>

      {reviews.length === 0 ? (
        <p className="text-xs text-text-muted italic py-6 text-center">No timeline activity logged.</p>
      ) : (
        <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
          {reviews.slice(0, 6).map((rev) => (
            <div key={rev.id} className="relative group">
              <div className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                <div className="h-1 w-1 rounded-full bg-primary" />
              </div>

              <div className="rounded-xl border border-border/40 bg-bg-elevated/40 p-3.5 space-y-1.5 hover:border-border transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary">
                      {rev.reviewer?.name || rev.client?.name || "Verified Customer"}
                    </span>
                    <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-black text-text-primary">{rev.rating.toFixed(1)}</span>
                  </div>
                </div>

                {rev.review_title && (
                  <h5 className="text-xs font-bold text-text-primary">{rev.review_title}</h5>
                )}

                <p className="text-xs text-text-secondary line-clamp-2">
                  {rev.review_text || rev.comment}
                </p>

                <div className="text-[10px] text-text-muted pt-1">
                  {new Date(rev.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
