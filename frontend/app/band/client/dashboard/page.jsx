import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getBandUser } from "@/lib/bandAuth";
import bandApi from "@/lib/bandApi";
import {
  Calendar,
  Music,
  Building2,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Star,
  Users,
  Compass,
  DollarSign,
  MessageSquare,
  ShieldCheck,
  Plus,
  ChevronRight,
  Headphones,
  Inbox,
  RefreshCw,
} from "lucide-react";

export default function ClientDashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Real Dynamic Stats (Initialized to Zero — No Dummy Numbers)
  const [stats, setStats] = useState({
    active_bookings: 0,
    pending_requests: 0,
    completed_events: 0,
    total_spent: 0,
  });

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [featuredArtists, setFeaturedArtists] = useState([]);

  useEffect(() => {
    const authUser = getBandUser();
    if (authUser) setUser(authUser);
  }, []);

  const fetchClientDashboard = useCallback(async () => {
    try {
      const [bookingsRes, artistsRes] = await Promise.allSettled([
        bandApi.get("/bookings/my"),
        bandApi.get("/artists?limit=3"),
      ]);

      let pendingCount = 0;
      let activeCount = 0;
      let completedCount = 0;
      let totalSpent = 0;
      let eventsList = [];

      if (bookingsRes.status === "fulfilled" && bookingsRes.value?.data) {
        const bData = bookingsRes.value.data;
        const items = Array.isArray(bData) ? bData : bData.items || [];

        items.forEach((b) => {
          if (b.status === "pending" || b.status === "inquiry" || b.status === "counter_offered") {
            pendingCount++;
          } else if (b.status === "accepted" || b.status === "confirmed" || b.status === "locked") {
            activeCount++;
            eventsList.push(b);
          } else if (b.status === "completed") {
            completedCount++;
          }
          if (b.status === "accepted" || b.status === "confirmed" || b.status === "completed") {
            totalSpent += Number(b.total_amount || b.agreed_price || b.offer_amount || 0) || 0;
          }
        });

        setUpcomingEvents(eventsList);
      }

      if (artistsRes.status === "fulfilled" && artistsRes.value?.data) {
        const aData = artistsRes.value.data;
        const aItems = Array.isArray(aData) ? aData : aData.items || [];
        setFeaturedArtists(aItems.slice(0, 3));
      }

      setStats({
        active_bookings: activeCount,
        pending_requests: pendingCount,
        completed_events: completedCount,
        total_spent: totalSpent,
      });
    } catch {
      // Graceful clean zero state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchClientDashboard();
  }, [fetchClientDashboard]);

  return (
    <DashboardLayout role="client">
      <div style={{ maxWidth: "1320px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "32px" }}>

        {/* ── 1. HERO WELCOME BANNER ── */}
        <div
          style={{
            position: "relative",
            backgroundColor: "#ffffff",
            borderRadius: "28px",
            border: "1px solid rgba(10, 10, 15, 0.08)",
            padding: "36px 40px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "24px",
          }}
        >
          {/* Ambient Glow */}
          <div
            style={{
              position: "absolute",
              top: "-50px",
              right: "-50px",
              width: "350px",
              height: "350px",
              backgroundColor: "rgba(198, 255, 61, 0.18)",
              borderRadius: "9999px",
              filter: "blur(70px)",
              pointerEvents: "none",
            }}
          />

          {/* Left Text */}
          <div style={{ position: "relative", zIndex: 1, maxWidth: "680px", display: "flex", flexDirection: "column", gap: "12px" }}>
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
              <Sparkles style={{ width: "14px", height: "14px" }} />
              <span>Client Experience Hub</span>
            </div>

            <h1 style={{ fontSize: "36px", fontWeight: 900, color: "#0a0a0f", letterSpacing: "-0.03em", margin: 0, lineHeight: 1.15 }}>
              Welcome back,{" "}
              <span style={{ borderBottom: "4px solid #c6ff3d", paddingBottom: "2px" }}>
                {user?.name || "Client"}
              </span>
              ! 👋
            </h1>

            <p style={{ fontSize: "14px", color: "#5c5c66", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
              Find and book world-class artists, bands, and premium concert venues. Track your event timelines and manage confirmed gigs effortlessly.
            </p>
          </div>

          {/* Right Action CTAs */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                fetchClientDashboard();
              }}
              disabled={refreshing}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "13px 18px",
                borderRadius: "16px",
                backgroundColor: "#f8fafc",
                color: "#0a0a0f",
                fontWeight: 800,
                fontSize: "13.5px",
                border: "1px solid #e2e8f0",
                cursor: "pointer",
              }}
            >
              <RefreshCw style={{ width: "15px", height: "15px", animation: refreshing ? "spin 1s linear infinite" : "none" }} />
              <span>{refreshing ? "Refreshing..." : "Sync Live"}</span>
            </button>

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
              <Music style={{ width: "16px", height: "16px" }} />
              <span>Browse Artists</span>
            </Link>

            <Link
              to="/band/venues"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 24px",
                borderRadius: "16px",
                backgroundColor: "#ffffff",
                color: "#0a0a0f",
                fontWeight: 800,
                fontSize: "14px",
                textDecoration: "none",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
                transition: "all 0.2s ease",
              }}
            >
              <Building2 style={{ width: "16px", height: "16px", color: "#64748b" }} />
              <span>Explore Venues</span>
            </Link>
          </div>
        </div>

        {/* ── 2. 4-GRID REAL KPI METRICS (ZERO DUMMY DATA) ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
          {/* Card 1 */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "135px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
                Active Bookings
              </span>
              <div style={{ width: "38px", height: "38px", borderRadius: "12px", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 style={{ width: "20px", height: "20px" }} />
              </div>
            </div>
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", lineHeight: 1 }}>
                {stats.active_bookings}
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: stats.active_bookings > 0 ? "#10b981" : "#94a3b8", marginTop: "6px", display: "block" }}>
                {stats.active_bookings > 0 ? "Confirmed gigs scheduled" : "No active bookings"}
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "135px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
                Pending Requests
              </span>
              <div style={{ width: "38px", height: "38px", borderRadius: "12px", backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock style={{ width: "20px", height: "20px" }} />
              </div>
            </div>
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", lineHeight: 1 }}>
                {stats.pending_requests}
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: stats.pending_requests > 0 ? "#d97706" : "#94a3b8", marginTop: "6px", display: "block" }}>
                {stats.pending_requests > 0 ? "Awaiting artist reply" : "0 pending inquiries"}
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "135px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
                Past Completed
              </span>
              <div style={{ width: "38px", height: "38px", borderRadius: "12px", backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp style={{ width: "20px", height: "20px" }} />
              </div>
            </div>
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", lineHeight: 1 }}>
                {stats.completed_events}
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: stats.completed_events > 0 ? "#2563eb" : "#94a3b8", marginTop: "6px", display: "block" }}>
                {stats.completed_events > 0 ? "Live events hosted" : "0 past events"}
              </span>
            </div>
          </div>

          {/* Card 4 */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "135px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
                Total Budget Spent
              </span>
              <div style={{ width: "38px", height: "38px", borderRadius: "12px", backgroundColor: "#c6ff3d", color: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "16px" }}>
                ₹
              </div>
            </div>
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", lineHeight: 1 }}>
                ₹{stats.total_spent.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: stats.total_spent > 0 ? "#10b981" : "#94a3b8", marginTop: "6px", display: "block" }}>
                {stats.total_spent > 0 ? "Escrow protected payments" : "0 spent so far"}
              </span>
            </div>
          </div>
        </div>

        {/* ── 3. TWO-COLUMN INTERACTIVE CONTENT ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "32px", alignItems: "start" }}>

          {/* ── LEFT COLUMN: UPCOMING EVENTS & TIMELINE ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

            {/* UPCOMING EVENTS CONTAINER */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Calendar style={{ width: "20px", height: "20px", color: "#0a0a0f" }} />
                  <h2 style={{ fontSize: "20px", fontWeight: 900, color: "#0a0a0f", margin: 0, letterSpacing: "-0.02em" }}>
                    Your Event Timeline ({upcomingEvents.length})
                  </h2>
                </div>
                <Link
                  to="/band/client/bookings"
                  style={{ fontSize: "13px", fontWeight: 800, color: "#0a0a0f", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span>View All Bookings</span>
                  <ArrowRight style={{ width: "14px", height: "14px" }} />
                </Link>
              </div>

              {upcomingEvents.length === 0 ? (
                <div
                  style={{
                    padding: "40px 24px",
                    borderRadius: "24px",
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(10, 10, 15, 0.08)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    gap: "12px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#94a3b8",
                    }}
                  >
                    <Calendar style={{ width: "24px", height: "24px" }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#0a0a0f", margin: 0 }}>
                      No Active Event Bookings
                    </h4>
                    <p style={{ fontSize: "12.5px", color: "#64748b", margin: "4px 0 0 0", maxWidth: "400px", lineHeight: 1.5 }}>
                      You don't have any upcoming gig bookings yet. Explore top performers and request a custom quote.
                    </p>
                  </div>
                  <Link
                    to="/band/artists"
                    style={{
                      marginTop: "6px",
                      padding: "10px 20px",
                      borderRadius: "12px",
                      backgroundColor: "#c6ff3d",
                      color: "#0a0a0f",
                      fontWeight: 800,
                      fontSize: "13px",
                      textDecoration: "none",
                      boxShadow: "0 2px 10px rgba(198, 255, 61, 0.4)",
                    }}
                  >
                    Browse Live Artists
                  </Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {upcomingEvents.map((evt) => (
                    <div
                      key={evt.id}
                      style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "24px",
                        border: "1px solid rgba(10, 10, 15, 0.08)",
                        padding: "24px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "20px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                        <div
                          style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "16px",
                            backgroundColor: "#0a0a0f",
                            color: "#c6ff3d",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 900,
                            flexShrink: 0,
                          }}
                        >
                          <Calendar style={{ width: "24px", height: "24px" }} />
                        </div>

                        <div>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 800,
                              textTransform: "uppercase",
                              padding: "3px 8px",
                              borderRadius: "9999px",
                              backgroundColor: "#ecfdf5",
                              color: "#047857",
                              border: "1px solid #a7f3d0",
                            }}
                          >
                            {evt.status || "CONFIRMED"}
                          </span>
                          <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0a0a0f", margin: "4px 0 2px 0" }}>
                            {evt.event_name || evt.title || "Live Performance"}
                          </h3>
                          <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0, fontWeight: 500 }}>
                            {evt.artist_name || evt.performer || "Artist"} • {evt.location || "Venue TBD"}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <span style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f" }}>
                          {evt.amount || (evt.total_amount ? `₹${Number(evt.total_amount).toLocaleString("en-IN")}` : "₹0")}
                        </span>
                        <Link
                          to="/band/client/bookings"
                          style={{
                            padding: "10px 18px",
                            borderRadius: "12px",
                            backgroundColor: "#0a0a0f",
                            color: "#ffffff",
                            fontSize: "12.5px",
                            fontWeight: 800,
                            textDecoration: "none",
                          }}
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ── RIGHT COLUMN: QUICK DISCOVERY & SHORTCUTS ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* QUICK ACTIONS CARD */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "24px",
                border: "1px solid rgba(10, 10, 15, 0.08)",
                padding: "24px",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#0a0a0f", margin: 0 }}>
                Planning an Event?
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Link
                  to="/band/artists"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    borderRadius: "16px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#0a0a0f",
                    textDecoration: "none",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Music style={{ width: "16px", height: "16px", color: "#10b981" }} />
                    <span>Find &amp; Book Artists</span>
                  </span>
                  <ChevronRight style={{ width: "16px", height: "16px", color: "#94a3b8" }} />
                </Link>

                <Link
                  to="/band/venues"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    borderRadius: "16px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#0a0a0f",
                    textDecoration: "none",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Building2 style={{ width: "16px", height: "16px", color: "#2563eb" }} />
                    <span>Rent Concert Venues</span>
                  </span>
                  <ChevronRight style={{ width: "16px", height: "16px", color: "#94a3b8" }} />
                </Link>

                <Link
                  to="/band/client/bookings"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    borderRadius: "16px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#0a0a0f",
                    textDecoration: "none",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Calendar style={{ width: "16px", height: "16px", color: "#d97706" }} />
                    <span>Track Active Bookings</span>
                  </span>
                  <ChevronRight style={{ width: "16px", height: "16px", color: "#94a3b8" }} />
                </Link>
              </div>
            </div>

            {/* TRUST & ESCROW BADGE */}
            <div
              style={{
                backgroundColor: "#0a0a0f",
                color: "#ffffff",
                borderRadius: "24px",
                padding: "24px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#c6ff3d", color: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck style={{ width: "20px", height: "20px" }} />
                </div>
                <div>
                  <h4 style={{ fontSize: "14.5px", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                    100% Escrow Protection
                  </h4>
                  <span style={{ fontSize: "11px", color: "#c6ff3d", fontWeight: 700 }}>
                    BandConnect Verified Guarantee
                  </span>
                </div>
              </div>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                Your payments are held securely in escrow and only released to artists and venues after successful event completion.
              </p>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
