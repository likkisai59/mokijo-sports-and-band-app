"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, Clock, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";

interface CalendarWidgetProps {
  overview: {
    todays_events_count: number;
    tomorrows_events_count: number;
    blocked_dates_count: number;
    maintenance_days_count: number;
    availability_summary: string;
  };
}

export function CalendarWidget({ overview }: CalendarWidgetProps) {
  const items = [
    {
      label: "Today's Events",
      value: overview.todays_events_count,
      description: "Scheduled slots today",
      icon: Clock,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20"
    },
    {
      label: "Tomorrow's Events",
      value: overview.tomorrows_events_count,
      description: "Scheduled slots tomorrow",
      icon: Calendar,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20"
    },
    {
      label: "Blocked Dates",
      value: overview.blocked_dates_count,
      description: "Manually blacklisted days",
      icon: ShieldAlert,
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20"
    },
    {
      label: "Maintenance Dates",
      value: overview.maintenance_days_count,
      description: "Days closed for cleaning",
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20"
    }
  ];

  return (
    <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 shadow-xl h-full flex flex-col justify-between">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span>Calendar Summary</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4 flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-2 gap-3">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className={`p-3 rounded-xl border ${item.bg} flex items-center justify-between transition-all duration-300 hover:scale-[1.02]`}
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] text-text-secondary block font-semibold">{item.label}</span>
                  <span className="text-lg font-black text-text-primary block">{item.value}</span>
                  <span className="text-[8px] text-text-muted block">{item.description}</span>
                </div>
                <div className={`p-1.5 rounded-lg bg-bg-elevated ${item.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-bg-elevated/20 border border-border/50 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] text-text-secondary uppercase font-bold block">Status Rules</span>
            <span className="text-xs text-text-primary font-semibold">{overview.availability_summary}</span>
          </div>
          <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full text-emerald-400 text-[10px] font-bold">
            <CheckCircle2 className="h-3 w-3" />
            <span>Active</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
