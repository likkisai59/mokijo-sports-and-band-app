"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, ArrowUpRight, BarChart3, PieChart } from "lucide-react";

interface EventTypeBreakdown {
  name: string;
  value: number;
}

interface MonthlyOccupancyData {
  month: string;
  occupancy: number;
}

interface PerformanceWidgetProps {
  performance: {
    booking_growth: number;
    revenue_growth: number;
    top_event_types: EventTypeBreakdown[];
    monthly_occupancy: MonthlyOccupancyData[];
  };
}

export function PerformanceWidget({ performance }: PerformanceWidgetProps) {
  return (
    <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 shadow-xl h-full space-y-6">
      <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span>Onboarding & Occupancy Performance</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 space-y-6">
        {/* Growth Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-bg-elevated/20 border border-border/50 rounded-xl space-y-1.5">
            <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider block">Booking Growth</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-text-primary">{performance.booking_growth}%</span>
              <span className="text-xs text-emerald-400 font-bold flex items-center">
                <ArrowUpRight className="h-3 w-3" />
                <span>MoM</span>
              </span>
            </div>
          </div>
          <div className="p-3 bg-bg-elevated/20 border border-border/50 rounded-xl space-y-1.5">
            <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider block">Revenue Growth</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-text-primary">{performance.revenue_growth}%</span>
              <span className="text-xs text-emerald-400 font-bold flex items-center">
                <ArrowUpRight className="h-3 w-3" />
                <span>MoM</span>
              </span>
            </div>
          </div>
        </div>

        {/* Occupancy Progress */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Monthly Occupancy Rates</span>
          </div>
          <div className="space-y-2">
            {performance.monthly_occupancy.map((item) => (
              <div key={item.month} className="space-y-1">
                <div className="flex justify-between text-[10px] font-semibold text-text-secondary">
                  <span>{item.month}</span>
                  <span className="text-text-primary">{item.occupancy}%</span>
                </div>
                <div className="w-full bg-bg-elevated border border-border/50 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${item.occupancy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Event Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Top Event Bookings</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {performance.top_event_types.map((type) => (
              <div key={type.name} className="p-2.5 bg-bg-elevated/30 border border-border/40 rounded-xl flex items-center justify-between">
                <span className="text-[10px] text-text-secondary font-semibold">{type.name}</span>
                <span className="text-xs font-black text-text-primary bg-primary/20 border border-primary/30 px-2 py-0.5 rounded-md">
                  {type.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
