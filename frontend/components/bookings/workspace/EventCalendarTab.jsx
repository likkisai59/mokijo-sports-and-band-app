"use client";

import * as React from "react";
import { AvailabilityCalendar } from "@/components/artist/calendar/AvailabilityCalendar";
import { AvailabilityWeekly } from "@/components/artist/calendar/AvailabilityWeekly";
import { ConflictChecker } from "@/components/artist/calendar/ConflictChecker";
import { BookingCalendar } from "@/components/bookings/BookingCalendar";
import { BookingDetailsDialog } from "@/components/bookings/BookingDetailsDialog";
import { CalendarDays, Calendar, Clock, Lock, CheckCircle2, User, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

export function EventCalendarTab({
  role,
  bookings = [],
  availability,
  loading,
  onSaveAvailability,
  onRefresh,
}) {
  const [subTab, setSubTab] = React.useState("calendar");
  const [selectedBookingId, setSelectedBookingId] = React.useState(null);

  const confirmedBookings = React.useMemo(() => {
    return bookings.filter((b) =>
      ["accepted", "confirmed", "completed"].includes((b.status || "").toLowerCase())
    );
  }, [bookings]);

  if (loading && !availability) {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "60px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
        }}
      >
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid #0a0a0f", borderTopColor: "#c6ff3d", animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748b" }}>Loading calendar events...</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* ── Sub-navigation Toolbar ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        }}
      >
        <button
          type="button"
          onClick={() => setSubTab("calendar")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "10px",
            fontSize: "12px",
            fontWeight: 800,
            cursor: "pointer",
            border: subTab === "calendar" ? "none" : "1px solid #e2e8f0",
            backgroundColor: subTab === "calendar" ? "#0a0a0f" : "#f8fafc",
            color: subTab === "calendar" ? "#c6ff3d" : "#475569",
            transition: "all 0.15s ease",
          }}
        >
          <Calendar style={{ width: "14px", height: "14px" }} />
          <span>Interactive Calendar</span>
        </button>

        {role === "artist" && availability && (
          <>
            <button
              type="button"
              onClick={() => setSubTab("availability")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                border: subTab === "availability" ? "none" : "1px solid #e2e8f0",
                backgroundColor: subTab === "availability" ? "#0a0a0f" : "#f8fafc",
                color: subTab === "availability" ? "#c6ff3d" : "#475569",
                transition: "all 0.15s ease",
              }}
            >
              <CalendarDays style={{ width: "14px", height: "14px" }} />
              <span>Availability Grid</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab("schedule")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                border: subTab === "schedule" ? "none" : "1px solid #e2e8f0",
                backgroundColor: subTab === "schedule" ? "#0a0a0f" : "#f8fafc",
                color: subTab === "schedule" ? "#c6ff3d" : "#475569",
                transition: "all 0.15s ease",
              }}
            >
              <Clock style={{ width: "14px", height: "14px" }} />
              <span>Slots &amp; Curfews</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab("blocked")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                border: subTab === "blocked" ? "none" : "1px solid #e2e8f0",
                backgroundColor: subTab === "blocked" ? "#0a0a0f" : "#f8fafc",
                color: subTab === "blocked" ? "#c6ff3d" : "#475569",
                transition: "all 0.15s ease",
              }}
            >
              <Lock style={{ width: "14px", height: "14px" }} />
              <span>Blocked Dates</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setSubTab("confirmed")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "10px",
            fontSize: "12px",
            fontWeight: 800,
            cursor: "pointer",
            border: subTab === "confirmed" ? "none" : "1px solid #e2e8f0",
            backgroundColor: subTab === "confirmed" ? "#0a0a0f" : "#f8fafc",
            color: subTab === "confirmed" ? "#c6ff3d" : "#475569",
            transition: "all 0.15s ease",
          }}
        >
          <CheckCircle2 style={{ width: "14px", height: "14px" }} />
          <span>Confirmed Events</span>
          <span
            style={{
              padding: "2px 6px",
              borderRadius: "6px",
              fontSize: "10px",
              fontWeight: 900,
              backgroundColor: subTab === "confirmed" ? "#c6ff3d" : "#e2e8f0",
              color: "#0a0a0f",
            }}
          >
            {confirmedBookings.length}
          </span>
        </button>
      </div>

      {subTab === "calendar" && (
        <BookingCalendar
          bookings={bookings}
          onSelectBooking={(b) => setSelectedBookingId(b.id)}
        />
      )}

      {subTab === "availability" && availability && (
        <AvailabilityCalendar
          availability={availability}
          onSave={onSaveAvailability}
        />
      )}

      {subTab === "schedule" && availability && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
          <AvailabilityWeekly
            availability={availability}
            onSave={onSaveAvailability}
          />
          <ConflictChecker />
        </div>
      )}

      {subTab === "blocked" && availability && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <ConflictChecker />
          <AvailabilityCalendar
            availability={availability}
            onSave={onSaveAvailability}
          />
        </div>
      )}

      {subTab === "confirmed" && (
        <div>
          {confirmedBookings.length === 0 ? (
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "24px",
                border: "1px dashed #cbd5e1",
                padding: "50px 24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "16px",
                  backgroundColor: "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                }}
              >
                <CheckCircle2 style={{ width: "24px", height: "24px" }} />
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                No Confirmed Events Scheduled
              </h3>
              <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0, maxWidth: "380px", lineHeight: 1.5 }}>
                You have no upcoming accepted or confirmed event performance bookings on the schedule.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "16px",
              }}
            >
              {confirmedBookings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBookingId(b.id)}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "20px",
                    border: "1px solid #e2e8f0",
                    padding: "20px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "14px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                      <h3 style={{ fontSize: "14.5px", fontWeight: 900, color: "#0a0a0f", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {b.event_name || "Confirmed Gig"}
                      </h3>
                      <span style={{ backgroundColor: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0", fontSize: "10px", fontWeight: 900, padding: "3px 8px", borderRadius: "6px", textTransform: "uppercase" }}>
                        {b.status}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                      <User style={{ width: "13px", height: "13px", color: "#0a0a0f" }} />
                      <span>{role === "client" ? (b.artist?.display_name || b.artist_name || "Performer") : (b.client?.name || "Client")}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                      <Calendar style={{ width: "13px", height: "13px", color: "#0a0a0f" }} />
                      <span>{formatDate(b.event_date)}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "12px",
                      borderTop: "1px solid #f1f5f9",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", display: "block" }}>Agreed Fee</span>
                      <span style={{ fontSize: "15px", fontWeight: 900, color: "#0a0a0f" }}>
                        {formatCurrency(b.proposed_price || b.total_price || 0)}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11.5px",
                        fontWeight: 800,
                        color: "#0a0a0f",
                        backgroundColor: "#f8fafc",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <span>Details</span>
                      <ChevronRight style={{ width: "14px", height: "14px" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
