"use client";

import * as React from "react";
import { RoleComparison } from "@/types/review";
import { Users, Star } from "lucide-react";
import { cn } from "@/utils/cn";

export interface RoleComparisonChartProps {
  data: RoleComparison[];
  className?: string;
}

export function RoleComparisonChart({ data, className }: RoleComparisonChartProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-bg-card p-5 shadow-sm space-y-4 relative overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-500" />
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Rating Distribution by Portal Role
          </h4>
        </div>
        <span className="text-[10px] text-text-muted font-bold">Cross-Role Analytics</span>
      </div>

      <div className="space-y-3">
        {data.map((item, idx) => {
          const widthPct = (item.average_rating / 5.0) * 100;
          return (
            <div key={idx} className="space-y-1 text-xs">
              <div className="flex items-center justify-between font-bold text-text-primary">
                <span>{item.role}</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>{item.average_rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-bg-elevated/60 overflow-hidden border border-border/40">
                <div
                  className="h-full rounded-full bg-linear-to-r from-primary via-emerald-500 to-teal-400"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
