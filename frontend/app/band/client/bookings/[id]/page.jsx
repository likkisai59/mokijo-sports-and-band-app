import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  ArrowLeft,
  DollarSign,
  Download,
  MessageSquare,
  Sparkles,
  Star,
} from "lucide-react";
import ReviewModal from "@/components/band/ReviewModal";

export default function ClientBookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [advancePaid, setAdvancePaid] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const [booking, setBooking] = useState({
    id: Number(id) || 101,
    booking_number: `BCB-000${id || 101}`,
    event_name: "Grand Wedding Reception Live Concert",
    event_date: "2026-09-20",
    start_time: "19:00",
    end_time: "23:00",
    location: "The Velvet Amphitheater, Road No. 36, Jubilee Hills, Hyderabad",
    performer_name: "The Deccan Strings",
    venue_name: "The Velvet Amphitheater",
    proposed_price: 59000,
    status: "accepted", // pending | accepted | confirmed | completed
    notes: "Acoustic cello & Bollywood fusion sets requested. Sound rider: Wireless Microphones, Stage Monitors.",
    timeline: [
      { action: "Inquiry Created", date: "2026-08-16 17:30", note: "Booking inquiry submitted by Client" },
      { action: "Provider Accepted", date: "2026-08-16 17:45", note: "Artist accepted terms. Awaiting 20% advance payment." },
    ],
  });

  useEffect(() => {
    const authUser = getBandUser();
    if (!authUser) {
      navigate(`/band/login?redirect=/band/client/bookings/${id}`);
      return;
    }
    setUser(authUser);

    async function loadBookingDetail() {
      try {
        setLoading(true);
        const res = await bandApi.get(`/bookings/${id}`);
        if (res.data) {
          setBooking(res.data);
        }
      } catch (err) {
        console.warn("Using active mock booking lifecycle data:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadBookingDetail();
  }, [id, navigate]);

  const advance20 = Math.round(Number(booking.proposed_price) * 0.2);
  const remaining80 = Number(booking.proposed_price) - advance20;

  const handlePayAdvance = () => {
    setAdvancePaid(true);
    setBooking((prev) => ({
      ...prev,
      status: "confirmed",
      timeline: [
        ...prev.timeline,
        { action: "20% Advance Locked in Escrow", date: "Just now", note: `₹${advance20.toLocaleString("en-IN")} deposited securely.` },
      ],
    }));
  };

  const steps = [
    { title: "Inquiry Sent", desc: "Client submitted requirements", done: true },
    { title: "Provider Accepted", desc: "Artist accepted slot", done: booking.status !== "pending" },
    { title: "20% Advance Locked", desc: "Escrow payment deposited", done: booking.status === "confirmed" || advancePaid },
    { title: "Event Day Show", desc: "Live show execution", done: booking.status === "completed" },
    { title: "Escrow Released", desc: "80% settlement & review", done: booking.status === "completed" },
  ];

  return (
    <div style={{ backgroundColor: "#f7f7f8", minHeight: "100vh", color: "#0a0a0f", width: "100%" }}>
      {/* ── TOP BRAND NAVIGATION ── */}
      <BandNavbar />

      {/* ── MAIN CONTAINER ── */}
      <main style={{ maxWidth: "1320px", margin: "0 auto", padding: "40px 24px 80px", width: "100%", display: "flex", flexDirection: "column", gap: "32px" }}>
        
        {/* ── HEADER WITH BACK BUTTON & STATUS ── */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <Link
              to="/band/client/bookings"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                backgroundColor: "#ffffff",
                border: "1px solid rgba(10,10,15,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                color: "#0a0a0f",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
            >
              <ArrowLeft style={{ width: "18px", height: "18px" }} />
            </Link>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
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
                  {booking.booking_number}
                </span>

                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: booking.status === "confirmed" || advancePaid ? "#2563eb" : "#10b981",
                    backgroundColor: booking.status === "confirmed" || advancePaid ? "rgba(37,99,235,0.08)" : "rgba(16,185,129,0.08)",
                    border: booking.status === "confirmed" || advancePaid ? "1px solid rgba(37,99,235,0.25)" : "1px solid rgba(16,185,129,0.25)",
                    textTransform: "uppercase",
                  }}
                >
                  {advancePaid || booking.status === "confirmed" ? "CONFIRMED & LOCKED" : "ACCEPTED BY ARTIST"}
                </span>
              </div>

              <h1 style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", letterSpacing: "-0.03em", margin: 0 }}>
                {booking.event_name}
              </h1>
            </div>
          </div>

          <button
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
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
            <Download style={{ width: "16px", height: "16px", color: "#64748b" }} />
            <span>Download Invoice</span>
          </button>
        </div>

        {/* ── 5-STEP LIFECYCLE STEPPER CARD ── */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "28px",
            border: "1px solid rgba(10, 10, 15, 0.08)",
            padding: "32px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles style={{ width: "16px", height: "16px", color: "#0a0a0f" }} />
            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>
              Reservation Lifecycle Stepper
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "20px",
            }}
          >
            {steps.map((s, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: "10px",
                  padding: "16px 12px",
                  borderRadius: "20px",
                  backgroundColor: s.done ? "#f8fafc" : "transparent",
                  border: s.done ? "1px solid #e2e8f0" : "1px solid transparent",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "9999px",
                    backgroundColor: s.done ? "#c6ff3d" : "#f1f5f9",
                    color: s.done ? "#0a0a0f" : "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: "14px",
                    boxShadow: s.done ? "0 4px 12px rgba(198, 255, 61, 0.4)" : "none",
                  }}
                >
                  {s.done ? <CheckCircle2 style={{ width: "22px", height: "22px" }} /> : idx + 1}
                </div>

                <div>
                  <span style={{ fontSize: "14px", fontWeight: 900, color: "#0a0a0f", display: "block" }}>
                    {s.title}
                  </span>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500, display: "block", marginTop: "4px" }}>
                    {s.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TWO-COLUMN WORKSPACE: LOGISTICS + FINANCIAL ESCROW ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px", alignItems: "start" }}>
          
          {/* ── LEFT COLUMN (LOGISTICS & AUDIT LOG) ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px", gridColumn: "span 2" }}>
            
            {/* Logistics & Schedule Card */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "28px",
                border: "1px solid rgba(10, 10, 15, 0.08)",
                padding: "32px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0, paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
                Logistics & Schedule
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "24px",
                }}
              >
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", display: "block", marginBottom: "6px" }}>
                    EVENT DATE & TIME
                  </span>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#0a0a0f", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Calendar style={{ width: "16px", height: "16px", color: "#64748b" }} />
                    <span>{booking.event_date} ({booking.start_time} - {booking.end_time})</span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", display: "block", marginBottom: "6px" }}>
                    PERFORMER / ARTIST
                  </span>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#0a0a0f", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Music style={{ width: "16px", height: "16px", color: "#64748b" }} />
                    <span>{booking.performer_name || "The Deccan Strings"}</span>
                  </div>
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", display: "block", marginBottom: "6px" }}>
                    VENUE & LOCATION
                  </span>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#0a0a0f", display: "flex", alignItems: "center", gap: "8px" }}>
                    <MapPin style={{ width: "16px", height: "16px", color: "#64748b", flexShrink: 0 }} />
                    <span>{booking.location}</span>
                  </div>
                </div>

                <div style={{ gridColumn: "span 2", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", display: "block", marginBottom: "6px" }}>
                    SPECIAL RIDER & INSTRUCTIONS
                  </span>
                  <p style={{ fontSize: "13px", color: "#5c5c66", lineHeight: 1.6, margin: 0 }}>
                    {booking.notes}
                  </p>
                </div>
              </div>
            </div>

            {/* Activity Audit Log Card */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "28px",
                border: "1px solid rgba(10, 10, 15, 0.08)",
                padding: "32px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0, paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
                Activity Audit Log
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {booking.timeline.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "9999px", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                      <CheckCircle2 style={{ width: "16px", height: "16px" }} />
                    </div>
                    <div>
                      <span style={{ fontSize: "14px", fontWeight: 800, color: "#0a0a0f", display: "block" }}>
                        {item.action}
                      </span>
                      <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                        {item.note}
                      </p>
                      <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600, display: "block", marginTop: "4px" }}>
                        {item.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN (ESCROW SETTLEMENT & PAYMENT) ── */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "28px",
              border: "1px solid rgba(10, 10, 15, 0.08)",
              padding: "32px",
              boxShadow: "0 6px 25px rgba(0, 0, 0, 0.04)",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {/* Total Contract */}
            <div style={{ paddingBottom: "20px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", display: "block", marginBottom: "4px" }}>
                TOTAL CONTRACT
              </span>
              <div style={{ fontSize: "36px", fontWeight: 900, color: "#0a0a0f", lineHeight: 1 }}>
                ₹{Number(booking.proposed_price).toLocaleString("en-IN")}
              </div>
            </div>

            {/* Split Breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>20% Advance Lock Deposit</span>
                <span style={{ fontWeight: 800, color: "#0a0a0f" }}>₹{advance20.toLocaleString("en-IN")}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>80% On-Ground Balance</span>
                <span style={{ fontWeight: 800, color: "#0a0a0f" }}>₹{remaining80.toLocaleString("en-IN")}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Platform Protection Fee</span>
                <span style={{ fontWeight: 800, color: "#10b981" }}>FREE</span>
              </div>
            </div>

            {/* Action Container */}
            {!advancePaid && booking.status === "accepted" ? (
              <div
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.08)",
                  borderRadius: "20px",
                  border: "1px solid rgba(245, 158, 11, 0.25)",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#d97706", display: "block" }}>
                    Provider Accepted Your Offer!
                  </span>
                  <p style={{ fontSize: "12px", color: "#92400e", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                    Lock your date by paying the 20% advance (₹{advance20.toLocaleString("en-IN")}) into escrow.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePayAdvance}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "16px",
                    backgroundColor: "#c6ff3d",
                    color: "#0a0a0f",
                    fontWeight: 900,
                    fontSize: "14px",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(198, 255, 61, 0.4)",
                    transition: "all 0.2s ease",
                  }}
                >
                  Lock Date & Pay 20% Advance (₹{advance20.toLocaleString("en-IN")})
                </button>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.08)",
                  borderRadius: "20px",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontWeight: 800, fontSize: "14px" }}>
                  <ShieldCheck style={{ width: "18px", height: "18px" }} />
                  <span>20% Advance Locked in Escrow</span>
                </div>
                <p style={{ fontSize: "12px", color: "#065f46", margin: 0, lineHeight: 1.4 }}>
                  Your performance date is 100% confirmed. The balance ₹{remaining80.toLocaleString("en-IN")} is paid after the show.
                </p>
              </div>
            )}

            {/* Chat & Review Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "14px",
                  backgroundColor: "#0a0a0f",
                  color: "#c6ff3d",
                  fontWeight: 800,
                  fontSize: "13px",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                <Star style={{ width: "16px", height: "16px", fill: "#c6ff3d" }} />
                <span>Write a Verified Review</span>
              </button>

              <Link
                to={booking.conversation_id ? `/band/client/messages?conversation_id=${booking.conversation_id}` : `/band/client/messages`}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "14px",
                  backgroundColor: "#f8fafc",
                  color: "#0a0a0f",
                  fontWeight: 700,
                  fontSize: "13px",
                  border: "1px solid #e2e8f0",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <MessageSquare style={{ width: "16px", height: "16px", color: "#64748b" }} />
                <span>Chat with {booking.artist_name || booking.performer_name || "Performer"}</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Review Modal */}
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          bookingId={booking.id}
          artistProfileId={1}
          performerName={booking.performer_name}
        />
      </main>

      {/* ── FOOTER DIRECTORY ── */}
      <BandFooter />
    </div>
  );
}
