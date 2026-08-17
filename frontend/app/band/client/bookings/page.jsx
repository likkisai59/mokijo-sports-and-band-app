import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import BandNavbar from "@/components/band/BandNavbar";
import BandFooter from "@/components/band/BandFooter";
import bandApi from "@/lib/bandApi";
import { getBandUser } from "@/lib/bandAuth";
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
} from "lucide-react";

const SAMPLE_CLIENT_BOOKINGS = [
  {
    id: 101,
    booking_number: "BCB-000101",
    event_name: "Grand Wedding Reception",
    performer_name: "The Deccan Strings",
    venue_name: "The Velvet Amphitheater",
    event_date: "2026-09-20",
    start_time: "19:00",
    end_time: "23:00",
    location: "Road No. 36, Jubilee Hills, Hyderabad",
    proposed_price: 59000,
    status: "accepted",
    notes: "Acoustic cello & Bollywood fusion sets requested.",
    statusLabel: "Accepted • Ready for 20% Deposit",
    statusColor: "#10b981",
    statusBg: "rgba(16, 185, 129, 0.08)",
    statusBorder: "rgba(16, 185, 129, 0.25)",
  },
  {
    id: 102,
    booking_number: "BCB-000102",
    event_name: "Corporate Tech Gala 2026",
    performer_name: "Rhea Chakraborty Live",
    venue_name: "Skyline Rooftop Lounge",
    event_date: "2026-10-05",
    start_time: "18:30",
    end_time: "21:30",
    location: "Financial District, Gachibowli, Hyderabad",
    proposed_price: 38000,
    status: "pending",
    notes: "Indie-pop & jazz acoustic set for dinner networking.",
    statusLabel: "Inquiry Under Review",
    statusColor: "#d97706",
    statusBg: "rgba(245, 158, 11, 0.08)",
    statusBorder: "rgba(245, 158, 11, 0.25)",
  },
  {
    id: 103,
    booking_number: "BCB-000103",
    event_name: "Annual Music Showcase",
    performer_name: "Groove Syndicate",
    venue_name: "Echo Underground Club",
    event_date: "2026-08-15",
    start_time: "20:00",
    end_time: "00:00",
    location: "Indiranagar 100ft Road, Bengaluru",
    proposed_price: 65000,
    status: "completed",
    notes: "High energy rock concert night.",
    statusLabel: "Event Completed",
    statusColor: "#64748b",
    statusBg: "#f1f5f9",
    statusBorder: "#cbd5e1",
  },
];

export default function ClientBookingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [bookings, setBookings] = useState(SAMPLE_CLIENT_BOOKINGS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const authUser = getBandUser();
    if (!authUser) {
      navigate("/band/login?redirect=/band/client/bookings");
      return;
    }
    setUser(authUser);

    async function loadBookings() {
      try {
        setLoading(true);
        const res = await bandApi.get("/bookings/my");
        if (res.data?.items && res.data.items.length > 0) {
          const mapped = res.data.items.map((b) => ({
            ...b,
            booking_number: `BCB-000${b.id}`,
            statusLabel:
              b.status === "accepted"
                ? "Accepted • Ready for 20% Deposit"
                : b.status === "confirmed"
                ? "Confirmed & Locked"
                : b.status === "completed"
                ? "Event Completed"
                : "Inquiry Under Review",
            statusColor: b.status === "accepted" ? "#10b981" : b.status === "confirmed" ? "#2563eb" : "#d97706",
            statusBg: b.status === "accepted" ? "rgba(16,185,129,0.08)" : b.status === "confirmed" ? "rgba(37,99,235,0.08)" : "rgba(245,158,11,0.08)",
            statusBorder: b.status === "accepted" ? "rgba(16,185,129,0.25)" : b.status === "confirmed" ? "rgba(37,99,235,0.25)" : "rgba(245,158,11,0.25)",
          }));
          setBookings(mapped);
        }
      } catch (err) {
        console.warn("Using sample client bookings dataset:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, [navigate]);

  const tabs = [
    { id: "all", label: "All Bookings", count: bookings.length },
    { id: "pending", label: "Pending Review", count: bookings.filter((b) => b.status === "pending").length },
    { id: "accepted", label: "Accepted / Pay Deposit", count: bookings.filter((b) => b.status === "accepted").length },
    { id: "completed", label: "Completed", count: bookings.filter((b) => b.status === "completed").length },
  ];

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "all") return true;
    return b.status === activeTab;
  });

  return (
    <div style={{ backgroundColor: "#f7f7f8", minHeight: "100vh", color: "#0a0a0f", width: "100%" }}>
      {/* ── TOP FULL BRAND NAVIGATION ── */}
      <BandNavbar />

      {/* ── MAIN CONTAINER ── */}
      <main style={{ maxWidth: "1320px", margin: "0 auto", padding: "40px 24px 80px", width: "100%", display: "flex", flexDirection: "column", gap: "32px" }}>
        
        {/* ── HEADER BANNER ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "9999px",
                backgroundColor: "#0a0a0f",
                color: "#c6ff3d",
                fontSize: "11px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                width: "fit-content",
              }}
            >
              <Sparkles style={{ width: "13px", height: "13px" }} />
              <span>Client Reservations • Escrow Tracking</span>
            </div>

            <h1 style={{ fontSize: "36px", fontWeight: 900, color: "#0a0a0f", letterSpacing: "-0.03em", margin: 0 }}>
              My Event Bookings
            </h1>
            <p style={{ fontSize: "14px", color: "#5c5c66", margin: 0, fontWeight: 500 }}>
              Track live performance inquiries, deposit advance escrow, and manage confirmed gig schedules.
            </p>
          </div>

          <Link
            to="/band/artists"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "14px 24px",
              borderRadius: "16px",
              backgroundColor: "#c6ff3d",
              color: "#0a0a0f",
              fontWeight: 800,
              fontSize: "14px",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(198, 255, 61, 0.4)",
              transition: "all 0.2s ease",
            }}
          >
            <Plus style={{ width: "16px", height: "16px" }} />
            <span>Create New Booking</span>
          </Link>
        </div>

        {/* ── FILTER TABS ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            overflowX: "auto",
            paddingBottom: "8px",
            borderBottom: "1px solid rgba(10, 10, 15, 0.08)",
          }}
        >
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  borderRadius: "14px",
                  fontSize: "13px",
                  fontWeight: 800,
                  border: active ? "1px solid #0a0a0f" : "1px solid #e2e8f0",
                  backgroundColor: active ? "#0a0a0f" : "#ffffff",
                  color: active ? "#c6ff3d" : "#5c5c66",
                  cursor: "pointer",
                  boxShadow: active ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                <span>{t.label}</span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    fontSize: "11px",
                    fontWeight: 900,
                    backgroundColor: active ? "rgba(198, 255, 61, 0.2)" : "#f1f5f9",
                    color: active ? "#c6ff3d" : "#64748b",
                  }}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── BOOKING CARDS LIST ── */}
        {filteredBookings.length === 0 ? (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "28px",
              border: "1px solid rgba(10, 10, 15, 0.08)",
              padding: "60px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div style={{ width: "60px", height: "60px", borderRadius: "20px", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
              <Calendar style={{ width: "28px", height: "28px" }} />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
              No Bookings in this Category
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0, maxWidth: "400px" }}>
              You don't have any bookings matching this status. Explore our live artist marketplace to schedule your next performance.
            </p>
            <Link
              to="/band/artists"
              style={{
                marginTop: "8px",
                padding: "12px 24px",
                borderRadius: "14px",
                backgroundColor: "#c6ff3d",
                color: "#0a0a0f",
                fontWeight: 800,
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              Explore Live Bands
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {filteredBookings.map((b) => (
              <div
                key={b.id}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "28px",
                  border: "1px solid rgba(10, 10, 15, 0.08)",
                  padding: "28px 32px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Top Row: Booking ID + Status Badge + Deal Value */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "16px",
                    paddingBottom: "16px",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "8px",
                        backgroundColor: "#0a0a0f",
                        color: "#ffffff",
                        fontFamily: "monospace",
                        fontWeight: 900,
                        fontSize: "12px",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {b.booking_number}
                    </span>

                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "9999px",
                        fontSize: "11px",
                        fontWeight: 800,
                        color: b.statusColor,
                        backgroundColor: b.statusBg,
                        border: `1px solid ${b.statusBorder}`,
                      }}
                    >
                      {b.statusLabel}
                    </span>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", display: "block" }}>
                      Estimated Deal
                    </span>
                    <span style={{ fontSize: "22px", fontWeight: 900, color: "#0a0a0f" }}>
                      ₹{Number(b.proposed_price).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Event Name & Metadata Grid */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                    {b.event_name}
                  </h2>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "14px",
                      fontSize: "13px",
                      color: "#64748b",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0a0a0f", fontWeight: 700 }}>
                      <Calendar style={{ width: "16px", height: "16px", color: "#64748b" }} />
                      <span>{b.event_date} ({b.start_time} - {b.end_time})</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0a0a0f", fontWeight: 700 }}>
                      <Music style={{ width: "16px", height: "16px", color: "#64748b" }} />
                      <span>{b.performer_name || "The Deccan Strings"}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0a0a0f", fontWeight: 700 }}>
                      <MapPin style={{ width: "16px", height: "16px", color: "#64748b" }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {b.location}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Notes + View Lifecycle Button */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "16px",
                    paddingTop: "16px",
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0, fontStyle: "italic", maxWidth: "600px" }}>
                    <strong>Notes:</strong> {b.notes || "Standard sound rider package."}
                  </p>

                  <Link
                    to={`/band/client/bookings/${b.id}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 24px",
                      borderRadius: "14px",
                      backgroundColor: "#0a0a0f",
                      color: "#c6ff3d",
                      fontWeight: 800,
                      fontSize: "13px",
                      textDecoration: "none",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span>View Lifecycle Tracker</span>
                    <ArrowRight style={{ width: "15px", height: "15px" }} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── FOOTER DIRECTORY ── */}
      <BandFooter />
    </div>
  );
}
