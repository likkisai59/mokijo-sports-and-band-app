"use client";

import * as React from "react";
import { AvailabilityData } from "@/types/artist";
import { BookingRequestDetail } from "@/types/booking";
import { AvailabilityCalendar } from "@/components/artist/calendar/AvailabilityCalendar";
import { AvailabilityWeekly } from "@/components/artist/calendar/AvailabilityWeekly";
import { ConflictChecker } from "@/components/artist/calendar/ConflictChecker";
import { BookingCalendar } from "@/components/bookings/BookingCalendar";
import { BookingDetailsDialog } from "@/components/bookings/BookingDetailsDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarDays, Calendar, Clock, Lock, CheckCircle2, User } from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

interface EventCalendarTabProps {
  role: "client" | "artist" | "venue" | "admin";
  bookings: BookingRequestDetail[];
  availability: AvailabilityData | null;
  loading: boolean;
  onSaveAvailability: (updated: AvailabilityData) => Promise<void>;
  onRefresh: () => void;
}

type CalendarSubTab = "calendar" | "availability" | "schedule" | "blocked" | "confirmed";

export function EventCalendarTab({
  role,
  bookings,
  availability,
  loading,
  onSaveAvailability,
  onRefresh,
}: EventCalendarTabProps) {
  const [subTab, setSubTab] = React.useState<CalendarSubTab>("calendar");
  const [selectedBookingId, setSelectedBookingId] = React.useState<string | null>(null);

  const confirmedBookings = React.useMemo(() => {
    return bookings.filter((b) =>
      ["accepted", "confirmed", "completed"].includes(b.status.toLowerCase())
    );
  }, [bookings]);

  if (loading && !availability) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="text-xs text-text-secondary animate-pulse">Loading event calendar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sub Navigation Bar */}
      <div className="flex flex-wrap items-center gap-1 bg-bg-card/40 p-2 rounded-xl border border-border/60">
        <Button
          variant={subTab === "calendar" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSubTab("calendar")}
          className="text-xs h-8 font-bold gap-1.5"
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Calendar</span>
        </Button>

        {role === "artist" && availability && (
          <>
            <Button
              variant={subTab === "availability" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSubTab("availability")}
              className="text-xs h-8 font-bold gap-1.5"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Availability</span>
            </Button>

            <Button
              variant={subTab === "schedule" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSubTab("schedule")}
              className="text-xs h-8 font-bold gap-1.5"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Slots & Schedule</span>
            </Button>

            <Button
              variant={subTab === "blocked" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSubTab("blocked")}
              className="text-xs h-8 font-bold gap-1.5"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Blocked Dates</span>
            </Button>
          </>
        )}

        <Button
          variant={subTab === "confirmed" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSubTab("confirmed")}
          className="text-xs h-8 font-bold gap-1.5"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Confirmed Events</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {confirmedBookings.length}
          </Badge>
        </Button>
      </div>

      {/* Sub-tab 1: Monthly Calendar Grid */}
      {subTab === "calendar" && (
        <BookingCalendar
          bookings={bookings}
          onSelectBooking={(b) => setSelectedBookingId(b.id)}
        />
      )}

      {/* Sub-tab 2: Availability */}
      {subTab === "availability" && availability && (
        <AvailabilityCalendar
          availability={availability}
          onSave={onSaveAvailability}
        />
      )}

      {/* Sub-tab 3: Slots & Schedule */}
      {subTab === "schedule" && availability && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AvailabilityWeekly
            availability={availability}
            onSave={onSaveAvailability}
          />
          <ConflictChecker />
        </div>
      )}

      {/* Sub-tab 4: Blocked Dates */}
      {subTab === "blocked" && availability && (
        <div className="space-y-6">
          <ConflictChecker />
          <AvailabilityCalendar
            availability={availability}
            onSave={onSaveAvailability}
          />
        </div>
      )}

      {/* Sub-tab 5: Confirmed Events */}
      {subTab === "confirmed" && (
        <div className="space-y-4">
          {confirmedBookings.length === 0 ? (
            <Card className="bg-bg-card/30 border-border/40 p-8 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-text-muted opacity-50" />
              <h3 className="text-xs font-bold text-text-primary mb-1">No confirmed events</h3>
              <p className="text-[11px] text-text-secondary">
                You have no upcoming accepted or confirmed event performance bookings.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {confirmedBookings.map((b) => (
                <Card
                  key={b.id}
                  onClick={() => setSelectedBookingId(b.id)}
                  className="bg-bg-card/50 hover:bg-bg-card border border-border/80 hover:border-primary/50 transition-all cursor-pointer shadow-sm"
                >
                  <CardHeader className="p-4 pb-2 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-xs font-bold text-text-primary line-clamp-1">
                        {b.event_name}
                      </CardTitle>
                      <Badge variant="default" className="text-[10px] uppercase font-bold">
                        {b.status}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-text-secondary flex items-center gap-1">
                      <User className="h-3 w-3 text-primary shrink-0" />
                      <span>
                        {role === "client"
                          ? b.artist?.display_name || b.artist_name || "Performer"
                          : b.client?.name || "Client"}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-2 text-[11px] text-text-secondary">
                    <div className="flex items-center gap-1.5 text-text-muted">
                      <Calendar className="h-3 w-3 text-primary shrink-0" />
                      <span>{formatDate(b.event_date)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <span className="text-xs font-extrabold text-primary">
                        {formatCurrency(b.proposed_price)}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono">
                        Ref: {b.id.slice(0, 8)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inspector Dialog */}
      {selectedBookingId && (
        <BookingDetailsDialog
          bookingId={selectedBookingId}
          isOpen={!!selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
          onRefresh={onRefresh}
          role={role}
        />
      )}
    </div>
  );
}
