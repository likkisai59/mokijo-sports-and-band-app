"use client";

import * as React from "react";
import { BookingStatusBadge } from "../BookingStatusBadge";
import { BookingDetailsDialog } from "../BookingDetailsDialog";
import {
  Search,
  Calendar,
  User,
  Inbox,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

export function BookingInboxTab({
  role,
  bookings = [],
  loading,
  onRefresh,
}) {
  const [subTab, setSubTab] = React.useState("incoming");
  const [search, setSearch] = React.useState("");
  const [selectedBookingId, setSelectedBookingId] = React.useState(null);

  const activeBookings = React.useMemo(() => {
    return bookings.filter(
      (b) => !["completed", "cancelled", "expired"].includes((b.status || "").toLowerCase())
    );
  }, [bookings]);

  const filteredBookings = React.useMemo(() => {
    return activeBookings.filter((b) => {
      const st = (b.status || "").toLowerCase();
      let matchesTab = false;
      if (subTab === "incoming") {
        matchesTab = st === "requested" || st === "received" || st === "created" || st === "inquiry";
      } else if (subTab === "countered") {
        matchesTab = st === "countered" || st === "counter_offered";
      } else if (subTab === "pending") {
        matchesTab = st.includes("pending") || st === "draft";
      } else if (subTab === "accepted") {
        matchesTab = st === "accepted" || st === "confirmed";
      } else if (subTab === "rejected") {
        matchesTab = st === "rejected" || st === "declined";
      }

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (b.event_name || "").toLowerCase().includes(q) ||
        (b.client?.name && b.client.name.toLowerCase().includes(q)) ||
        (b.client_name && b.client_name.toLowerCase().includes(q)) ||
        (b.artist?.display_name && b.artist.display_name.toLowerCase().includes(q)) ||
        (b.artist_name && b.artist_name.toLowerCase().includes(q)) ||
        (b.venue_name && b.venue_name.toLowerCase().includes(q)) ||
        String(b.id || "").toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [activeBookings, subTab, search]);

  const subTabCounts = React.useMemo(() => {
    return {
      incoming: activeBookings.filter((b) =>
        ["requested", "received", "created", "inquiry"].includes((b.status || "").toLowerCase())
      ).length,
      countered: activeBookings.filter((b) =>
        ["countered", "counter_offered"].includes((b.status || "").toLowerCase())
      ).length,
      pending: activeBookings.filter((b) =>
        (b.status || "").toLowerCase().includes("pending") || (b.status || "").toLowerCase() === "draft"
      ).length,
      accepted: activeBookings.filter((b) =>
        ["accepted", "confirmed"].includes((b.status || "").toLowerCase())
      ).length,
      rejected: activeBookings.filter((b) => ["rejected", "declined"].includes((b.status || "").toLowerCase())).length,
    };
  }, [activeBookings]);

  const TABS = [
    { id: "incoming", label: "Incoming Requests", count: subTabCounts.incoming },
    { id: "countered", label: "Counter Offers", count: subTabCounts.countered },
    { id: "pending", label: "Pending Client", count: subTabCounts.pending },
    { id: "accepted", label: "Accepted Gigs", count: subTabCounts.accepted },
    { id: "rejected", label: "Rejected / Declined", count: subTabCounts.rejected },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* ── Sub-navigation & Search Toolbar ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
          {TABS.map((tab) => {
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  border: isActive ? "none" : "1px solid #e2e8f0",
                  backgroundColor: isActive ? "#0a0a0f" : "#f8fafc",
                  color: isActive ? "#c6ff3d" : "#475569",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    padding: "2px 6px",
                    borderRadius: "6px",
                    fontSize: "10px",
                    fontWeight: 900,
                    backgroundColor: isActive ? "#c6ff3d" : "#e2e8f0",
                    color: "#0a0a0f",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ position: "relative", minWidth: "260px" }}>
          <Search
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "15px",
              height: "15px",
              color: "#94a3b8",
            }}
          />
          <input
            placeholder="Search inquiries by name, event or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              height: "38px",
              paddingLeft: "36px",
              paddingRight: "14px",
              borderRadius: "10px",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              fontSize: "12px",
              fontWeight: 600,
              color: "#0a0a0f",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* ── Content Grid or Empty State ── */}
      {loading ? (
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
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748b" }}>Loading booking records...</span>
        </div>
      ) : filteredBookings.length === 0 ? (
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
            <Inbox style={{ width: "24px", height: "24px" }} />
          </div>
          <h3 style={{ fontSize: "15px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
            No Active Inquiries Found
          </h3>
          <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0, maxWidth: "380px", lineHeight: 1.5 }}>
            No booking records currently match the &ldquo;{TABS.find(t => t.id === subTab)?.label}&rdquo; filter. New incoming requests will appear here in real time.
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
          {filteredBookings.map((b) => {
            const clientTitle = b.client?.name || b.client_name || "Direct Client";
            const partnerTitle = b.artist?.display_name || b.artist_name || b.venue_name || "Event Venue";
            
            return (
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
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                    <h3 style={{ fontSize: "14.5px", fontWeight: 900, color: "#0a0a0f", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {b.event_name || "Venue Reservation"}
                    </h3>
                    <BookingStatusBadge status={b.status} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                    <User style={{ width: "13px", height: "13px", color: "#0a0a0f" }} />
                    <span>{role === "client" ? partnerTitle : clientTitle}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                    <Calendar style={{ width: "13px", height: "13px", color: "#0a0a0f" }} />
                    <span>{formatDate(b.event_date)} ({b.start_time} - {b.end_time})</span>
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
                    <span style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", display: "block" }}>Proposed Budget</span>
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
                    <span>Inspect</span>
                    <ChevronRight style={{ width: "14px", height: "14px" }} />
                  </div>
                </div>
              </div>
            );
          })}
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
