"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  MessageSquare,
  DollarSign,
  User,
  Phone,
  Mail,
  SlidersHorizontal,
  RefreshCw,
  Eye,
  ShieldCheck,
  Music,
  ArrowRight,
  Filter,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import bandApi from "@/lib/bandApi";
import { getBandUser } from "@/lib/bandAuth";
import toast from "react-hot-toast";

export default function ArtistCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all"); // all | pending | confirmed

  const fetchBookings = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await bandApi.get("/bookings/my");
      if (res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.items || [];
        setBookings(items);
        if (items.length > 0 && !selectedBooking) {
          // Auto select first booking if on selected date or default
          const match = items.find((b) => b.event_date?.startsWith(selectedDate)) || items[0];
          setSelectedBooking(match);
        }
      }
    } catch (err) {
      console.warn("Could not fetch bookings:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, selectedBooking]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Calendar Date Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDaysInMonth = new Date(year, month, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today.toISOString().split("T")[0]);
  };

  const handleAcceptGig = async (bookingId) => {
    try {
      await bandApi.post(`/bookings/${bookingId}/accept`);
      toast.success("Booking accepted! Direct chat initialized with client.");
      fetchBookings();
    } catch (err) {
      console.error("Accept failed:", err);
      toast.error(err.response?.data?.detail || "Failed to accept booking.");
    }
  };

  const handleDeclineGig = async (bookingId) => {
    try {
      await bandApi.post(`/bookings/${bookingId}/decline`);
      toast.success("Booking inquiry declined.");
      fetchBookings();
    } catch (err) {
      console.error("Decline failed:", err);
      toast.error(err.response?.data?.detail || "Failed to decline booking.");
    }
  };

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "pending") return b.status === "pending" || b.status === "inquiry";
    if (filterStatus === "confirmed") return b.status === "accepted" || b.status === "confirmed" || b.status === "locked";
    return true;
  });

  // Get bookings for a specific calendar cell
  const getBookingsForDay = (dayNumber) => {
    const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
    return filteredBookings.filter((b) => b.event_date && b.event_date.startsWith(dStr));
  };

  // Days list for current selected day
  const selectedDayBookings = filteredBookings.filter(
    (b) => b.event_date && b.event_date.startsWith(selectedDate)
  );

  return (
    <DashboardLayout role="artist">
      <div style={{ display: "flex", flexDirection: "column", gap: "28px", paddingBottom: "60px" }}>
        
        {/* ── 1. TOP HEADER & BREADCRUMB ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 12px", borderRadius: "9999px", backgroundColor: "#0a0a0f", color: "#c6ff3d", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
              <CalendarIcon style={{ width: "13px", height: "13px" }} />
              <span>Live Gig Schedule &amp; Offers</span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#0a0a0f", margin: 0, letterSpacing: "-0.02em" }}>
              Gigs &amp; Availability Calendar
            </h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>
              Manage stage schedules, review incoming client offers on calendar dates, and verify booking conflicts.
            </p>
          </div>

          {/* Action CTAs */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={fetchBookings}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                borderRadius: "12px",
                backgroundColor: "#ffffff",
                color: "#0a0a0f",
                fontWeight: 800,
                fontSize: "12.5px",
                border: "1px solid #e2e8f0",
                cursor: "pointer",
              }}
            >
              <RefreshCw style={{ width: "14px", height: "14px", animation: refreshing ? "spin 1s linear infinite" : "none" }} />
              <span>Sync Calendar</span>
            </button>

            <Link
              href="/band/artist/bookings"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 18px",
                borderRadius: "12px",
                backgroundColor: "#0a0a0f",
                color: "#c6ff3d",
                fontWeight: 800,
                fontSize: "12.5px",
                textDecoration: "none",
              }}
            >
              <span>Manage All Bookings</span>
              <ArrowRight style={{ width: "14px", height: "14px" }} />
            </Link>
          </div>
        </div>

        {/* ── 2. FILTER & MONTH NAVIGATION BAR ── */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e2e8f0",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          {/* Month Controller */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 900, color: "#0a0a0f", margin: 0, minWidth: "180px" }}>
              {monthNames[month]} {year}
            </h2>

            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <button
                type="button"
                onClick={handlePrevMonth}
                style={{ width: "34px", height: "34px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#0a0a0f" }}
              >
                <ChevronLeft style={{ width: "16px", height: "16px" }} />
              </button>

              <button
                type="button"
                onClick={handleToday}
                style={{ padding: "6px 14px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: 800, cursor: "pointer", color: "#0a0a0f" }}
              >
                Today
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                style={{ width: "34px", height: "34px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#0a0a0f" }}
              >
                <ChevronRight style={{ width: "16px", height: "16px" }} />
              </button>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#f8fafc", padding: "4px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
            {[
              { id: "all", label: `All Gigs (${bookings.length})` },
              { id: "pending", label: `Pending Offers (${bookings.filter((b) => b.status === "pending" || b.status === "inquiry").length})`, color: "#d97706" },
              { id: "confirmed", label: `Confirmed (${bookings.filter((b) => b.status === "accepted" || b.status === "confirmed").length})`, color: "#059669" },
            ].map((t) => {
              const active = filterStatus === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilterStatus(t.id)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "10px",
                    backgroundColor: active ? "#0a0a0f" : "transparent",
                    color: active ? "#ffffff" : "#475569",
                    fontWeight: 800,
                    fontSize: "12px",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 3. MAIN WORKSPACE (CALENDAR GRID + DETAIL SIDEBAR) ── */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 420px", gap: "28px", alignItems: "start" }}>
          
          {/* ── LEFT: 7-COLUMN MONTHLY CALENDAR GRID ── */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Weekday Header */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", textAlign: "center" }}>
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                <div key={d} style={{ fontSize: "11px", fontWeight: 900, color: "#94a3b8", padding: "6px 0", letterSpacing: "0.05em" }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Cells Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
              {/* Previous Month Trail Days */}
              {Array.from({ length: firstDayIndex }).map((_, idx) => {
                const dayNum = prevDaysInMonth - firstDayIndex + idx + 1;
                return (
                  <div
                    key={`prev-${idx}`}
                    style={{
                      minHeight: "95px",
                      padding: "8px",
                      borderRadius: "14px",
                      backgroundColor: "#f8fafc",
                      border: "1px dashed #e2e8f0",
                      opacity: 0.45,
                    }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8" }}>{dayNum}</span>
                  </div>
                );
              })}

              {/* Current Month Active Days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const isSelected = selectedDate === dStr;
                const dayGigs = getBookingsForDay(dayNum);
                const hasPending = dayGigs.some((g) => g.status === "pending" || g.status === "inquiry");
                const hasConfirmed = dayGigs.some((g) => g.status === "accepted" || g.status === "confirmed" || g.status === "locked");
                const isToday = new Date().toISOString().split("T")[0] === dStr;

                return (
                  <div
                    key={`day-${dayNum}`}
                    onClick={() => {
                      setSelectedDate(dStr);
                      if (dayGigs.length > 0) {
                        setSelectedBooking(dayGigs[0]);
                      } else {
                        setSelectedBooking(null);
                      }
                    }}
                    style={{
                      minHeight: "95px",
                      padding: "10px",
                      borderRadius: "16px",
                      backgroundColor: isSelected ? "#0a0a0f" : isToday ? "#f0fdf4" : "#ffffff",
                      color: isSelected ? "#ffffff" : "#0a0a0f",
                      border: isSelected
                        ? "2px solid #0a0a0f"
                        : isToday
                        ? "1.5px solid #86efac"
                        : "1px solid #e2e8f0",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "6px",
                      boxShadow: isSelected ? "0 4px 14px rgba(0,0,0,0.15)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "13px", fontWeight: 900, color: isSelected ? "#c6ff3d" : "#0a0a0f" }}>
                        {dayNum}
                      </span>
                      {isToday && (
                        <span style={{ fontSize: "9px", fontWeight: 800, padding: "1px 6px", borderRadius: "6px", backgroundColor: isSelected ? "#ffffff" : "#dcfce7", color: isSelected ? "#0a0a0f" : "#166534", textTransform: "uppercase" }}>
                          Today
                        </span>
                      )}
                    </div>

                    {/* Gig Badges inside Cell */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {dayGigs.slice(0, 2).map((gig) => {
                        const isPending = gig.status === "pending" || gig.status === "inquiry";
                        return (
                          <div
                            key={gig.id}
                            style={{
                              padding: "3px 6px",
                              borderRadius: "6px",
                              backgroundColor: isSelected
                                ? isPending ? "#fef3c7" : "#d1fae5"
                                : isPending ? "#fef3c7" : "#d1fae5",
                              color: isPending ? "#92400e" : "#065f46",
                              fontSize: "10px",
                              fontWeight: 800,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              border: isPending ? "1px solid #fde68a" : "1px solid #a7f3d0",
                            }}
                          >
                            {isPending ? "🟡 Offer: " : "🟢 Gig: "}
                            {gig.event_name || gig.event_type || "Concert"}
                          </div>
                        );
                      })}
                      {dayGigs.length > 2 && (
                        <span style={{ fontSize: "9.5px", fontWeight: 800, color: isSelected ? "#94a3b8" : "#64748b" }}>
                          +{dayGigs.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingTop: "14px", borderTop: "1px solid #f1f5f9", fontSize: "12px", color: "#64748b", fontWeight: 700 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#f59e0b" }} />
                <span>Pending Client Offer</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                <span>Confirmed Escrow Gig</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "4px", backgroundColor: "#0a0a0f" }} />
                <span>Selected Date</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT: SELECTED DATE GIG INSPECTION SIDEBAR ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "24px",
                border: "1px solid #e2e8f0",
                padding: "24px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "14px", borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.06em" }}>
                    Selected Schedule Date
                  </span>
                  <h3 style={{ fontSize: "17px", fontWeight: 900, color: "#0a0a0f", margin: "2px 0 0 0" }}>
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </h3>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 800, backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", padding: "4px 10px", borderRadius: "8px" }}>
                  {selectedDayBookings.length} {selectedDayBookings.length === 1 ? "Event" : "Events"}
                </span>
              </div>

              {/* Booking Cards on Selected Date */}
              {selectedDayBookings.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                    <CalendarIcon style={{ width: "20px", height: "20px" }} />
                  </div>
                  <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#0a0a0f", margin: 0 }}>
                    Date is Open &amp; Free
                  </h4>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                    No gigs or client offers requested for this date. Your band profile is open for marketplace bookings.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {selectedDayBookings.map((b) => {
                    const isPending = b.status === "pending" || b.status === "inquiry";
                    const isConfirmed = b.status === "accepted" || b.status === "confirmed" || b.status === "locked";

                    return (
                      <div
                        key={b.id}
                        style={{
                          backgroundColor: "#f8fafc",
                          borderRadius: "18px",
                          border: isPending ? "1.5px solid #fde68a" : "1.5px solid #a7f3d0",
                          padding: "18px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "14px",
                        }}
                      >
                        {/* Status Badge & Price */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                          <div>
                            <span
                              style={{
                                fontSize: "10.5px",
                                fontWeight: 800,
                                textTransform: "uppercase",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                backgroundColor: isPending ? "#fef3c7" : "#d1fae5",
                                color: isPending ? "#92400e" : "#065f46",
                                display: "inline-block",
                                marginBottom: "4px",
                              }}
                            >
                              {isPending ? "🟡 Pending Your Acceptance" : "🟢 Confirmed Gig"}
                            </span>
                            <h4 style={{ fontSize: "16px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                              {b.event_name || b.event_type || "Concert Performance"}
                            </h4>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#94a3b8" }}>
                              Budget
                            </span>
                            <span style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", display: "block" }}>
                              ₹{Number(b.proposed_price || b.total_amount || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        {/* Client Host Info */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#475569", backgroundColor: "#ffffff", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 800, color: "#0a0a0f" }}>
                            <User style={{ width: "14px", height: "14px", color: "#64748b" }} />
                            <span>Client: {b.client_name || b.client_email || "Event Host"}</span>
                          </div>
                          {b.client_mobile && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Phone style={{ width: "13px", height: "13px", color: "#059669" }} />
                              <span style={{ color: "#059669", fontWeight: 700 }}>{b.client_mobile}</span>
                            </div>
                          )}
                          {b.client_email && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Mail style={{ width: "13px", height: "13px", color: "#64748b" }} />
                              <span>{b.client_email}</span>
                            </div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Clock style={{ width: "13px", height: "13px", color: "#64748b" }} />
                            <span>{b.start_time || "19:00"} - {b.end_time || "23:00"}</span>
                          </div>
                          {b.location && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <MapPin style={{ width: "13px", height: "13px", color: "#64748b" }} />
                              <span>{b.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {b.notes && (
                          <div style={{ fontSize: "11.5px", color: "#64748b", backgroundColor: "#ffffff", padding: "8px 12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                            <strong style={{ color: "#0a0a0f" }}>Rider &amp; Notes:</strong> {b.notes}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "4px" }}>
                          {isPending ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAcceptGig(b.id)}
                                style={{
                                  flex: 1,
                                  padding: "10px",
                                  borderRadius: "12px",
                                  backgroundColor: "#c6ff3d",
                                  color: "#0a0a0f",
                                  fontWeight: 900,
                                  fontSize: "12.5px",
                                  border: "none",
                                  cursor: "pointer",
                                  boxShadow: "0 2px 8px rgba(198, 255, 61, 0.3)",
                                }}
                              >
                                Accept Gig
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeclineGig(b.id)}
                                style={{
                                  padding: "10px 14px",
                                  borderRadius: "12px",
                                  backgroundColor: "#ffffff",
                                  color: "#e11d48",
                                  fontWeight: 800,
                                  fontSize: "12px",
                                  border: "1px solid #fecdd3",
                                  cursor: "pointer",
                                }}
                              >
                                Decline
                              </button>
                            </>
                          ) : (
                            <Link
                              href={`/band/artist/messages?conversation_id=${b.conversation_id || ""}`}
                              style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "12px",
                                backgroundColor: "#0a0a0f",
                                color: "#c6ff3d",
                                fontWeight: 900,
                                fontSize: "12.5px",
                                textDecoration: "none",
                                textAlign: "center",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                              }}
                            >
                              <MessageSquare style={{ width: "14px", height: "14px" }} />
                              <span>Direct Chat with Client</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Platform Guarantee Banner */}
            <div style={{ padding: "18px", borderRadius: "20px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0a0a0f", fontWeight: 800, fontSize: "13px" }}>
                <ShieldCheck style={{ width: "18px", height: "18px", color: "#059669" }} />
                <span>Artist Payout Guarantee</span>
              </div>
              <p style={{ margin: 0, fontSize: "11.5px", color: "#64748b", lineHeight: 1.5 }}>
                20% advance locked in escrow upon acceptance. Remaining balance settled on show day with automated payouts.
              </p>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
