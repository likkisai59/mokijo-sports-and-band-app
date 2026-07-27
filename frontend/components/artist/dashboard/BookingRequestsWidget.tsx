"use client";

import * as React from "react";
import { BookingRequest } from "@/types/artist";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User } from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";
import Link from "next/link";

interface BookingRequestsWidgetProps {
  requests: BookingRequest[];
  onAction?: () => void;
}

export function BookingRequestsWidget({ requests }: BookingRequestsWidgetProps) {
  return (
    <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 shadow-xl h-full">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary">
          Recent Gigs Requested
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4 max-h-87.5 overflow-y-auto pr-1">
        {requests.map((req) => (
          <div 
            key={req.id} 
            className="p-3.5 rounded-xl border border-border/60 bg-bg-elevated/10 space-y-2 hover:border-primary/40 transition-colors"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-text-primary block">{req.event_name}</span>
                <span className="text-[10px] text-text-secondary flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-text-muted" />
                  {req.client_name}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                {req.status}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-[10px] text-text-muted flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {req.date}
              </span>
              <span className="font-bold text-text-primary">{formatCurrency(req.amount)}</span>
            </div>

            <div className="flex gap-2 pt-2 border-t border-border/40">
              <Link href="/artist/bookings" className="w-1/2">
                <Button variant="outline" size="sm" className="w-full text-[10px] h-8">
                  Decline
                </Button>
              </Link>
              <Link href="/artist/bookings" className="w-1/2">
                <Button size="sm" className="w-full text-[10px] h-8 bg-primary hover:bg-primary/90 text-white">
                  Accept Gig
                </Button>
              </Link>
            </div>
          </div>
        ))}
        {requests.length === 0 && (
          <div className="text-center py-10 space-y-1">
            <p className="text-sm text-text-secondary font-medium">No pending requests.</p>
            <p className="text-xs text-text-muted">You are all caught up!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
