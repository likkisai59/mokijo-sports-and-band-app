"use client";

import * as React from "react";
import { UpcomingEvent } from "@/types/artist";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, User } from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";

interface UpcomingEventsWidgetProps {
  events: UpcomingEvent[];
}

export function UpcomingEventsWidget({ events }: UpcomingEventsWidgetProps) {
  return (
    <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 shadow-xl h-full">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary">
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4 max-h-87.5 overflow-y-auto pr-1">
        {events.map((event) => (
          <div 
            key={event.id} 
            className="p-3.5 rounded-xl border border-border/60 bg-bg-elevated/10 space-y-2 hover:border-primary/40 transition-colors"
          >
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs font-bold text-text-primary block">{event.event_name}</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                {event.status}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-text-secondary">
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3 text-text-muted shrink-0" />
                <span className="truncate">Client: {event.client_name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-text-muted shrink-0" />
                <span>{event.date} | {event.time}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:col-span-2">
                <MapPin className="h-3 w-3 text-text-muted shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-border/40 pt-2 text-xs">
              <span className="text-text-muted">Payout amount:</span>
              <span className="font-bold text-text-primary">{formatCurrency(event.amount)}</span>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="text-center py-10 space-y-1">
            <p className="text-sm text-text-secondary font-medium">No upcoming gigs scheduled.</p>
            <p className="text-xs text-text-muted">Once clients book you, they&apos;ll appear here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
