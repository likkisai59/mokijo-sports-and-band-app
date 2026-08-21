"use client";

import * as React from "react";
import { BookingStatusBadge } from "../BookingStatusBadge";
import { BookingDetailsDialog } from "../BookingDetailsDialog";
import {
  Search,
  Calendar,
  User,
  History,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

export function BookingHistoryTab({
  role,
  bookings = [],
  loading,
  onRefresh,
}) {
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [selectedBookingId, setSelectedBookingId] = React.useState(null);
  const [page, setPage] = React.useState(1);
  const limit = 12;

  const historyBookings = React.useMemo(() => {
    return bookings.filter((b) =>
      ["completed", "cancelled", "expired", "declined", "rejected"].includes((b.status || "").toLowerCase())
    );
  }, [bookings]);

  const filteredBookings = React.useMemo(() => {
    return historyBookings.filter((b) => {
      const st = (b.status || "").toLowerCase();
      let matchesFilter = true;
      if (filter === "completed") matchesFilter = st === "completed";
      else if (filter === "cancelled") matchesFilter = st === "cancelled";
      else if (filter === "expired") matchesFilter = st === "expired";
      else if (filter === "rejected") matchesFilter = st === "rejected" || st === "declined";

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

      return matchesFilter && matchesSearch;
    });
  }, [historyBookings, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / limit));
  const paginatedBookings = React.useMemo(() => {
    const start = (page - 1) * limit;
    return filteredBookings.slice(start, start + limit);
  }, [filteredBookings, page, limit]);

  const counts = React.useMemo(() => {
    return {
      all: historyBookings.length,
      completed: historyBookings.filter((b) => (b.status || "").toLowerCase() === "completed").length,
      cancelled: historyBookings.filter((b) => (b.status || "").toLowerCase() === "cancelled").length,
      expired: historyBookings.filter((b) => (b.status || "").toLowerCase() === "expired").length,
      rejected: historyBookings.filter((b) => ["rejected", "declined"].includes((b.status || "").toLowerCase())).length,
    };
  }, [historyBookings]);

  const FILTERS = [
    { id: "all", label: "All History", count: counts.all, icon: History },
    { id: "completed", label: "Completed", count: counts.completed, icon: CheckCircle },
    { id: "cancelled", label: "Cancelled", count: counts.cancelled, icon: XCircle },
    { id: "expired", label: "Expired", count: counts.expired, icon: Clock },
    { id: "rejected", label: "Rejected", count: counts.rejected, icon: XCircle },
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
          {FILTERS.map((f) => {
            const isActive = filter === f.id;
            const Icon = f.icon;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => { setFilter(f.id); setPage(1); }}
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
                <Icon style={{ width: "13px", height: "13px" }} />
                <span>{f.label}</span>
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
                  {f.count}
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
            placeholder="Search past events or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748b" }}>Loading booking archives...</span>
        </div>
      ) : paginatedBookings.length === 0 ? (
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
            <History style={{ width: "24px", height: "24px" }} />
          </div>
          <h3 style={{ fontSize: "15px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
            No History Records
          </h3>
          <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0, maxWidth: "380px", lineHeight: 1.5 }}>
            No completed, cancelled, or archived booking records match your query.
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
          {paginatedBookings.map((b) => (
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
                    {b.event_name || "Historic Booking"}
                  </h3>
                  <BookingStatusBadge status={b.status} />
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
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", display: "block" }}>Final Value</span>
                  <span style={{ fontSize: "15px", fontWeight: 900, color: "#0a0a0f" }}>
                    {formatCurrency(b.proposed_price || b.total_price || 0)}
                  </span>
                </div>

                <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", fontFamily: "monospace" }}>
                  ID: #{String(b.id).slice(-6)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
          <span>
            Page {page} of {totalPages} ({filteredBookings.length} total entries)
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                backgroundColor: page <= 1 ? "#f8fafc" : "#ffffff",
                color: page <= 1 ? "#cbd5e1" : "#0a0a0f",
                cursor: page <= 1 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft style={{ width: "16px", height: "16px" }} />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                backgroundColor: page >= totalPages ? "#f8fafc" : "#ffffff",
                color: page >= totalPages ? "#cbd5e1" : "#0a0a0f",
                cursor: page >= totalPages ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronRight style={{ width: "16px", height: "16px" }} />
            </button>
          </div>
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
