"use client";

import * as React from "react";
import { ArrowUpRight, ArrowDownRight, Activity, Terminal } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

// ─── Admin Stat Card ─────────────────────────────────────────────────────────

interface AdminStatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
}

export function AdminStatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: AdminStatCardProps) {
  return (
    <Card hover={true}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">{title}</span>
        <Icon className="h-4 w-4 text-text-muted" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black text-text-primary font-heading">{value}</div>
        {(trend || description) && (
          <div className="flex items-center gap-2 mt-2">
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded",
                  trend.isPositive
                    ? "bg-secondary/15 text-secondary border border-secondary/20"
                    : "bg-destructive/15 text-destructive border border-destructive/20"
                )}
              >
                {trend.isPositive ? (
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-0.5" />
                )}
                {trend.value}
              </span>
            )}
            {description && <span className="text-[10px] text-text-muted">{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Recent Activities Widget ────────────────────────────────────────────────

interface ActivityItem {
  id: string;
  action: string;
  user: string;
  time: string;
  status: "success" | "warning" | "error";
}

interface RecentActivitiesProps {
  activities: ActivityItem[];
}

export function AdminRecentActivitiesWidget({ activities }: RecentActivitiesProps) {
  return (
    <Card>
      <CardHeader className="border-b border-border/30">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Terminal className="h-4.5 w-4.5 text-primary" />
          <span>Recent Auditing Log Events</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/30 max-h-80 overflow-y-auto scrollbar-thin">
          {activities.length === 0 ? (
            <div className="p-4 text-center text-xs text-text-muted">No recent audits.</div>
          ) : (
            activities.map((act) => (
              <div key={act.id} className="flex items-center justify-between p-3.5 text-xs">
                <div className="min-w-0 pr-4">
                  <p className="font-bold text-text-primary truncate">{act.action}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">By user: {act.user}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-text-muted">{act.time}</span>
                  <Badge
                    variant={
                      act.status === "success"
                        ? "success"
                        : act.status === "warning"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {act.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Health Check Widget ─────────────────────────────────────────────────────

interface ServiceHealthStatus {
  service: string;
  status: "online" | "degraded" | "offline";
}

export function AdminHealthCheckWidget({ statuses }: { statuses: ServiceHealthStatus[] }) {
  return (
    <Card>
      <CardHeader className="border-b border-border/30">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Activity className="h-4.5 w-4.5 text-secondary" />
          <span>Infrastructure Metrics</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {statuses.map((s) => (
          <div key={s.service} className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text-secondary">{s.service}</span>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  s.status === "online"
                    ? "bg-secondary"
                    : s.status === "degraded"
                    ? "text-accent bg-accent"
                    : "bg-destructive"
                )}
              />
              <span className="text-[10px] font-bold uppercase text-text-primary">{s.status}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
