"use client";

import * as React from "react";
import { MostReviewedEntity } from "@/types/review";
import { MessageSquare, Star } from "lucide-react";
import { cn } from "@/utils/cn";

export interface MostReviewedWidgetProps {
  title?: string;
  items: MostReviewedEntity[];
  className?: string;
}

export function MostReviewedWidget({
  title = "Most Reviewed Performers & Venues",
  items,
  className
}: MostReviewedWidgetProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-bg-card p-5 shadow-sm space-y-3 relative overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">{title}</h4>
        </div>
        <span className="text-[10px] text-text-muted font-bold">Volume Leaderboard</span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-text-muted italic py-4 text-center">No review volume records.</p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 5).map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-bg-elevated/40 hover:border-border transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="w-5 text-center text-xs font-black text-text-muted">#{idx + 1}</span>
                <div>
                  <h5 className="text-xs font-bold text-text-primary leading-tight">{item.name}</h5>
                  <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                    <span className="capitalize">{item.entity_type}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                      <Star className="h-3 w-3 fill-amber-400" />
                      {item.average_rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-black text-text-primary block">{item.total_reviews}</span>
                <span className="text-[9px] uppercase font-bold text-text-muted">Reviews</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
