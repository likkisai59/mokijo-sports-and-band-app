"use client";

import * as React from "react";
import { ChartDataPoint } from "@/types/artist";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format-currency";

interface RevenueChartWidgetProps {
  data: ChartDataPoint[];
}

export function RevenueChartWidget({ data }: RevenueChartWidgetProps) {
  const [activeIdx, setActiveIdx] = React.useState<number | null>(null);

  // Guard: empty data array — avoid Math.max(...[]) = -Infinity
  const hasData = data && data.length > 0;
  const maxRevenue = hasData ? Math.max(...data.map(d => d.revenue), 1) : 1;

  return (
    <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 shadow-xl h-full">
      <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary">
          Monthly Revenue Performance
        </CardTitle>
        <span className="text-[10px] text-text-muted bg-bg-elevated border border-border px-2 py-0.5 rounded-full">
          Last 6 Months
        </span>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {!hasData ? (
          <div className="h-56 flex flex-col items-center justify-center gap-2 text-center">
            <span className="text-2xl">📊</span>
            <p className="text-sm font-semibold text-text-secondary">No revenue data yet</p>
            <p className="text-xs text-text-muted">Once you complete bookings, your monthly earnings will appear here.</p>
          </div>
        ) : (
          <>
            {/* Render interactive bars */}
            <div className="h-56 flex items-end gap-3 sm:gap-6 pt-6 px-2 relative border-b border-border/60">
              
              {/* Grid lines helper */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                <div className="w-full border-t border-border/40" />
                <div className="w-full border-t border-border/40" />
                <div className="w-full border-t border-border/40" />
                <div className="w-full border-t border-border/40" />
              </div>

              {data.map((item, idx) => {
                const percentage = (item.revenue / maxRevenue) * 100;
                const isActive = activeIdx === idx;

                return (
                  <div 
                    key={item.month} 
                    className="flex-1 flex flex-col items-center gap-2 group cursor-pointer relative"
                    onMouseEnter={() => setActiveIdx(idx)}
                    onMouseLeave={() => setActiveIdx(null)}
                  >
                    {/* Tooltip on hover */}
                    {isActive && (
                      <div className="absolute -top-12 bg-bg-elevated text-text-primary border border-border text-[10px] font-bold py-1 px-2 rounded-lg shadow-lg z-10 before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-border">
                        <p className="truncate">{formatCurrency(item.revenue)}</p>
                        <p className="text-[8px] text-text-secondary">{item.bookings} gigs done</p>
                      </div>
                    )}

                    {/* Animated Bar */}
                    <div className="w-full relative rounded-t-lg overflow-hidden bg-bg-elevated/40 border border-border/50 h-44 flex items-end">
                      <div 
                        className={`w-full rounded-t-lg bg-linear-to-t from-primary/70 to-primary transition-all duration-500 ease-out group-hover:from-primary group-hover:to-primary-light`}
                        style={{ height: `${percentage}%` }}
                      />
                    </div>

                    {/* Label */}
                    <span className={`text-[10px] font-bold transition-colors ${isActive ? "text-primary" : "text-text-secondary"}`}>
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend / Metrics */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-bg-elevated/20 border border-border/50 rounded-xl space-y-1">
                <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider block">Peak Month</span>
                <span className="text-sm font-extrabold text-text-primary block">
                  {data.find(d => d.revenue === maxRevenue)?.month || "N/A"}
                </span>
              </div>
              <div className="p-3 bg-bg-elevated/20 border border-border/50 rounded-xl space-y-1">
                <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider block">Avg Revenue</span>
                <span className="text-sm font-extrabold text-text-primary block">
                  {formatCurrency(data.reduce((acc, d) => acc + d.revenue, 0) / data.length)}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
