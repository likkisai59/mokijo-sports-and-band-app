import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import BandNavbar from "@/components/band/BandNavbar";
import BandFooter from "@/components/band/BandFooter";
import { getBandUser } from "@/lib/bandAuth";
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
} from "lucide-react";

export default function ClientDashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const authUser = getBandUser();
    setUser(authUser || { name: "Avinash", role: "client" });
  }, []);

  const [stats, setStats] = useState({
    active_bookings: 2,
    pending_requests: 1,
    completed_events: 5,
    total_spent: 185000,
  });

  const [upcomingEvents, setUpcomingEvents] = useState([
    {
      id: 101,
      title: "Wedding Reception Live Band",
      performer: "The Groove Collective",
      type: "6-Piece Live Band",
      dateMonth: "AUG",
      dateDay: "28",
      time: "19:00 - 23:00",
      location: "Skyline Grand Ballroom, Mumbai",
      status: "confirmed",
      amount: "₹75,000",
      statusLabel: "CONFIRMED & LOCKED",
      statusColor: "#10b981",
      statusBg: "rgba(16, 185, 129, 0.08)",
      statusBorder: "rgba(16, 185, 129, 0.25)",
    },
    {
      id: 102,
      title: "Corporate Annual Gala Night",
      performer: "Acoustic Sunset Duo",
      type: "Acoustic Duo",
      dateMonth: "SEP",
      dateDay: "12",
      time: "18:30 - 21:30",
      location: "Palms Resort Arena, Bangalore",
      status: "pending",
      amount: "₹45,000",
      statusLabel: "OFFER UNDER REVIEW",
      statusColor: "#d97706",
      statusBg: "rgba(245, 158, 11, 0.08)",
      statusBorder: "rgba(245, 158, 11, 0.25)",
    },
  ]);

  const [featuredArtists, setFeaturedArtists] = useState([
    {
      id: 1,
      name: "The Neon Echoes",
      genre: "Rock / Indie Fusion",
      rating: 4.9,
      reviews_count: 38,
      base_rate: "₹50,000",
      location: "Mumbai",
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80",
    },
    {
      id: 2,
      name: "Symphony Strings",
      genre: "Classical & Bollywood",
      rating: 5.0,
      reviews_count: 52,
      base_rate: "₹65,000",
      location: "Delhi NCR",
      image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=200&auto=format&fit=crop&q=80",
    },
    {
      id: 3,
      name: "DJ Rohit & Percussion",
      genre: "EDM / Punjabi Beats",
      rating: 4.8,
      reviews_count: 29,
      base_rate: "₹40,000",
      location: "Bangalore",
      image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&auto=format&fit=crop&q=80",
    },
  ]);

  return (
    <div style={{ backgroundColor: "#f7f7f8", minHeight: "100vh", color: "#0a0a0f", width: "100%" }}>
      {/* ── TOP FULL BRAND NAVIGATION ── */}
      <BandNavbar />

      {/* ── MAIN DASHBOARD CONTAINER ── */}
      <main style={{ maxWidth: "1320px", margin: "0 auto", padding: "40px 24px 80px", width: "100%", display: "flex", flexDirection: "column", gap: "32px" }}>
        
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
                {user?.name || "Avinash"}
              </span>
              ! 👋
            </h1>

            <p style={{ fontSize: "14px", color: "#5c5c66", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
              Find and book world-class artists, bands, and premium concert venues. Track your event timelines and manage confirmed gigs effortlessly.
            </p>
          </div>

          {/* Right Action CTAs */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
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

        {/* ── 2. 4-GRID KPI METRICS ── */}
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
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#10b981", marginTop: "6px", display: "block" }}>
                Confirmed gigs scheduled
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "135px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
                Pending Responses
              </span>
              <div style={{ width: "38px", height: "38px", borderRadius: "12px", backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock style={{ width: "20px", height: "20px" }} />
              </div>
            </div>
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#0a0a0f", lineHeight: 1 }}>
                {stats.pending_requests}
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#d97706", marginTop: "6px", display: "block" }}>
                Awaiting artist reply
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
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#2563eb", marginTop: "6px", display: "block" }}>
                Live events hosted
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
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginTop: "6px", display: "block" }}>
                Escrow protected volume
              </span>
            </div>
          </div>
        </div>

        {/* ── 3. TWO-COLUMN RESPONSIVE LAYOUT (8 COLS LEFT / 4 COLS RIGHT) ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px", alignItems: "start" }}>
          
          {/* ── LEFT COLUMN (UPCOMING SHOWS & CATEGORIES) ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px", gridColumn: "span 2" }}>
            
            {/* Upcoming Event Timelines Card */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "28px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "32px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)", display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: 900, color: "#0a0a0f", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                    <Calendar style={{ width: "20px", height: "20px", color: "#0a0a0f" }} />
                    <span>Upcoming Event Timelines</span>
                  </h2>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0", fontWeight: 500 }}>
                    Real-time status of your live music bookings and schedules
                  </p>
                </div>

                <Link to="/band/client/bookings" style={{ fontSize: "13px", fontWeight: 800, color: "#0a0a0f", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>View All</span>
                  <ArrowRight style={{ width: "14px", height: "14px" }} />
                </Link>
              </div>

              {/* Event Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {upcomingEvents.map((evt) => (
                  <div
                    key={evt.id}
                    style={{
                      backgroundColor: "#f8fafc",
                      borderRadius: "20px",
                      border: "1px solid #e2e8f0",
                      padding: "20px 24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "20px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {/* Left: Date Block + Meta */}
                    <div style={{ display: "flex", alignItems: "center", gap: "18px", minWidth: "260px" }}>
                      {/* Date Badge */}
                      <div
                        style={{
                          width: "56px",
                          height: "64px",
                          borderRadius: "16px",
                          backgroundColor: "#0a0a0f",
                          color: "#ffffff",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: "10px", fontWeight: 900, color: "#c6ff3d", letterSpacing: "0.05em" }}>
                          {evt.dateMonth}
                        </span>
                        <span style={{ fontSize: "20px", fontWeight: 900, lineHeight: 1, marginTop: "2px" }}>
                          {evt.dateDay}
                        </span>
                      </div>

                      {/* Event Details */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <h3 style={{ fontSize: "16px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                            {evt.title}
                          </h3>
                          <span
                            style={{
                              padding: "3px 10px",
                              borderRadius: "9999px",
                              fontSize: "10px",
                              fontWeight: 800,
                              color: evt.statusColor,
                              backgroundColor: evt.statusBg,
                              border: `1px solid ${evt.statusBorder}`,
                            }}
                          >
                            {evt.statusLabel}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", color: "#64748b", flexWrap: "wrap" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#0a0a0f", fontWeight: 700 }}>
                            <Music style={{ width: "14px", height: "14px", color: "#64748b" }} />
                            {evt.performer} ({evt.type})
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <Clock style={{ width: "14px", height: "14px" }} />
                            {evt.time}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <MapPin style={{ width: "14px", height: "14px" }} />
                            {evt.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Deal Value + Action Button */}
                    <div style={{ display: "flex", alignItems: "center", gap: "20px", flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", display: "block" }}>
                          Deal Value
                        </span>
                        <span style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f" }}>
                          {evt.amount}
                        </span>
                      </div>

                      <Link
                        to={`/band/client/bookings/${evt.id}`}
                        style={{
                          padding: "10px 20px",
                          borderRadius: "12px",
                          backgroundColor: "#0a0a0f",
                          color: "#ffffff",
                          fontWeight: 800,
                          fontSize: "13px",
                          textDecoration: "none",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        Manage Booking
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Explorer Dual Split Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              {/* Card 1 */}
              <div style={{ backgroundColor: "#ffffff", borderRadius: "28px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "28px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "16px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "16px", backgroundColor: "#0a0a0f", color: "#c6ff3d", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Music style={{ width: "24px", height: "24px" }} />
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                    Find Live Artists & Bands
                  </h3>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                    Explore top solo acts, acoustic trios, rock bands, DJs, and classical ensembles with authentic verified ratings.
                  </p>
                </div>

                <Link to="/band/artists" style={{ fontSize: "13px", fontWeight: 800, color: "#0a0a0f", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>Explore Marketplace</span>
                  <ArrowRight style={{ width: "16px", height: "16px" }} />
                </Link>
              </div>

              {/* Card 2 */}
              <div style={{ backgroundColor: "#ffffff", borderRadius: "28px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "28px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "16px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "16px", backgroundColor: "#0a0a0f", color: "#c6ff3d", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Building2 style={{ width: "24px", height: "24px" }} />
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                    Discover Concert Venues
                  </h3>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                    Search acoustic-ready amphitheatres, luxury resort halls, and club spaces with unique BCV venue numbers.
                  </p>
                </div>

                <Link to="/band/venues" style={{ fontSize: "13px", fontWeight: 800, color: "#0a0a0f", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>Browse Venues</span>
                  <ArrowRight style={{ width: "16px", height: "16px" }} />
                </Link>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN (TOP TRENDING ACTS & CONCIERGE) ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Top Trending Acts Card */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "28px", border: "1px solid rgba(10, 10, 15, 0.08)", padding: "28px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)", display: "flex", flexDirection: "column", gap: "20px" }}>
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "14px", borderBottom: "1px solid #f1f5f9" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 900, color: "#0a0a0f", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Compass style={{ width: "18px", height: "18px" }} />
                  <span>Top Trending Acts</span>
                </h2>
                <Link to="/band/artists" style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", textDecoration: "none" }}>
                  See all
                </Link>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {featuredArtists.map((artist) => (
                  <div
                    key={artist.id}
                    style={{
                      backgroundColor: "#f8fafc",
                      borderRadius: "18px",
                      border: "1px solid #e2e8f0",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <img
                          src={artist.image}
                          alt={artist.name}
                          style={{ width: "44px", height: "44px", borderRadius: "12px", objectFit: "cover", border: "1px solid #cbd5e1" }}
                        />
                        <div>
                          <span style={{ fontSize: "14px", fontWeight: 800, color: "#0a0a0f", display: "block" }}>
                            {artist.name}
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500, display: "block", marginTop: "2px" }}>
                            {artist.genre}
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "13px", fontWeight: 900, color: "#0a0a0f", display: "block" }}>
                          {artist.base_rate}
                        </span>
                        <span style={{ fontSize: "9px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>
                          Starting Fee
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "10px", borderTop: "1px solid #edf2f7", fontSize: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#0a0a0f", fontWeight: 800, fontSize: "11px" }}>
                        <Star style={{ width: "13px", height: "13px", fill: "#f59e0b", color: "#f59e0b" }} />
                        <span>{artist.rating}</span>
                        <span style={{ color: "#94a3b8", fontWeight: 500 }}>({artist.reviews_count})</span>
                        <span style={{ color: "#cbd5e1" }}>•</span>
                        <span style={{ color: "#64748b", fontWeight: 500 }}>{artist.location}</span>
                      </div>

                      <Link
                        to={`/band/artists/${artist.id}`}
                        style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f", textDecoration: "none" }}
                      >
                        Book Now →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* VIP Music Concierge Box */}
            <div
              style={{
                position: "relative",
                backgroundColor: "#0a0a0f",
                color: "#ffffff",
                borderRadius: "28px",
                padding: "28px",
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-20px",
                  right: "-20px",
                  width: "150px",
                  height: "150px",
                  backgroundColor: "rgba(198, 255, 61, 0.2)",
                  borderRadius: "9999px",
                  filter: "blur(40px)",
                  pointerEvents: "none",
                }}
              />

              <div style={{ width: "42px", height: "42px", borderRadius: "14px", backgroundColor: "rgba(255, 255, 255, 0.1)", color: "#c6ff3d", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles style={{ width: "22px", height: "22px" }} />
              </div>

              <div>
                <h3 style={{ fontSize: "17px", fontWeight: 900, color: "#ffffff", margin: "0 0 6px 0" }}>
                  Need a Customized Lineup?
                </h3>
                <p style={{ fontSize: "12px", color: "#cbd5e1", margin: 0, lineHeight: 1.5 }}>
                  Our live music curation team can match verified performers with your specific event theme, acoustics, and budget.
                </p>
              </div>

              <button
                type="button"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "14px",
                  backgroundColor: "#c6ff3d",
                  color: "#0a0a0f",
                  fontWeight: 900,
                  fontSize: "13px",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(198, 255, 61, 0.3)",
                  transition: "all 0.2s ease",
                }}
              >
                Message Concierge Support
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* ── FOOTER DIRECTORY ── */}
      <BandFooter />
    </div>
  );
}
