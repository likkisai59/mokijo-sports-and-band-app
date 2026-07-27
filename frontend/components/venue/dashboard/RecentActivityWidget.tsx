"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookOpen, Star, CreditCard, Bell, Sparkles } from "lucide-react";

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
}

interface RecentActivityWidgetProps {
  activity: ActivityItem[];
}

export function RecentActivityWidget({ activity }: RecentActivityWidgetProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "booking":
        return { icon: BookOpen, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
      case "review":
        return { icon: Star, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" };
      case "payment":
        return { icon: CreditCard, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
      default:
        return { icon: Bell, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" };
    }
  };

  return (
    <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 shadow-xl h-full">
      <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        {activity.length === 0 ? (
          <div className="text-center py-8 text-xs text-text-secondary">
            No recent activity logged.
          </div>
        ) : (
          <div className="relative border-l border-border/60 ml-3 pl-6 space-y-5 py-2">
            {activity.map((act) => {
              const { icon: Icon, color } = getIcon(act.type);
              return (
                <div key={act.id} className="relative group">
                  {/* Timeline Bullet */}
                  <span className={`absolute -left-[35px] top-1 p-1.5 rounded-full border bg-bg-card transition-transform group-hover:scale-110 ${color}`}>
                    <Icon className="h-3 w-3" />
                  </span>
                  
                  {/* Activity Details */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">
                        {act.title}
                      </span>
                      <span className="text-[9px] text-text-muted font-medium whitespace-nowrap bg-bg-elevated/40 border border-border/30 px-2 py-0.5 rounded-full">
                        {act.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      {act.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
