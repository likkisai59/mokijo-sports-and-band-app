"use client";

import * as React from "react";
import { AvailabilityData } from "@/types/artist";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Ban, Sparkles } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isPast, isToday } from "date-fns";
import toast from "react-hot-toast";

interface AvailabilityCalendarProps {
  availability: AvailabilityData;
  onSave: (updated: AvailabilityData) => Promise<void>;
}

export function AvailabilityCalendar({ availability, onSave }: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  
  // Filter states
  const [filterBlocked, setFilterBlocked] = React.useState(true);
  const [filterHolidays, setFilterHolidays] = React.useState(true);
  const [filterGigs, setFilterGigs] = React.useState(true);

  // Parse availability arrays
  const blockedDates = availability.blocked_dates || [];
  const holidays = availability.holidays || [];

  // Mock confirmed gigs dates list for mapping
  const confirmedGigs = ["2026-07-20", "2026-07-28", "2026-08-05"];

  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  // Calculate day offsets for calendar layout (e.g. week starts on Sunday=0)
  const offset = getDay(start);
  const emptyDays = Array.from({ length: offset });

  const handleDayClick = async (day: Date) => {
    if (isPast(day) && !isToday(day)) {
      toast.error("Cannot modify availability for past dates.");
      return;
    }
    const isoString = format(day, "yyyy-MM-dd");
    
    // Check if it's already a confirmed gig (cannot modify)
    if (confirmedGigs.includes(isoString)) {
      toast.error("Cannot modify slots: You have a confirmed booking on this date.");
      return;
    }

    const currentBlocked = [...blockedDates];
    const currentHolidays = [...holidays];

    // Simple workflow: toggle Blocked state -> Holiday state -> Available state
    const isBlocked = currentBlocked.includes(isoString);
    const isHoliday = currentHolidays.includes(isoString);

    if (!isBlocked && !isHoliday) {
      // Mark as Blocked
      currentBlocked.push(isoString);
      toast.success(`Date ${isoString} marked as Blocked.`);
    } else if (isBlocked) {
      // Toggle to Holiday
      const idx = currentBlocked.indexOf(isoString);
      currentBlocked.splice(idx, 1);
      currentHolidays.push(isoString);
      toast.success(`Date ${isoString} marked as Performer Holiday.`);
    } else {
      // Reset to Available
      const idx = currentHolidays.indexOf(isoString);
      currentHolidays.splice(idx, 1);
      toast.success(`Date ${isoString} reset to Available.`);
    }

    try {
      await onSave({
        ...availability,
        blocked_dates: currentBlocked,
        holidays: currentHolidays
      });
    } catch {
      toast.error("Failed to update availability status.");
    }
  };

  return (
    <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 shadow-xl">
      <CardHeader className="pb-3 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary">
            On-Demand Calendar View
          </CardTitle>
          <span className="text-[10px] text-text-muted block">
            Click on a date grid block to toggle between Available, Blocked, or Performer Holiday.
          </span>
        </div>

        {/* Calendar Navigators */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-bold text-text-primary min-w-[80px] text-center uppercase tracking-wider">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-5">
        {/* Interactive Legend Filters */}
        <div className="flex flex-wrap gap-3 border-b border-border/40 pb-3 text-[11px] font-bold">
          <button 
            type="button"
            onClick={() => setFilterGigs(!filterGigs)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${filterGigs ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "opacity-40 text-text-secondary border-transparent"}`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block" />
            <span>Confirmed Gigs</span>
          </button>
          <button 
            type="button"
            onClick={() => setFilterBlocked(!filterBlocked)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${filterBlocked ? "bg-red-500/10 border-red-500/30 text-red-400" : "opacity-40 text-text-secondary border-transparent"}`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 block" />
            <span>Blocked Dates</span>
          </button>
          <button 
            type="button"
            onClick={() => setFilterHolidays(!filterHolidays)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${filterHolidays ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "opacity-40 text-text-secondary border-transparent"}`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block" />
            <span>Holidays</span>
          </button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-extrabold uppercase tracking-wider text-text-muted mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Calendar Day Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Days offset placeholders */}
          {emptyDays.map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square bg-transparent" />
          ))}

          {/* Actual Month days */}
          {days.map(day => {
            const isoString = format(day, "yyyy-MM-dd");
            
            const isGig = confirmedGigs.includes(isoString);
            const isBlocked = blockedDates.includes(isoString);
            const isHoliday = holidays.includes(isoString);
            const isPastDay = isPast(day) && !isToday(day);

            // Determine status styling colors
            let styleClass = "bg-bg-elevated/20 text-text-primary hover:border-primary/20";
            if (isGig && filterGigs) {
              styleClass = "bg-blue-500 border-blue-600 text-white shadow-md shadow-blue-500/20";
            } else if (isBlocked && filterBlocked) {
              styleClass = "bg-red-500 border-red-600 text-white shadow-md shadow-red-500/20";
            } else if (isHoliday && filterHolidays) {
              styleClass = "bg-amber-500 border-amber-600 text-white shadow-md shadow-amber-500/20";
            } else if (isPastDay) {
              styleClass = "bg-bg-elevated/5 text-text-muted cursor-not-allowed opacity-30";
            }

            return (
              <button
                key={isoString}
                type="button"
                disabled={isPastDay}
                onClick={() => handleDayClick(day)}
                className={`aspect-square border border-border/60 rounded-xl flex flex-col items-center justify-between p-1.5 text-xs font-bold transition-all relative ${styleClass}`}
              >
                <span>{format(day, "d")}</span>
                
                {/* Visual indicator bar at bottom */}
                {isGig && filterGigs && <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                {isBlocked && filterBlocked && <Ban className="h-3 w-3 text-text-primary/70" />}
                {isHoliday && filterHolidays && <Sparkles className="h-3 w-3 text-text-primary/70" />}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}


