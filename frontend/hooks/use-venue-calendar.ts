"use client";

import * as React from "react";
import { venueService } from "@/services/venueService";
import { VenueAvailabilityData, VenueWeeklyScheduleItem } from "@/types/venue";
import toast from "react-hot-toast";

export interface CalendarDayEvent {
  type: "booking" | "blocked" | "maintenance" | "holiday";
  title: string;
  subtitle?: string;
  color: string;
  data: any;
}

export function useVenueCalendar() {
  const [data, setData] = React.useState<VenueAvailabilityData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Month navigation state
  const [currentDate, setCurrentDate] = React.useState(() => new Date());
  
  // Timezone preference
  const [timezone, setTimezone] = React.useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  });

  // Calendar visibility filters
  const [filters, setFilters] = React.useState({
    bookings: true,
    blocked: true,
    maintenance: true,
    holidays: true
  });

  const fetchAvailability = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await venueService.getAvailability();
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load availability calendar.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Navigate months
  const nextMonth = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const prevMonth = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  // Add/Remove calendar configurations
  const updateAvailabilityRules = async (newRules: Omit<VenueAvailabilityData, "bookings">) => {
    try {
      const updated = await venueService.updateAvailability(newRules);
      setData(updated);
      toast.success("Calendar settings updated successfully!");
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to update calendar configuration.";
      toast.error(msg);
      throw err;
    }
  };

  // Check conflicts helper
  const checkSlotConflict = async (checkDate: string, startTime: string, endTime: string) => {
    try {
      const res = await venueService.checkConflict({ date: checkDate, start_time: startTime, end_time: endTime });
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to check slot conflict.";
      toast.error(msg);
      return { conflict: true, reason: "API Validation Error" };
    }
  };

  // Day-wise categorization mapping
  const getDayEvents = React.useCallback((dateString: string): CalendarDayEvent[] => {
    if (!data) return [];
    const events: CalendarDayEvent[] = [];

    // Bookings
    if (filters.bookings && data.bookings) {
      data.bookings
        .filter(b => b.date === dateString)
        .forEach(b => {
          events.push({
            type: "booking",
            title: b.event_name,
            subtitle: `${b.start_time} - ${b.end_time} • ${b.client_name}`,
            color: "bg-primary border-primary-light text-white",
            data: b
          });
        });
    }

    // Explicit Blocked dates
    if (filters.blocked && data.blocked_dates?.includes(dateString)) {
      events.push({
        type: "blocked",
        title: "Reserved / Blocked",
        subtitle: "Unavailable for bookings",
        color: "bg-red-500/10 border-red-500/20 text-red-400",
        data: dateString
      });
    }

    // Maintenance windows
    if (filters.maintenance && data.maintenance_days?.includes(dateString)) {
      events.push({
        type: "maintenance",
        title: "Space Maintenance",
        subtitle: "Technical/decor servicing",
        color: "bg-amber-500/10 border-amber-500/20 text-amber-400",
        data: dateString
      });
    }

    // Public Holidays
    if (filters.holidays && data.public_holidays?.includes(dateString)) {
      events.push({
        type: "holiday",
        title: "Closed (Public Holiday)",
        color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        data: dateString
      });
    }

    return events;
  }, [data, filters]);

  return {
    data,
    loading,
    error,
    currentDate,
    setCurrentDate,
    filters,
    timezone,
    setFilters,
    setTimezone,
    nextMonth,
    prevMonth,
    getDayEvents,
    updateAvailabilityRules,
    checkSlotConflict,
    refetch: fetchAvailability
  };
}
