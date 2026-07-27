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
  ListOrdered
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday 
} from "date-fns";

interface VenueBookingCalendarTimelineProps {
  bookings: BookingRequestDetail[];
  onSelectBooking: (booking: BookingRequestDetail) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function VenueBookingCalendarTimeline({
  bookings,
  onSelectBooking
}: VenueBookingCalendarTimelineProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Padding dates to align with Sunday start
  const startDayOfWeek = monthStart.getDay();
  const padDays = Array.from({ length: startDayOfWeek }, (_, _i) => null);

  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const calendarGrid = [...padDays, ...daysInMonth];

  const nextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const prevMonth = () => setCurrentDate(prev => subMonths(prev, 1));

  // Filter bookings for the selected month to render events in calendar
  const getDayBookings = (date: Date) => {
    return bookings.filter(b => {
      if (b.status !== "accepted" && b.status !== "completed") return false;
      const bDate = new Date(b.event_date);
      return isSameDay(bDate, date);
    });
  };

  // Timeline lists: upcoming accepted/completed reservations
  const timelineBookings = React.useMemo(() => {
    return bookings
      .filter(b => b.status === "accepted")
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }, [bookings]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Month Calendar Grid Card */}
      <div className="lg:col-span-2 bg-bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-xl flex flex-col space-y-4">
        
        {/* Header Nav */}
        <div className="flex items-center justify-between pb-2 border-b border-border/30">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <CalendarIcon className="h-4.5 w-4.5 text-primary" />
              Event Schedule Grid
            </h3>
            <p className="text-[10px] text-text-muted">{format(currentDate, "MMMM yyyy")}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="text-[10px] font-bold h-8 px-2.5">
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map(day => (
            <span key={day} className="text-[10px] font-bold text-text-muted py-1.5 uppercase">
              {day}
            </span>
          ))}

          {calendarGrid.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="aspect-square bg-transparent rounded-lg border border-transparent" />;
            }

            const dayBookings = getDayBookings(day);
            const active = selectedDate && isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                type="button"
                className={`aspect-square p-1 rounded-xl border flex flex-col items-center justify-between transition-all relative ${
                  active 
                    ? "bg-primary border-primary text-white shadow-lg" 
                    : isTodayDate
                      ? "bg-primary/5 border-primary/40 text-primary"
                      : "bg-bg-elevated/10 border-border/50 text-text-secondary hover:border-text-secondary"
                }`}
              >
                <span className={`text-xs font-black self-start pl-1 pt-0.5 ${
                  active ? "text-white" : isTodayDate ? "text-primary" : "text-white"
                }`}>
                  {day.getDate()}
                </span>

                {/* Event indicators */}
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

        {/* Selected Day Bookings Drawer Info */}
        {selectedDate && (
          <div className="mt-4 pt-4 border-t border-border/40 space-y-2 text-xs">
            <p className="font-bold text-text-primary uppercase tracking-wider text-[10px] text-text-secondary">
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

      {/* Right Column: Upcoming Timeline List */}
      <div className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-xl flex flex-col space-y-4">
        <div className="border-b border-border/30 pb-2">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <ListOrdered className="h-4.5 w-4.5 text-primary" />
            Upcoming Reservations
          </h3>
          <p className="text-[10px] text-text-muted">Chronological order of accepted requests</p>
        </div>

        <div className="space-y-3.5 overflow-y-auto max-h-[50vh] pr-1">
          {timelineBookings.map(b => (
            <div 
              key={b.id}
              onClick={() => onSelectBooking(b)}
              className="p-3.5 border border-border/70 hover:border-primary bg-bg-card/60 hover:bg-bg-card cursor-pointer rounded-xl transition-all space-y-2 relative group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-primary">
                  {format(new Date(b.event_date), "MMM dd, yyyy")}
                </span>
                <span className="text-[10px] text-text-muted">
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
          {timelineBookings.length === 0 && (
            <p className="text-xs text-text-muted italic text-center py-10">No upcoming accepted reservations.</p>
          )}
        </div>
      </div>

    </div>
  );
}
