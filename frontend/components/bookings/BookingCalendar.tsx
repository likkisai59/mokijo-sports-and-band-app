"use client";

import * as React from "react";
import { BookingRequestDetail } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  ListOrdered,
  Layers
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  subDays
} from "date-fns";

interface BookingCalendarProps {
  bookings: BookingRequestDetail[];
  onSelectBooking: (booking: BookingRequestDetail) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function BookingCalendar({
  bookings,
  onSelectBooking
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(new Date());
  const [calendarView, setCalendarView] = React.useState<"month" | "week" | "day">("month");

  // Get active accepted/completed bookings
  const getDayBookings = React.useCallback((date: Date) => {
    return bookings.filter(b => {
      if (b.status !== "accepted" && b.status !== "completed" && b.status !== "confirmed") return false;
      const bDate = new Date(b.event_date);
      return isSameDay(bDate, date);
    });
  }, [bookings]);

  // Navigate back/forward depending on current view mode
  const handlePrev = () => {
    setCurrentDate(prev => {
      if (calendarView === "month") return subMonths(prev, 1);
      if (calendarView === "week") return subWeeks(prev, 1);
      return subDays(prev, 1);
    });
  };

  const handleNext = () => {
    setCurrentDate(prev => {
      if (calendarView === "month") return addMonths(prev, 1);
      if (calendarView === "week") return addWeeks(prev, 1);
      return addDays(prev, 1);
    });
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Month View Grids
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDayOfWeek = monthStart.getDay();
  const padDays = Array.from({ length: startDayOfWeek }, (_, _i) => null);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const monthGrid = [...padDays, ...daysInMonth];

  // Week View Days
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Upcoming chronological bookings list
  const upcomingBookings = React.useMemo(() => {
    return bookings
      .filter(b => b.status === "accepted" || b.status === "confirmed")
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }, [bookings]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar visualizer console */}
      <div className="lg:col-span-2 bg-bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-xl flex flex-col space-y-4">
        {/* Navigation & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/30">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <CalendarIcon className="h-4.5 w-4.5 text-primary animate-pulse" />
              Event Schedule Calendar
            </h3>
            <p className="text-[10px] text-text-muted">
              {calendarView === "month" && format(currentDate, "MMMM yyyy")}
              {calendarView === "week" && `Week of ${format(weekStart, "PP")}`}
              {calendarView === "day" && format(currentDate, "PP")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View selectors */}
            <div className="bg-bg-elevated border border-border p-0.5 rounded-lg flex text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setCalendarView("month")}
                className={`px-2.5 py-1 rounded-md transition-all ${calendarView === "month" ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"}`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setCalendarView("week")}
                className={`px-2.5 py-1 rounded-md transition-all ${calendarView === "week" ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"}`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setCalendarView("day")}
                className={`px-2.5 py-1 rounded-md transition-all ${calendarView === "day" ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"}`}
              >
                Day
              </button>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={handlePrev} className="h-7 w-7">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday} className="text-[9px] font-bold h-7 px-2">
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext} className="h-7 w-7">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* View Grid rendering */}
        {calendarView === "month" && (
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map(day => (
              <span key={day} className="text-[10px] font-bold text-text-muted py-1 uppercase">
                {day}
              </span>
            ))}
            {monthGrid.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="aspect-square bg-transparent rounded-lg border border-transparent" />;
              }

              const dayBookings = getDayBookings(day);
              const active = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(day);
                    setCurrentDate(day);
                  }}
                  type="button"
                  className={`aspect-square p-1 rounded-xl border flex flex-col items-center justify-between transition-all relative ${
                    active 
                      ? "bg-primary border-primary text-white shadow-lg scale-102" 
                      : isTodayDate
                        ? "bg-primary/5 border-primary/40 text-primary"
                        : "bg-bg-elevated/10 border-border/50 text-text-secondary hover:border-text-secondary"
                  }`}
                >
                  <span className="text-xs font-black self-start pl-1 pt-0.5">
                    {day.getDate()}
                  </span>

                  <div className="flex flex-wrap gap-0.5 w-full justify-center pb-1">
                    {dayBookings.slice(0, 3).map((_, bIdx) => (
                      <span 
                        key={bIdx} 
                        className={`h-1.5 w-1.5 rounded-full ${
                          active ? "bg-white" : "bg-primary"
                        }`} 
                      />
                    ))}
                    {dayBookings.length > 3 && (
                      <span className="text-[7px] font-bold leading-none text-text-muted">+</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {calendarView === "week" && (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2 text-center border-b border-border/30 pb-2">
              {daysInWeek.map(day => {
                const active = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      setSelectedDate(day);
                      setCurrentDate(day);
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      active 
                        ? "bg-primary border-primary text-white"
                        : isTodayDate
                          ? "bg-primary/5 border-primary/30 text-primary font-bold"
                          : "bg-bg-elevated/5 border-border/40 text-text-secondary hover:bg-bg-elevated/20"
                    }`}
                  >
                    <span className="text-[9px] uppercase font-bold text-text-muted">{format(day, "eee")}</span>
                    <span className="text-sm font-black">{day.getDate()}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              {selectedDate && (
                <>
                  <p className="text-[10px] uppercase font-bold text-text-muted">
                    Bookings for {format(selectedDate, "eeee, MMMM d")}:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {getDayBookings(selectedDate).map(b => (
                      <div
                        key={b.id}
                        onClick={() => onSelectBooking(b)}
                        className="p-3 border border-border bg-bg-elevated/15 hover:bg-bg-elevated/30 rounded-xl cursor-pointer transition-all flex justify-between items-center"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-text-primary text-xs">{b.event_name}</p>
                          <p className="text-[10px] text-text-muted flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {b.start_time} - {b.end_time}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-text-muted" />
                      </div>
                    ))}
                    {getDayBookings(selectedDate).length === 0 && (
                      <p className="text-xs text-text-muted italic col-span-2">No bookings for this date.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {calendarView === "day" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-2">
              <span className="text-xs font-bold text-text-primary">
                Daily Schedule: {format(currentDate, "PP")}
              </span>
              {isToday(currentDate) && (
                <span className="text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                  Today
                </span>
              )}
            </div>

            <div className="space-y-2 min-h-50">
              {getDayBookings(currentDate).map(b => (
                <div
                  key={b.id}
                  onClick={() => onSelectBooking(b)}
                  className="p-4 border border-border bg-bg-elevated/10 hover:bg-bg-elevated/20 cursor-pointer rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                >
                  <div className="space-y-1.5">
                    <p className="text-sm font-black text-text-primary leading-snug">{b.event_name}</p>
                    <div className="flex flex-wrap gap-4 text-[10px] text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-text-muted" />
                        {b.start_time} - {b.end_time}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-text-muted" />
                        Host: {b.client.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-text-muted" />
                        {b.location}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 font-bold text-[10px] shrink-0">
                    Inspect Booking
                  </Button>
                </div>
              ))}

              {getDayBookings(currentDate).length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Layers className="h-8 w-8 text-text-muted mb-2 animate-bounce" />
                  <p className="text-xs text-text-muted italic">No reservations booked on this date slot.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected day preview in month view */}
        {calendarView === "month" && selectedDate && (
          <div className="mt-4 pt-4 border-t border-border/40 space-y-2 text-xs">
            <p className="font-bold uppercase tracking-wider text-[10px] text-text-secondary">
              Selected Day: {format(selectedDate, "do MMMM, yyyy")}
            </p>

            <div className="space-y-2">
              {getDayBookings(selectedDate).map(b => (
                <div 
                  key={b.id} 
                  onClick={() => onSelectBooking(b)}
                  className="p-3 border border-border/80 bg-bg-elevated/10 hover:bg-bg-elevated/20 cursor-pointer rounded-xl flex items-center justify-between transition-all"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-text-primary text-xs">{b.event_name}</p>
                    <div className="flex items-center gap-3 text-[10px] text-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {b.start_time} - {b.end_time}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {b.client.name}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-muted" />
                </div>
              ))}
              {getDayBookings(selectedDate).length === 0 && (
                <p className="text-[11px] text-text-muted italic">No accepted bookings scheduled for this date.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Upcoming chronological list */}
      <div className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-xl flex flex-col space-y-4">
        <div className="border-b border-border/30 pb-2">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <ListOrdered className="h-4.5 w-4.5 text-primary" />
            Upcoming Schedules
          </h3>
          <p className="text-[10px] text-text-muted">Accepted bookings in timeline progression</p>
        </div>

        <div className="space-y-3.5 overflow-y-auto max-h-[55vh] pr-1 scrollbar-thin">
          {upcomingBookings.map(b => (
            <div 
              key={b.id}
              onClick={() => onSelectBooking(b)}
              className="p-3.5 border border-border/70 hover:border-primary bg-bg-card/60 hover:bg-bg-card cursor-pointer rounded-xl transition-all space-y-2 relative group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-primary">
                  {format(new Date(b.event_date), "MMM dd, yyyy")}
                </span>
                <span className="text-[10px] text-text-muted font-semibold">
                  {b.start_time} - {b.end_time}
                </span>
              </div>

              <p className="text-xs font-bold text-text-primary truncate leading-snug">{b.event_name}</p>

              <div className="flex flex-col gap-1 text-[10px] text-text-secondary pt-0.5">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3 text-text-muted" />
                  Client: {b.client.name}
                </span>
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 text-text-muted" />
                  {b.location}
                </span>
              </div>

              <div className="absolute right-3.5 bottom-3.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="h-4 w-4 text-primary" />
              </div>
            </div>
          ))}
          {upcomingBookings.length === 0 && (
            <p className="text-xs text-text-muted italic text-center py-12">No upcoming accepted reservations.</p>
          )}
        </div>
      </div>
    </div>
  );
}
