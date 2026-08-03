"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Ban, Sparkles } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isPast, isToday } from "date-fns";

export function BookingCalendarView({ availability = {}, onDateSelect }) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const blockedDates = availability.blocked_dates || [];
  const holidays = availability.holidays || [];
  const confirmedGigs = ["2026-07-20", "2026-07-28", "2026-08-05"]; // Mocked confirmed gigs

  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  const offset = getDay(start);
  const emptyDays = Array.from({ length: offset });

  return (
    <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 shadow-xl w-full max-w-2xl mx-auto">
      <CardHeader className="pb-3 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary">
            Select a Date
          </CardTitle>
          <span className="text-[10px] text-text-muted block">
            Click on an available date to request a booking.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8 cursor-pointer">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-bold text-text-primary min-w-20 text-center uppercase tracking-wider">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8 cursor-pointer">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-5">
        <div className="flex flex-wrap gap-3 border-b border-border/40 pb-3 text-[11px] font-bold">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-blue-500/10 border-blue-500/30 text-blue-400">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block" />
            <span>Busy</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-red-500/10 border-red-500/30 text-red-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 block" />
            <span>Blocked</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-amber-500/10 border-amber-500/30 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block" />
            <span>Holiday</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-extrabold uppercase tracking-wider text-text-muted mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {emptyDays.map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square bg-transparent" />
          ))}

          {days.map(day => {
            const isoString = format(day, "yyyy-MM-dd");
            
            const isGig = confirmedGigs.includes(isoString);
            const isBlocked = blockedDates.includes(isoString);
            const isHoliday = holidays.includes(isoString);
            const isPastDay = isPast(day) && !isToday(day);

            const isUnavailable = isGig || isBlocked || isHoliday || isPastDay;

            let styleClass = "bg-bg-elevated/20 text-text-primary hover:border-primary cursor-pointer hover:bg-bg-elevated/40";
            if (isGig) {
              styleClass = "bg-blue-500 border-blue-600 text-white cursor-not-allowed opacity-80";
            } else if (isBlocked) {
              styleClass = "bg-red-500 border-red-600 text-white cursor-not-allowed opacity-80";
            } else if (isHoliday) {
              styleClass = "bg-amber-500 border-amber-600 text-white cursor-not-allowed opacity-80";
            } else if (isPastDay) {
              styleClass = "bg-bg-elevated/5 text-text-muted cursor-not-allowed opacity-30";
            }

            return (
              <button
                key={isoString}
                type="button"
                disabled={isUnavailable}
                onClick={() => {
                  if (!isUnavailable && onDateSelect) {
                    onDateSelect(isoString);
                  }
                }}
                className={`aspect-square border border-border/60 rounded-xl flex flex-col items-center justify-center p-1.5 text-xs font-bold transition-all relative ${styleClass}`}
              >
                <span>{format(day, "d")}</span>
                
                {isGig && <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-white opacity-80" />}
                {isBlocked && <Ban className="absolute bottom-1 h-3 w-3 text-white/70" />}
                {isHoliday && <Sparkles className="absolute bottom-1 h-3 w-3 text-white/70" />}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
