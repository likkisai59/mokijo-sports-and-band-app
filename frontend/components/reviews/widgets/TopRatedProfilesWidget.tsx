"use client";

import * as React from "react";
import { TopRatedEntity } from "@/types/review";
import { Trophy, Star, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";

export interface TopRatedProfilesWidgetProps {
  title?: string;
  items: TopRatedEntity[];
  viewAllHref?: string;
  className?: string;
}

export function TopRatedProfilesWidget({
  title = "Top Rated Profiles",
  items,
  viewAllHref,
  className
}: TopRatedProfilesWidgetProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-bg-card p-5 shadow-sm space-y-3 relative overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">{title}</h4>
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-0.5 text-xs text-primary hover:underline font-semibold"
          >
            <span>Explore</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-text-muted italic py-4 text-center">No profile rankings available.</p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 5).map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-bg-elevated/40 hover:border-border transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="w-5 text-center text-xs font-extrabold text-primary">#{idx + 1}</span>
                <div>
                  <h5 className="text-xs font-bold text-text-primary leading-tight">{item.name}</h5>
                  <span className="text-[10px] uppercase font-semibold text-text-muted">
                    {item.entity_type} • {item.total_reviews} reviews
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-black text-amber-400">{item.average_rating.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
