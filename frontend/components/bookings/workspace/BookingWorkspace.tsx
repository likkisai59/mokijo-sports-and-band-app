"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookingRequestDetail } from "@/types/booking";
import { AvailabilityData } from "@/types/artist";
import { bookingService } from "@/services/bookingService";
import { artistService } from "@/services/artistService";
import { BookingInboxTab } from "./BookingInboxTab";
import { EventCalendarTab } from "./EventCalendarTab";
import { BookingHistoryTab } from "./BookingHistoryTab";
import { Button } from "@/components/ui/button";
import { RefreshCw, Inbox, CalendarDays, History, Calendar } from "lucide-react";
import toast from "react-hot-toast";

interface BookingWorkspaceProps {
  role: "client" | "artist" | "venue" | "admin";
}

type PrimaryTab = "inbox" | "calendar" | "history";

export function BookingWorkspace({ role }: BookingWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = React.useState<PrimaryTab>("inbox");
  const [bookings, setBookings] = React.useState<BookingRequestDetail[]>([]);
  const [availability, setAvailability] = React.useState<AvailabilityData | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  // Sync with URL query parameter
  React.useEffect(() => {
    const tabParam = searchParams.get("tab") as PrimaryTab | null;
    if (tabParam && ["inbox", "calendar", "history"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: PrimaryTab) => {
    setActiveTab(tab);
    const rolePrefix = role === "venue" ? "venue" : role === "admin" ? "admin" : role === "client" ? "client" : "artist";
    router.push(`/${rolePrefix}/bookings?tab=${tab}`, { scroll: false });
  };

  const fetchBookings = React.useCallback(async () => {
    setLoading(true);
    try {
      if (role === "client") {
        const res = await bookingService.getClientBookings({ limit: 100 });
        setBookings(res.bookings || []);
      } else if (role === "admin") {
        const res = await bookingService.adminGetBookings({ limit: 100 });
        setBookings(res.bookings || []);
      } else {
        const res = await bookingService.getArtistBookings({ limit: 100 });
        setBookings(res.bookings || []);
      }
    } catch {
      toast.error("Failed to load booking details.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  const fetchAvailability = React.useCallback(async () => {
    if (role !== "artist") return;
    try {
      const data = await artistService.getAvailability();
      setAvailability(data);
    } catch {
      // ignore
    }
  }, [role]);

  const reloadAll = React.useCallback(async () => {
    await Promise.all([fetchBookings(), fetchAvailability()]);
  }, [fetchBookings, fetchAvailability]);

  React.useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  const handleSaveAvailability = async (updated: AvailabilityData) => {
    try {
      const data = await artistService.updateAvailability(updated);
      setAvailability(data);
      toast.success("Calendar availability updated!");
    } catch {
      toast.error("Failed to update availability schedule.");
      throw new Error();
    }
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Booking Workspace
          </h1>
          <p className="text-xs text-text-secondary">
            Manage inquiries, workflow transitions, event schedules, and booking history.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={reloadAll}
          className="flex items-center gap-1.5 self-start sm:self-center text-xs h-9 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Reload Workspace</span>
        </Button>
      </div>

      {/* Primary Workspace Tabs Bar */}
      <div className="border-b border-border/80 pb-2">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "inbox" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleTabChange("inbox")}
            className="text-xs font-bold gap-2 px-4 h-9 rounded-xl"
          >
            <Inbox className="h-4 w-4" />
            <span>Booking Inbox</span>
          </Button>

          <Button
            variant={activeTab === "calendar" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleTabChange("calendar")}
            className="text-xs font-bold gap-2 px-4 h-9 rounded-xl"
          >
            <CalendarDays className="h-4 w-4" />
            <span>Event Calendar</span>
          </Button>

          <Button
            variant={activeTab === "history" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleTabChange("history")}
            className="text-xs font-bold gap-2 px-4 h-9 rounded-xl"
          >
            <History className="h-4 w-4" />
            <span>Booking History</span>
          </Button>
        </div>
      </div>

      {/* Primary Tab Content Viewports */}
      {activeTab === "inbox" && (
        <BookingInboxTab
          role={role}
          bookings={bookings}
          loading={loading}
          onRefresh={reloadAll}
        />
      )}

      {activeTab === "calendar" && (
        <EventCalendarTab
          role={role}
          bookings={bookings}
          availability={availability}
          loading={loading}
          onSaveAvailability={handleSaveAvailability}
          onRefresh={reloadAll}
        />
      )}

      {activeTab === "history" && (
        <BookingHistoryTab
          role={role}
          bookings={bookings}
          loading={loading}
          onRefresh={reloadAll}
        />
      )}
    </div>
  );
}
