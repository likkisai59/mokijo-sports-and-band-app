"use client";

import * as React from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  ListOrdered,
  Layers,
  Sparkles
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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function BookingCalendar({
  bookings = [],
  onSelectBooking
}) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [calendarView, setCalendarView] = React.useState("month");

  const getDayBookings = React.useCallback((date) => {
    return bookings.filter(b => {
      if (b.status !== "accepted" && b.status !== "completed" && b.status !== "confirmed") return false;
      const bDate = new Date(b.event_date);
      return isSameDay(bDate, date);
    });
  }, [bookings]);

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

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDayOfWeek = monthStart.getDay();
  const padDays = Array.from({ length: startDayOfWeek }, (_, _i) => null);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const monthGrid = [...padDays, ...daysInMonth];

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const upcomingBookings = React.useMemo(() => {
    return bookings
      .filter(b => b.status === "accepted" || b.status === "confirmed")
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }, [bookings]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr)) 340px", gap: "24px" }}>
      
      {/* ── Main Calendar Matrix ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "24px 28px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 900, color: "#0a0a0f", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <CalendarIcon style={{ width: "18px", height: "18px", color: "#0a0a0f" }} />
              <span>Event Schedule Calendar</span>
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>
              {calendarView === "month" && format(currentDate, "MMMM yyyy")}
              {calendarView === "week" && `Week of ${format(weekStart, "PP")}`}
              {calendarView === "day" && format(currentDate, "PP")}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", backgroundColor: "#f8fafc", padding: "3px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              {["month", "week", "day"].map(view => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setCalendarView(view)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "11.5px",
                    fontWeight: 800,
                    cursor: "pointer",
                    border: "none",
                    backgroundColor: calendarView === view ? "#0a0a0f" : "transparent",
                    color: calendarView === view ? "#c6ff3d" : "#64748b",
                    textTransform: "capitalize",
                  }}
                >
                  {view}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <button
                type="button"
                onClick={handlePrev}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  color: "#0a0a0f",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronLeft style={{ width: "16px", height: "16px" }} />
              </button>
              <button
                type="button"
                onClick={handleToday}
                style={{
                  height: "32px",
                  padding: "0 10px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  color: "#0a0a0f",
                  fontSize: "11.5px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNext}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  color: "#0a0a0f",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronRight style={{ width: "16px", height: "16px" }} />
              </button>
            </div>
          </div>
        </div>

        {/* Month View Grid */}
        {calendarView === "month" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
            {WEEKDAYS.map(day => (
              <span key={day} style={{ textAlign: "center", fontSize: "11px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", paddingBottom: "6px" }}>
                {day}
              </span>
            ))}
            {monthGrid.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} style={{ aspectRatio: "1 / 1", backgroundColor: "transparent" }} />;
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
                  style={{
                    aspectRatio: "1 / 1",
                    padding: "6px",
                    borderRadius: "12px",
                    border: active ? "2px solid #0a0a0f" : isTodayDate ? "1.5px solid #0a0a0f" : "1px solid #e2e8f0",
                    backgroundColor: active ? "#0a0a0f" : isTodayDate ? "#f0fdf4" : "#ffffff",
                    color: active ? "#c6ff3d" : "#0a0a0f",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 900 }}>
                    {day.getDate()}
                  </span>

                  {dayBookings.length > 0 && (
                    <div style={{ display: "flex", gap: "3px", width: "100%", justifyContent: "center" }}>
                      {dayBookings.slice(0, 3).map((_, bIdx) => (
                        <span
                          key={bIdx}
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: active ? "#c6ff3d" : "#16a34a",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Week View */}
        {calendarView === "week" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
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
                    style={{
                      padding: "10px 6px",
                      borderRadius: "12px",
                      border: active ? "2px solid #0a0a0f" : "1px solid #e2e8f0",
                      backgroundColor: active ? "#0a0a0f" : isTodayDate ? "#f0fdf4" : "#f8fafc",
                      color: active ? "#c6ff3d" : "#0a0a0f",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "2px",
                    }}
                  >
                    <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase" }}>{format(day, "eee")}</span>
                    <span style={{ fontSize: "14px", fontWeight: 900 }}>{day.getDate()}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#64748b" }}>
                Bookings on {format(selectedDate, "eeee, MMMM d")}:
              </span>
              {getDayBookings(selectedDate).map(b => (
                <div
                  key={b.id}
                  onClick={() => onSelectBooking(b)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "13px", fontWeight: 900, color: "#0a0a0f", display: "block" }}>{b.event_name}</span>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>{b.start_time} - {b.end_time} • {b.client?.name || b.client_name}</span>
                  </div>
                  <ChevronRight style={{ width: "16px", height: "16px", color: "#0a0a0f" }} />
                </div>
              ))}
              {getDayBookings(selectedDate).length === 0 && (
                <p style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic", margin: 0 }}>No bookings scheduled on this date.</p>
              )}
            </div>
          </div>
        )}

        {/* Selected Date Details in Month View */}
        {calendarView === "month" && selectedDate && (
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>
              Schedule for {format(selectedDate, "do MMMM, yyyy")}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {getDayBookings(selectedDate).map(b => (
                <div
                  key={b.id}
                  onClick={() => onSelectBooking(b)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "13px", fontWeight: 900, color: "#0a0a0f", display: "block" }}>{b.event_name}</span>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>{b.start_time} - {b.end_time} • {b.client?.name || b.client_name}</span>
                  </div>
                  <ChevronRight style={{ width: "16px", height: "16px", color: "#0a0a0f" }} />
                </div>
              ))}
              {getDayBookings(selectedDate).length === 0 && (
                <p style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic", margin: 0 }}>No confirmed bookings on this day.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Upcoming Schedule Timeline Sidebar ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "24px 28px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 900, color: "#0a0a0f", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <ListOrdered style={{ width: "16px", height: "16px", color: "#0a0a0f" }} />
            <span>Upcoming Schedules</span>
          </h3>
          <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>
            Timeline of confirmed engagements
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "460px", overflowY: "auto" }}>
          {upcomingBookings.map(b => (
            <div
              key={b.id}
              onClick={() => onSelectBooking(b)}
              style={{
                padding: "12px 14px",
                borderRadius: "14px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", fontWeight: 900, color: "#16a34a" }}>
                  {format(new Date(b.event_date), "MMM dd, yyyy")}
                </span>
                <span style={{ fontSize: "10.5px", color: "#64748b", fontWeight: 700 }}>
                  {b.start_time} - {b.end_time}
                </span>
              </div>
              <span style={{ fontSize: "13px", fontWeight: 900, color: "#0a0a0f" }}>{b.event_name}</span>
              <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 600 }}>{b.client?.name || b.client_name || "Direct Client"}</span>
            </div>
          ))}

          {upcomingBookings.length === 0 && (
            <p style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic", textAlign: "center", padding: "40px 0", margin: 0 }}>
              No upcoming confirmed engagements.
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
