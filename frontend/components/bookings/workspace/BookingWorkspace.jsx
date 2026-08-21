"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { bookingService } from "@/services/bookingService";
import { artistService } from "@/services/artistService";
import { BookingInboxTab } from "./BookingInboxTab";
import { EventCalendarTab } from "./EventCalendarTab";
import { BookingHistoryTab } from "./BookingHistoryTab";
import { RefreshCw, Inbox, CalendarDays, History, Calendar } from "lucide-react";
import toast from "react-hot-toast";

export function BookingWorkspace({ role = "venue", basePath }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = React.useState("inbox");
  const [bookings, setBookings] = React.useState([]);
  const [availability, setAvailability] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["inbox", "calendar", "history"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const rolePrefix = role === "venue" ? "venue" : role === "admin" ? "admin" : role === "client" ? "client" : "artist";
    const path = basePath ? `${basePath}?tab=${tab}` : `/${rolePrefix}/bookings?tab=${tab}`;
    router.push(path, { scroll: false });
  };

  const fetchBookings = React.useCallback(async () => {
    setLoading(true);
    try {
      let data = [];
      if (role === "client") {
        data = await bookingService.getClientBookings({ limit: 100 });
      } else if (role === "admin") {
        data = await bookingService.adminGetBookings({ limit: 100 });
      } else if (role === "venue") {
        data = await bookingService.getVenueBookings({ limit: 100 });
      } else {
        data = await bookingService.getArtistBookings({ limit: 100 });
      }
      setBookings(Array.isArray(data) ? data : (data?.items || []));
    } catch {
      // Fallback to getMyBookings
      try {
        const fallback = await bookingService.getMyBookings({ limit: 100 });
        setBookings(Array.isArray(fallback) ? fallback : (fallback?.items || []));
      } catch (err) {
        console.error("Error loading bookings:", err);
      }
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

  const handleSaveAvailability = async (updated) => {
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
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      
      {/* ── Top Header Banner Card ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "24px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "16px",
              backgroundColor: "#0a0a0f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#c6ff3d",
              boxShadow: "0 4px 14px rgba(10, 10, 15, 0.15)",
            }}
          >
            <Calendar style={{ width: "24px", height: "24px" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#0a0a0f", margin: 0, letterSpacing: "-0.02em" }}>
                Booking Workspace
              </h1>
              <span
                style={{
                  backgroundColor: "#c6ff3d",
                  color: "#0a0a0f",
                  fontSize: "10px",
                  fontWeight: 900,
                  padding: "2px 8px",
                  borderRadius: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Live Hub
              </span>
            </div>
            <p style={{ fontSize: "12.5px", color: "#64748b", margin: "3px 0 0 0", fontWeight: 500 }}>
              Manage incoming inquiries, negotiate counter-offers, and track event reservation schedules.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={reloadAll}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            height: "42px",
            padding: "0 18px",
            borderRadius: "12px",
            backgroundColor: "#0a0a0f",
            color: "#ffffff",
            fontSize: "12.5px",
            fontWeight: 800,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            transition: "all 0.15s ease",
          }}
        >
          <RefreshCw style={{ width: "15px", height: "15px", animation: loading ? "spin 1s linear infinite" : "none" }} />
          <span>{loading ? "Refreshing..." : "Reload Workspace"}</span>
        </button>
      </div>

      {/* ── Segmented Tab Switcher ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "#ffffff",
          padding: "6px",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          width: "fit-content",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        }}
      >
        <button
          type="button"
          onClick={() => handleTabChange("inbox")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "12px",
            fontSize: "12.5px",
            fontWeight: 800,
            cursor: "pointer",
            border: "none",
            backgroundColor: activeTab === "inbox" ? "#0a0a0f" : "transparent",
            color: activeTab === "inbox" ? "#c6ff3d" : "#64748b",
            transition: "all 0.15s ease",
          }}
        >
          <Inbox style={{ width: "16px", height: "16px" }} />
          <span>Booking Inbox</span>
          <span
            style={{
              padding: "2px 7px",
              borderRadius: "6px",
              fontSize: "10px",
              fontWeight: 900,
              backgroundColor: activeTab === "inbox" ? "#c6ff3d" : "#f1f5f9",
              color: "#0a0a0f",
            }}
          >
            {bookings.filter(b => !["completed", "cancelled", "expired"].includes((b.status || "").toLowerCase())).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("calendar")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "12px",
            fontSize: "12.5px",
            fontWeight: 800,
            cursor: "pointer",
            border: "none",
            backgroundColor: activeTab === "calendar" ? "#0a0a0f" : "transparent",
            color: activeTab === "calendar" ? "#c6ff3d" : "#64748b",
            transition: "all 0.15s ease",
          }}
        >
          <CalendarDays style={{ width: "16px", height: "16px" }} />
          <span>Event Calendar</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("history")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "12px",
            fontSize: "12.5px",
            fontWeight: 800,
            cursor: "pointer",
            border: "none",
            backgroundColor: activeTab === "history" ? "#0a0a0f" : "transparent",
            color: activeTab === "history" ? "#c6ff3d" : "#64748b",
            transition: "all 0.15s ease",
          }}
        >
          <History style={{ width: "16px", height: "16px" }} />
          <span>Booking History</span>
        </button>
      </div>

      {/* ── Active Tab Component ── */}
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
