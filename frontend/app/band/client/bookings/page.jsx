"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Music,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
  Sparkles,
  Inbox,
  RefreshCw,
  Search,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import bandApi from "@/lib/bandApi";
import toast from "react-hot-toast";

export default function ClientBookingsPage() {
  const [filter, setFilter] = useState("all");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchClientBookings = useCallback(async () => {
    try {
      const res = await bandApi.get("/bookings/my");
      if (res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.items || [];
        setBookings(items);
      }
    } catch {
      // Clean fallback zero state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchClientBookings();
  }, [fetchClientBookings]);

  const handleCancelBooking = async (id) => {
    if (!confirm("Are you sure you want to cancel this booking request?")) return;
    try {
      await bandApi.post(`/bookings/${id}/cancel`);
      toast.success("Booking cancelled.");
      fetchClientBookings();
    } catch {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
      toast.success("Booking cancelled");
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const statusMatch =
      filter === "all"
        ? true
        : filter === "confirmed"
        ? b.status === "accepted" || b.status === "confirmed" || b.status === "locked"
        : b.status === filter;

    const searchMatch =
      !searchQuery.trim() ||
      (b.event_name || b.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.artist_name || b.performer || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.location || "").toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && searchMatch;
  });

  return (
    <DashboardLayout role="client">
      <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "1300px", margin: "0 auto", width: "100%" }}>
        
        {/* Header Title Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 12px", borderRadius: "9999px", backgroundColor: "#0a0a0f", color: "#c6ff3d", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
              <Calendar style={{ width: "13px", height: "13px" }} />
              <span>Event Orders &amp; Timeline</span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
              My Bookings &amp; Event Orders
            </h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0", fontWeight: 500 }}>
              Track live status transitions, provider responses, contracted escrow amounts, and event schedules.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              to="/band/artists"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 22px",
                borderRadius: "14px",
                backgroundColor: "#c6ff3d",
                color: "#0a0a0f",
                fontWeight: 900,
                fontSize: "13px",
                textDecoration: "none",
                boxShadow: "0 2px 10px rgba(198, 255, 61, 0.4)",
              }}
            >
              <Plus style={{ width: "16px", height: "16px" }} />
              <span>Book New Artist</span>
            </Link>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", backgroundColor: "#ffffff", padding: "12px 16px", borderRadius: "20px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            {[
              { id: "all", label: "All Bookings" },
              { id: "pending", label: "Pending Response" },
              { id: "confirmed", label: "Confirmed & Locked" },
              { id: "completed", label: "Completed" },
              { id: "cancelled", label: "Cancelled" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: filter === f.id ? "#0a0a0f" : "transparent",
                  color: filter === f.id ? "#c6ff3d" : "#64748b",
                  fontWeight: filter === f.id ? 800 : 600,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ position: "relative", display: "flex", alignItems: "center", minWidth: "260px" }}>
            <Search style={{ width: "16px", height: "16px", position: "absolute", left: "12px", color: "#94a3b8" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event, artist, location..."
              style={{
                padding: "8px 14px 8px 36px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                fontSize: "12.5px",
                color: "#0a0a0f",
                outline: "none",
                width: "100%",
                backgroundColor: "#f8fafc",
              }}
            />
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div
            style={{
              padding: "60px 24px",
              borderRadius: "24px",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: "14px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
              }}
            >
              <Inbox style={{ width: "28px", height: "28px" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0a0a0f", margin: 0 }}>
                No Bookings in "{filter.toUpperCase()}"
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0", maxWidth: "420px", lineHeight: 1.5 }}>
                Browse verified musical performers and send direct booking inquiries with guaranteed escrow protection.
              </p>
            </div>
            <Link
              to="/band/artists"
              style={{
                marginTop: "4px",
                padding: "10px 22px",
                borderRadius: "12px",
                backgroundColor: "#c6ff3d",
                color: "#0a0a0f",
                fontWeight: 900,
                fontSize: "13px",
                textDecoration: "none",
                boxShadow: "0 2px 10px rgba(198, 255, 61, 0.4)",
              }}
            >
              Browse Artists &amp; Venues
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredBookings.map((b) => {
              const isConfirmed = b.status === "accepted" || b.status === "confirmed" || b.status === "locked";
              const isPending = b.status === "pending" || b.status === "inquiry";
              const isCompleted = b.status === "completed";

              return (
                <div
                  key={b.id}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "24px",
                    border: "1px solid #e2e8f0",
                    padding: "24px 28px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", paddingBottom: "14px", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            padding: "3px 10px",
                            borderRadius: "9999px",
                            backgroundColor: isConfirmed ? "#ecfdf5" : isPending ? "#fef3c7" : isCompleted ? "#eff6ff" : "#f1f5f9",
                            color: isConfirmed ? "#047857" : isPending ? "#92400e" : isCompleted ? "#2563eb" : "#475569",
                            border: isConfirmed ? "1px solid #a7f3d0" : isPending ? "1px solid #fde68a" : "1px solid #e2e8f0",
                          }}
                        >
                          {b.status?.toUpperCase() || "PENDING"}
                        </span>
                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                          Performer: <strong style={{ color: "#0a0a0f" }}>{b.artist_name || b.performer || "Live Artist"}</strong>
                        </span>
                      </div>
                      <h2 style={{ fontSize: "19px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                        {b.event_name || b.title || "Music Booking Order"}
                      </h2>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#94a3b8", display: "block" }}>
                        Total Amount
                      </span>
                      <span style={{ fontSize: "24px", fontWeight: 900, color: "#0a0a0f", display: "block" }}>
                        {b.total_amount ? `₹${Number(b.total_amount).toLocaleString("en-IN")}` : b.offer_amount || "₹0"}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "24px", fontSize: "13px", color: "#475569", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Calendar style={{ width: "16px", height: "16px", color: "#64748b" }} />
                      <span style={{ fontWeight: 800, color: "#0a0a0f" }}>{b.date || b.event_date || "Date Pending"}</span>
                      {b.time && <span>({b.time})</span>}
                    </div>

                    {b.location && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <MapPin style={{ width: "16px", height: "16px", color: "#64748b" }} />
                        <span>{b.location}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", paddingTop: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>
                      100% Escrow Protected Booking
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(b.id)}
                          style={{
                            padding: "9px 16px",
                            borderRadius: "10px",
                            backgroundColor: "#ffffff",
                            color: "#e11d48",
                            fontWeight: 800,
                            fontSize: "12.5px",
                            border: "1px solid #fecdd3",
                            cursor: "pointer",
                          }}
                        >
                          Cancel Request
                        </button>
                      )}

                      {isCompleted && (
                        <Link
                          to={`/band/client/reviews?booking_id=${b.id}`}
                          style={{
                            padding: "9px 18px",
                            borderRadius: "10px",
                            backgroundColor: "#0a0a0f",
                            color: "#c6ff3d",
                            fontWeight: 800,
                            fontSize: "12.5px",
                            textDecoration: "none",
                          }}
                        >
                          Write Review ★
                        </Link>
                      )}

                      <Link
                        to={b.conversation_id ? `/band/client/messages?conversation_id=${b.conversation_id}` : `/band/client/messages?booking_id=${b.id}`}
                        style={{
                          padding: "9px 18px",
                          borderRadius: "10px",
                          backgroundColor: isConfirmed ? "#0a0a0f" : "#f1f5f9",
                          color: isConfirmed ? "#c6ff3d" : "#334155",
                          fontWeight: 800,
                          fontSize: "12.5px",
                          textDecoration: "none",
                        }}
                      >
                        {isConfirmed ? "Chat with Artist 💬" : "Message Provider"}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
