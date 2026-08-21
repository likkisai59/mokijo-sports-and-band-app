"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  RefreshCw,
  Search,
  DollarSign,
  MessageSquare,
  Sparkles,
  Inbox,
  ArrowRight,
  Filter,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import bandApi from "@/lib/bandApi";
import toast from "react-hot-toast";

export default function ArtistBookingsPage() {
  const [filter, setFilter] = useState("all"); // all | pending | confirmed | completed | rejected
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Counter offer modal state
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterNote, setCounterNote] = useState("");

  const fetchBookings = useCallback(async () => {
    try {
      const res = await bandApi.get("/bookings/my");
      if (res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.items || [];
        setBookings(items);
      }
    } catch {
      // Fallback clean zero state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleAction = async (bookingId, action) => {
    try {
      if (action === "accepted") {
        await bandApi.post(`/bookings/${bookingId}/accept`);
        toast.success("Booking accepted! Direct chat initialized with client.");
      } else {
        await bandApi.post(`/bookings/${bookingId}/decline`);
        toast.success("Booking declined.");
      }
      fetchBookings();
    } catch (err) {
      console.error(`Booking ${action} failed:`, err);
      toast.error(err.response?.data?.detail || `Failed to update booking.`);
    }
  };

  const handleOpenCounterModal = (booking) => {
    setSelectedBooking(booking);
    setCounterAmount(booking.proposed_price || booking.total_amount || "");
    setCounterNote("");
    setCounterModalOpen(true);
  };

  const handleSubmitCounter = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      await bandApi.post(`/bookings/${selectedBooking.id}/counter`, {
        counter_price: Number(counterAmount),
        notes: counterNote,
      });
      toast.success("Counter-offer submitted to host!");
      setCounterModalOpen(false);
      fetchBookings();
    } catch (err) {
      console.error("Counter offer failed:", err);
      toast.error(err.response?.data?.detail || "Failed to submit counter-offer.");
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
      (b.client_name || b.client_email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.location || "").toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && searchMatch;
  });

  return (
    <DashboardLayout role="artist">
      <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "1300px", margin: "0 auto", width: "100%" }}>
        
        {/* Header Title Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 12px", borderRadius: "9999px", backgroundColor: "#0a0a0f", color: "#c6ff3d", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
              <Calendar style={{ width: "13px", height: "13px" }} />
              <span>Gigs &amp; Booking Management</span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
              Performance Calendar &amp; Gigs Schedule
            </h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0", fontWeight: 500 }}>
              Review incoming client inquiries, accept performance requests, manage counter-offers, and track confirmed stage dates.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                fetchBookings();
              }}
              disabled={refreshing}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "11px 18px",
                borderRadius: "14px",
                backgroundColor: "#ffffff",
                color: "#0a0a0f",
                fontWeight: 800,
                fontSize: "13px",
                border: "1px solid #e2e8f0",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
            >
              <RefreshCw style={{ width: "15px", height: "15px", animation: refreshing ? "spin 1s linear infinite" : "none" }} />
              <span>{refreshing ? "Refreshing..." : "Sync Live"}</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", backgroundColor: "#ffffff", padding: "12px 16px", borderRadius: "20px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            {[
              { id: "all", label: "All Gigs" },
              { id: "pending", label: "Pending Offers" },
              { id: "confirmed", label: "Confirmed Shows" },
              { id: "completed", label: "Completed" },
              { id: "rejected", label: "Declined" },
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
              placeholder="Search by event, host, city..."
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
                No Gigs Found in "{filter.toUpperCase()}"
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0", maxWidth: "420px", lineHeight: 1.5 }}>
                When event organizers and concert venues send booking requests, they will be organized here by status.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredBookings.map((b) => {
              const isPending = b.status === "pending" || b.status === "inquiry";
              const isConfirmed = b.status === "accepted" || b.status === "confirmed" || b.status === "locked";

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
                  {/* Top Bar */}
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
                            backgroundColor: isConfirmed ? "#ecfdf5" : isPending ? "#fef3c7" : "#f1f5f9",
                            color: isConfirmed ? "#047857" : isPending ? "#92400e" : "#475569",
                            border: isConfirmed ? "1px solid #a7f3d0" : isPending ? "1px solid #fde68a" : "1px solid #e2e8f0",
                          }}
                        >
                          {b.status?.toUpperCase() || "PENDING"}
                        </span>
                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                          Host: <strong style={{ color: "#0a0a0f" }}>{b.client_name || b.client_email || "Event Host"}</strong>
                        </span>
                      </div>
                      <h2 style={{ fontSize: "19px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                        {b.event_name || b.title || "Live Performance Gig"}
                      </h2>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#94a3b8", display: "block" }}>
                        Contract Fee
                      </span>
                      <span style={{ fontSize: "24px", fontWeight: 900, color: "#0a0a0f", display: "block" }}>
                        {b.total_amount ? `₹${Number(b.total_amount).toLocaleString("en-IN")}` : b.offer_amount || "₹0"}
                      </span>
                    </div>
                  </div>

                  {/* Mid Bar: Date, Location & Host Info */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#475569" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Calendar style={{ width: "16px", height: "16px", color: "#64748b" }} />
                        <span style={{ fontWeight: 800, color: "#0a0a0f" }}>{b.date || b.event_date || "Date Pending"}</span>
                        {b.start_time && <span>({b.start_time} - {b.end_time || ""})</span>}
                      </div>

                      {b.location && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <MapPin style={{ width: "16px", height: "16px", color: "#64748b" }} />
                          <span>{b.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Host Contact Row */}
                    {(b.client_mobile || b.client_email) && (
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", color: "#64748b", flexWrap: "wrap" }}>
                        {b.client_mobile && (
                          <span style={{ color: "#059669", fontWeight: 700 }}>📞 {b.client_mobile}</span>
                        )}
                        {b.client_email && (
                          <span>✉️ {b.client_email}</span>
                        )}
                      </div>
                    )}

                    {/* Notes & Rider */}
                    {b.notes && (
                      <div style={{ fontSize: "12px", color: "#475569", backgroundColor: "#f8fafc", padding: "10px 14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <strong style={{ color: "#0a0a0f" }}>Client Notes &amp; Rider:</strong> {b.notes}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", paddingTop: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>
                      Escrow Clearance Protected · 100% Guaranteed Payout
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAction(b.id, "accepted")}
                            style={{
                              padding: "10px 22px",
                              borderRadius: "12px",
                              backgroundColor: "#c6ff3d",
                              color: "#0a0a0f",
                              fontWeight: 900,
                              fontSize: "13px",
                              border: "none",
                              cursor: "pointer",
                              boxShadow: "0 2px 10px rgba(198, 255, 61, 0.4)",
                            }}
                          >
                            Accept Gig
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenCounterModal(b)}
                            style={{
                              padding: "10px 18px",
                              borderRadius: "12px",
                              backgroundColor: "#f8fafc",
                              color: "#0a0a0f",
                              fontWeight: 800,
                              fontSize: "13px",
                              border: "1px solid #e2e8f0",
                              cursor: "pointer",
                            }}
                          >
                            Counter-Offer
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAction(b.id, "rejected")}
                            style={{
                              padding: "10px 18px",
                              borderRadius: "12px",
                              backgroundColor: "#ffffff",
                              color: "#e11d48",
                              fontWeight: 800,
                              fontSize: "13px",
                              border: "1px solid #fecdd3",
                              cursor: "pointer",
                            }}
                          >
                            Decline
                          </button>
                        </>
                      )}

                      <Link
                        href={`/band/artist/messages?booking_id=${b.id}`}
                        style={{
                          padding: "10px 18px",
                          borderRadius: "12px",
                          backgroundColor: "#f1f5f9",
                          color: "#334155",
                          fontWeight: 800,
                          fontSize: "13px",
                          textDecoration: "none",
                        }}
                      >
                        Message Host
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Counter Offer Modal */}
        {counterModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "20px",
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "24px",
                padding: "32px",
                maxWidth: "480px",
                width: "100%",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0a0a0f", margin: 0 }}>
                Propose Counter-Offer
              </h3>
              <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>
                Suggest a revised performance fee or timing conditions to the client host.
              </p>

              <form onSubmit={handleSubmitCounter} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f" }}>
                    Revised Fee (₹) *
                  </label>
                  <input
                    type="number"
                    value={counterAmount}
                    onChange={(e) => setCounterAmount(e.target.value)}
                    required
                    style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", outline: "none" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f" }}>
                    Reason / Technical Notes
                  </label>
                  <textarea
                    rows={3}
                    value={counterNote}
                    onChange={(e) => setCounterNote(e.target.value)}
                    placeholder="e.g. Additional travel allowance or 6-piece full band rider included..."
                    style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px", outline: "none", resize: "none" }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setCounterModalOpen(false)}
                    style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#64748b", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: "10px 22px", borderRadius: "10px", border: "none", backgroundColor: "#c6ff3d", color: "#0a0a0f", fontWeight: 900, fontSize: "13px", cursor: "pointer" }}
                  >
                    Send Counter-Offer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
