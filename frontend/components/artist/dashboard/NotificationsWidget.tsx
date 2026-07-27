"use client";

import * as React from "react";
import { NotificationSummary } from "@/types/artist";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldAlert, CheckCircle } from "lucide-react";

interface NotificationsWidgetProps {
  notifications: NotificationSummary[];
}

export function NotificationsWidget({ notifications }: NotificationsWidgetProps) {
  return (
    <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 shadow-xl h-full">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary">
          Inbox Alert logs
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4 max-h-87.5 overflow-y-auto pr-1">
        {notifications.map((notif) => {
          const isWarning = notif.title.toLowerCase().includes("warn") || notif.title.toLowerCase().includes("request");
          const Icon = isWarning ? ShieldAlert : CheckCircle;
          const colorClass = isWarning ? "text-amber-400" : "text-emerald-400";
          const bgClass = isWarning ? "bg-amber-500/10" : "bg-emerald-500/10";
          
          return (
            <div 
              key={notif.id} 
              className={`p-3.5 rounded-xl border border-border/60 bg-bg-elevated/10 flex gap-3 hover:border-primary/40 transition-colors ${!notif.is_read ? "border-primary/30 bg-primary/5" : ""}`}
            >
              <div className={`p-2 rounded-xl self-start ${bgClass} ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex justify-between items-start gap-2">
                  <span className={`text-xs font-bold text-text-primary block ${!notif.is_read ? "text-primary" : ""}`}>{notif.title}</span>
                  <span className="text-[9px] text-text-muted shrink-0">{notif.created_at}</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {notif.message}
                </p>
              </div>
            </div>
          );
        })}
        {notifications.length === 0 && (
          <div className="text-center py-10 space-y-1">
            <p className="text-sm text-text-secondary font-medium">No new notifications.</p>
            <p className="text-xs text-text-muted">You are fully up to date!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
