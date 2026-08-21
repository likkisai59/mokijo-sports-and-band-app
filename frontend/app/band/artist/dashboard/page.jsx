"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  TrendingUp,
  Star,
  Eye,
  Music,
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  DollarSign,
  User,
  Image as ImageIcon,
  MessageSquare,
  RefreshCw,
  SlidersHorizontal,
  MapPin,
  ChevronRight,
  ExternalLink,
  Zap,
  ArrowUpRight,
  Award,
  Radio,
  FileText,
  Headphones,
  Inbox,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import bandApi from "@/lib/bandApi";
import { formatCurrency } from "@/utils/format-currency";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getBandUser } from "@/lib/bandAuth";
import toast from "react-hot-toast";

export default function ArtistDashboardPage() {
  const { user } = useAuth();
  const [bandUser, setBandUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [profile, setProfile] = React.useState(null);

  // Real Dynamic Stats (Initialized to Zero — No Dummy Numbers)
  const [stats, setStats] = React.useState({
    upcoming_events_count: 0,
    monthly_revenue: 0,
    average_rating: 0,
    total_reviews: 0,
    profile_views: 0,
    profile_completion: 0,
    verification_status: "approved", // approved | pending | rejected
    verification_notes: null,
  });

  const [bookingRequests, setBookingRequests] = React.useState([]);
  const [upcomingEvents, setUpcomingEvents] = React.useState([]);
  const [wallet, setWallet] = React.useState({
    available_balance: 0,
    escrow_balance: 0,
  });

  React.useEffect(() => {
    const u = getBandUser();
    if (u) setBandUser(u);
  }, []);

  const fetchDashboard = React.useCallback(async () => {
    try {
      const [profileRes, bookingsRes, dashboardRes] = await Promise.allSettled([
        bandApi.get("/artists/me"),
        bandApi.get("/bookings/my"),
        bandApi.get("/artists/me/dashboard"),
      ]);

      let loadedProfile = null;
      if (profileRes.status === "fulfilled" && profileRes.value?.data) {
        loadedProfile = profileRes.value.data;
        setProfile(loadedProfile);
      }

      let pendingList = [];
      let acceptedList = [];
      let totalRevenue = 0;

      if (bookingsRes.status === "fulfilled" && bookingsRes.value?.data) {
        const data = bookingsRes.value.data;
        const items = Array.isArray(data) ? data : data.items || [];
        
        pendingList = items.filter(
          (b) => b.status === "pending" || b.status === "inquiry" || b.status === "counter_offered"
        );
        acceptedList = items.filter(
          (b) => b.status === "accepted" || b.status === "confirmed" || b.status === "locked"
        );
        
        setBookingRequests(pendingList);
        setUpcomingEvents(acceptedList);

        // Calculate revenue from completed or confirmed gigs
        totalRevenue = items
          .filter((b) => b.status === "accepted" || b.status === "confirmed" || b.status === "completed")
          .reduce((sum, b) => sum + (Number(b.total_amount || b.agreed_price || b.offer_amount || 0) || 0), 0);
      }

      // Calculate profile completion score dynamically based on profile fields
      let completionScore = 0;
      if (loadedProfile) {
        if (loadedProfile.display_name || loadedProfile.name) completionScore += 20;
        if (loadedProfile.bio) completionScore += 20;
        if (loadedProfile.genre || loadedProfile.band_type) completionScore += 20;
        if (loadedProfile.base_price || loadedProfile.base_rate) completionScore += 20;
        if (loadedProfile.profile_image_url || loadedProfile.cover_image_url) completionScore += 20;
      } else {
        completionScore = 60; // Base baseline on registration
      }

      if (dashboardRes.status === "fulfilled" && dashboardRes.value?.data) {
        const d = dashboardRes.value.data;
        setStats({
          upcoming_events_count: d.upcoming_events_count ?? acceptedList.length,
          monthly_revenue: d.monthly_revenue ?? totalRevenue,
          average_rating: d.average_rating ?? (loadedProfile?.rating || 0),
          total_reviews: d.total_reviews ?? (loadedProfile?.reviews_count || 0),
          profile_views: d.profile_views ?? 0,
          profile_completion: d.profile_completion ?? completionScore,
          verification_status: loadedProfile?.verification_status || "approved",
          verification_notes: loadedProfile?.verification_notes || null,
        });

        if (d.wallet) {
          setWallet({
            available_balance: d.wallet.available_balance ?? 0,
            escrow_balance: d.wallet.escrow_balance ?? 0,
          });
        }
      } else {
        setStats({
          upcoming_events_count: acceptedList.length,
          monthly_revenue: totalRevenue,
          average_rating: loadedProfile?.rating || 0,
          total_reviews: loadedProfile?.reviews_count || 0,
          profile_views: loadedProfile?.views_count || 0,
          profile_completion: completionScore,
          verification_status: loadedProfile?.verification_status || "approved",
          verification_notes: loadedProfile?.verification_notes || null,
        });
      }
    } catch {
      // Graceful fallback to real zero state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleAction = async (bookingId, action) => {
    try {
      if (action === "accepted") {
        await bandApi.post(`/bookings/${bookingId}/accept`);
        toast.success("Booking accepted! Direct chat initiated with client.");
      } else {
        await bandApi.post(`/bookings/${bookingId}/decline`);
        toast.success("Booking request declined.");
      }
      fetchDashboard();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Booking action failed.");
      fetchDashboard();
    }
  };

  const displayName = profile?.display_name || profile?.name || bandUser?.name || user?.name || "Performer";
  const username = profile?.username || displayName.toLowerCase().replace(/\s+/g, "_");

  return (
    <DashboardLayout role="artist">
      <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
        
        {/* ── 1. VERIFICATION STATUS ALERT ── */}
        {stats.verification_status === "approved" ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
              padding: "16px 20px",
              borderRadius: "18px",
              backgroundColor: "#ecfdf5",
              border: "1px solid #a7f3d0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ShieldCheck style={{ width: "24px", height: "24px" }} />
              </div>
              <div>
                <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#065f46", margin: 0 }}>
                  Verified &amp; Active on Marketplace
                </h4>
                <p style={{ fontSize: "12.5px", color: "#047857", margin: "2px 0 0 0", fontWeight: 500 }}>
                  Your profile has passed admin verification and is eligible for direct client bookings and instant discovery.
                </p>
              </div>
            </div>

            <Link
              href={`/band/artists/${profile?.id || "me"}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "10px",
                backgroundColor: "#ffffff",
                color: "#047857",
                border: "1px solid #a7f3d0",
                fontSize: "12px",
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <span>View Public Listing</span>
              <ExternalLink style={{ width: "13px", height: "13px" }} />
            </Link>
          </div>
        ) : stats.verification_status === "pending" ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
              padding: "16px 20px",
              borderRadius: "18px",
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  backgroundColor: "#f59e0b",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertCircle style={{ width: "24px", height: "24px" }} />
              </div>
              <div>
                <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#92400e", margin: 0 }}>
                  Verification Under Review
                </h4>
                <p style={{ fontSize: "12.5px", color: "#b45309", margin: "2px 0 0 0", fontWeight: 500 }}>
                  {stats.verification_notes || "Our curation team is reviewing your profile. Once approved, your profile will be public."}
                </p>
              </div>
            </div>

            <Link
              href="/band/artist/profile"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "10px",
                backgroundColor: "#0a0a0f",
                color: "#c6ff3d",
                fontSize: "12px",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              <span>Complete Profile</span>
              <ArrowRight style={{ width: "13px", height: "13px" }} />
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
              padding: "16px 20px",
              borderRadius: "18px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecdd3",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  backgroundColor: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertCircle style={{ width: "22px", height: "22px" }} />
              </div>
              <div>
                <span style={{ fontSize: "14.5px", fontWeight: 800, color: "#991b1b" }}>
                  Profile Updates Requested
                </span>
                <p style={{ fontSize: "12px", color: "#b91c1c", margin: "3px 0 0 0", fontWeight: 500 }}>
                  {stats.verification_notes || "Please add performance details and set your pricing rates."}
                </p>
              </div>
            </div>

            <Link
              href="/band/artist/profile"
              style={{
                padding: "8px 18px",
                borderRadius: "12px",
                backgroundColor: "#dc2626",
                color: "#ffffff",
                fontSize: "12.5px",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Update Profile
            </Link>
          </div>
        )}

        {/* ── 2. HERO GREETING BANNER ── */}
        <div
          style={{
            position: "relative",
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            border: "1px solid #e2e8f0",
            padding: "32px 36px",
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
              backgroundColor: "rgba(198, 255, 61, 0.15)",
              borderRadius: "9999px",
              filter: "blur(60px)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1, maxWidth: "650px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 12px",
                borderRadius: "9999px",
                backgroundColor: "#0a0a0f",
                color: "#c6ff3d",
                fontSize: "11px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                width: "fit-content",
              }}
            >
              <Music style={{ width: "13px", height: "13px" }} />
              <span>Artist Command Center</span>
            </div>

            <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#0a0a0f", margin: 0, letterSpacing: "-0.02em" }}>
              Welcome back, {displayName}! 🎸
            </h1>

            <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
              Manage stage schedules, respond to client gig inquiries, coordinate technical sound riders, and track escrow payouts.
            </p>
          </div>

          {/* Action CTAs */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                fetchDashboard();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 18px",
                borderRadius: "14px",
                backgroundColor: "#f8fafc",
                color: "#0a0a0f",
                fontWeight: 800,
                fontSize: "13px",
                border: "1px solid #e2e8f0",
                cursor: "pointer",
              }}
            >
              <RefreshCw style={{ width: "15px", height: "15px", animation: refreshing ? "spin 1s linear infinite" : "none" }} />
              <span>{refreshing ? "Refreshing..." : "Sync Dashboard"}</span>
            </button>

            <Link
              href="/band/artist/messages"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                borderRadius: "14px",
                backgroundColor: "#0a0a0f",
                color: "#c6ff3d",
                fontWeight: 800,
                fontSize: "13px",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <MessageSquare style={{ width: "15px", height: "15px" }} />
              <span>Client Messages</span>
            </Link>
          </div>
        </div>

        {/* ── 3. 4-GRID REAL KPI METRICS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
          {/* KPI 1: Scheduled Shows */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>
                Scheduled Shows
              </span>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Calendar style={{ width: "20px", height: "20px" }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: "30px", fontWeight: 900, color: "#0a0a0f", lineHeight: 1 }}>
                {stats.upcoming_events_count} {stats.upcoming_events_count === 1 ? "Gig" : "Gigs"}
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: stats.upcoming_events_count > 0 ? "#059669" : "#94a3b8", marginTop: "8px", display: "block" }}>
                {stats.upcoming_events_count > 0 ? `${stats.upcoming_events_count} upcoming performance` : "No upcoming gigs scheduled"}
              </span>
            </div>
          </div>

          {/* KPI 2: Gross Monthly Volume */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>
                Gross Volume
              </span>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: "#0a0a0f", color: "#c6ff3d", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "16px" }}>
                ₹
              </div>
            </div>
            <div>
              <div style={{ fontSize: "30px", fontWeight: 900, color: "#0a0a0f", lineHeight: 1 }}>
                ₹{stats.monthly_revenue.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: stats.monthly_revenue > 0 ? "#059669" : "#94a3b8", marginTop: "8px", display: "block" }}>
                {stats.monthly_revenue > 0 ? "Processed through escrow" : "0 bookings processed yet"}
              </span>
            </div>
          </div>

          {/* KPI 3: Artist Stage Rating */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>
                Artist Stage Rating
              </span>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: "#fffbeb", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Star style={{ width: "20px", height: "20px", fill: stats.average_rating > 0 ? "#f59e0b" : "none", color: "#f59e0b" }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: "30px", fontWeight: 900, color: "#0a0a0f", lineHeight: 1, display: "flex", alignItems: "center", gap: "8px" }}>
                <span>{stats.average_rating > 0 ? stats.average_rating.toFixed(1) : "New"}</span>
                {stats.average_rating > 0 && <span style={{ fontSize: "16px", color: "#f59e0b" }}>★★★★★</span>}
              </div>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", marginTop: "8px", display: "block" }}>
                {stats.total_reviews > 0 ? `Based on ${stats.total_reviews} verified reviews` : "No client reviews yet"}
              </span>
            </div>
          </div>

          {/* KPI 4: Discovery Impressions */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>
                Discovery Impressions
              </span>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: "#faf5ff", color: "#7e22ce", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Eye style={{ width: "20px", height: "20px" }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: "30px", fontWeight: 900, color: "#0a0a0f", lineHeight: 1 }}>
                {stats.profile_views}
              </div>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#7e22ce", backgroundColor: "#f3e8ff", padding: "3px 8px", borderRadius: "6px", marginTop: "8px", display: "inline-block" }}>
                {stats.profile_views > 0 ? "Marketplace impressions" : "Live on discovery index"}
              </span>
            </div>
          </div>
        </div>

        {/* ── 4. TWO-COLUMN RESPONSIVE LAYOUT ── */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: "28px", alignItems: "start" }}>
          
          {/* ── LEFT COLUMN (INCOMING OFFERS & CONFIRMED SCHEDULE) ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            
            {/* INCOMING OFFERS SECTION */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid #e2e8f0" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                  <Clock style={{ width: "20px", height: "20px", color: "#d97706" }} />
                  <span>Incoming Booking Offers ({bookingRequests.length})</span>
                </h2>
                <Link
                  href="/band/artist/bookings"
                  style={{ fontSize: "13px", fontWeight: 800, color: "#0a0a0f", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span>View All Offers</span>
                  <ArrowRight style={{ width: "14px", height: "14px" }} />
                </Link>
              </div>

              {bookingRequests.length === 0 ? (
                <div
                  style={{
                    padding: "40px 24px",
                    borderRadius: "22px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    gap: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
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
                    <Inbox style={{ width: "24px", height: "24px" }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#0a0a0f", margin: 0 }}>
                      No Pending Booking Inquiries
                    </h4>
                    <p style={{ fontSize: "12.5px", color: "#64748b", margin: "4px 0 0 0", maxWidth: "420px", lineHeight: 1.5 }}>
                      When event hosts, wedding planners, and corporate organizers request your band, new offers will appear here in real-time.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {bookingRequests.map((req) => (
                    <div
                      key={req.id}
                      style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "22px",
                        border: "1px solid #e2e8f0",
                        padding: "24px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      {/* Top Row: Event & Price */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", paddingBottom: "14px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", backgroundColor: "#fef3c7", color: "#92400e", padding: "3px 10px", borderRadius: "8px" }}>
                              Pending Your Decision
                            </span>
                            <span style={{ fontSize: "12.5px", color: "#0a0a0f", fontWeight: 700 }}>
                              Host: {req.client_name || req.client_email || "Client"}
                            </span>
                            {req.client_email && (
                              <span style={{ fontSize: "11.5px", color: "#64748b" }}>({req.client_email})</span>
                            )}
                            {req.client_mobile && (
                              <span style={{ fontSize: "11.5px", color: "#059669", fontWeight: 600 }}>📞 {req.client_mobile}</span>
                            )}
                          </div>
                          <h3 style={{ fontSize: "19px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                            {req.event_name || req.event_type || "Live Performance Request"}
                          </h3>
                        </div>

                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#94a3b8", display: "block" }}>
                            Proposed Budget
                          </span>
                          <span style={{ fontSize: "24px", fontWeight: 900, color: "#0a0a0f", display: "block" }}>
                            ₹{Number(req.proposed_price || req.total_amount || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* Middle Row: Date, Time & Location */}
                      <div style={{ display: "flex", alignItems: "center", gap: "20px", fontSize: "13px", color: "#475569", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Calendar style={{ width: "16px", height: "16px", color: "#64748b" }} />
                          <span style={{ fontWeight: 800, color: "#0a0a0f" }}>
                            {req.event_date ? new Date(req.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Date Pending"}
                          </span>
                          {req.start_time && <span>({req.start_time} - {req.end_time || ""})</span>}
                        </div>
                        {req.location && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <MapPin style={{ width: "16px", height: "16px", color: "#64748b" }} />
                            <span>{req.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Special Notes if any */}
                      {req.notes && (
                        <div style={{ padding: "10px 14px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "12.5px", color: "#475569" }}>
                          <strong style={{ color: "#0a0a0f" }}>Client Notes:</strong> {req.notes}
                        </div>
                      )}

                      {/* Bottom Row: Actions */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", paddingTop: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#059669" }}>
                          ✓ Escrow Protected · 100% Guaranteed Payout
                        </span>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <button
                            type="button"
                            onClick={() => handleAction(req.id, "accepted")}
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
                            onClick={() => handleAction(req.id, "rejected")}
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

                          <Link
                            href={req.conversation_id ? `/band/artist/messages?conversation_id=${req.conversation_id}` : "/band/artist/messages"}
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
                            Chat
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CONFIRMED SCHEDULE SECTION */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid #e2e8f0" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                  <Calendar style={{ width: "20px", height: "20px", color: "#059669" }} />
                  <span>Upcoming Stage Schedule ({upcomingEvents.length})</span>
                </h2>
                <Link
                  href="/band/artist/bookings"
                  style={{ fontSize: "13px", fontWeight: 800, color: "#0a0a0f", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span>Full Schedule</span>
                  <ArrowRight style={{ width: "14px", height: "14px" }} />
                </Link>
              </div>

              {upcomingEvents.length === 0 ? (
                <div
                  style={{
                    padding: "40px 24px",
                    borderRadius: "22px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    gap: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      backgroundColor: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#059669",
                    }}
                  >
                    <Calendar style={{ width: "24px", height: "24px" }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#0a0a0f", margin: 0 }}>
                      No Confirmed Stage Shows Yet
                    </h4>
                    <p style={{ fontSize: "12.5px", color: "#64748b", margin: "4px 0 0 0", maxWidth: "420px", lineHeight: 1.5 }}>
                      When you accept incoming requests, confirmed performances and stage call times will automatically populate your calendar.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "20px",
                        border: "1px solid #e2e8f0",
                        padding: "20px 24px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "16px",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "10.5px", fontWeight: 800, backgroundColor: "#ecfdf5", color: "#047857", padding: "2px 8px", borderRadius: "9999px", border: "1px solid #a7f3d0" }}>
                            CONFIRMED ON STAGE
                          </span>
                          {event.venue_code && (
                            <span style={{ fontSize: "10.5px", fontWeight: 900, fontFamily: "monospace", backgroundColor: "#0a0a0f", color: "#c6ff3d", padding: "2px 8px", borderRadius: "6px" }}>
                              {event.venue_code}
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0a0a0f", margin: 0 }}>
                          {event.event_name || event.title || "Live Performance"}
                        </h3>
                        <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0, fontWeight: 500 }}>
                          Host: {event.client_name || "Event Host"} · {event.location || "Venue TBD"}
                        </p>
                        <p style={{ fontSize: "12.5px", color: "#0a0a0f", margin: 0, fontWeight: 800 }}>
                          {event.date || event.event_date} {event.time ? `· ${event.time}` : ""}
                        </p>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "18px", flexShrink: 0 }}>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#94a3b8", display: "block" }}>Fee</span>
                          <span style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f" }}>
                            {event.amount || (event.total_amount ? `₹${Number(event.total_amount).toLocaleString("en-IN")}` : "₹0")}
                          </span>
                        </div>

                        <Link
                          href="/band/artist/bookings"
                          style={{
                            padding: "10px 20px",
                            borderRadius: "12px",
                            backgroundColor: "#0a0a0f",
                            color: "#ffffff",
                            fontSize: "13px",
                            fontWeight: 800,
                            textDecoration: "none",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          }}
                        >
                          Gig Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ── RIGHT COLUMN (PROFILE COMPLETION, WALLET & TOOLS) ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* 1. PROFILE COMPLETENESS */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "22px",
                border: "1px solid #e2e8f0",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
                  Profile Completeness
                </span>
                <span style={{ fontSize: "12px", fontWeight: 900, backgroundColor: "#c6ff3d", color: "#0a0a0f", padding: "3px 10px", borderRadius: "9999px" }}>
                  {stats.profile_completion}% Ready
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ width: "100%", height: "10px", backgroundColor: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
                  <div style={{ width: `${stats.profile_completion}%`, height: "100%", backgroundColor: "#0a0a0f", borderRadius: "9999px", transition: "width 0.5s ease" }} />
                </div>
                <p style={{ fontSize: "11.5px", color: "#64748b", margin: 0, lineHeight: 1.5, textAlign: "center" }}>
                  Profiles with audio demos and gear details rank <strong>3.5x higher</strong> in search results.
                </p>
              </div>

              {/* Checklist Links */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                <Link
                  href="/band/artist/profile?tab=media"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: "14px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "#0a0a0f",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <ImageIcon style={{ width: "16px", height: "16px", color: "#7e22ce" }} />
                    <span>Upload Audio/Video Demos</span>
                  </span>
                  <ChevronRight style={{ width: "16px", height: "16px", color: "#94a3b8" }} />
                </Link>

                <Link
                  href="/band/artist/profile?tab=pricing"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: "14px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "#0a0a0f",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <DollarSign style={{ width: "16px", height: "16px", color: "#059669" }} />
                    <span>Set Base Rate &amp; Travel Fee</span>
                  </span>
                  <ChevronRight style={{ width: "16px", height: "16px", color: "#94a3b8" }} />
                </Link>

                <Link
                  href="/band/artist/reviews"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: "14px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "#0a0a0f",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <MessageSquare style={{ width: "16px", height: "16px", color: "#d97706" }} />
                    <span>Client Reviews &amp; Ratings</span>
                  </span>
                  <ChevronRight style={{ width: "16px", height: "16px", color: "#94a3b8" }} />
                </Link>
              </div>
            </div>

            {/* 2. REAL WALLET LEDGER */}
            <div
              style={{
                backgroundColor: "#0a0a0f",
                color: "#ffffff",
                borderRadius: "22px",
                padding: "24px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.12)",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#c6ff3d" }}>
                  Wallet Ledger
                </span>
                <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "9999px", backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                  Auto-Payout Enabled
                </span>
              </div>

              <div>
                <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>Available for Instant Payout</span>
                <div style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
                  ₹{wallet.available_balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <span style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "4px", display: "block" }}>
                  + ₹{wallet.escrow_balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })} In Escrow Clearance
                </span>
              </div>

              <div style={{ paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <Link
                  href="/band/artist/earnings"
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "12px",
                    borderRadius: "14px",
                    backgroundColor: "#c6ff3d",
                    color: "#0a0a0f",
                    fontWeight: 900,
                    fontSize: "13px",
                    textAlign: "center",
                    textDecoration: "none",
                    boxShadow: "0 2px 10px rgba(198, 255, 61, 0.3)",
                    transition: "all 0.2s ease",
                  }}
                >
                  View Transaction Ledger
                </Link>
              </div>
            </div>

            {/* 3. ARTIST SUCCESS CONCIERGE */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "22px",
                border: "1px solid #e2e8f0",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "12px", backgroundColor: "#0a0a0f", color: "#c6ff3d", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles style={{ width: "18px", height: "18px" }} />
                </div>
                <div>
                  <h4 style={{ fontSize: "14.5px", fontWeight: 800, color: "#0a0a0f", margin: 0 }}>
                    Artist Success Concierge
                  </h4>
                  <p style={{ fontSize: "11.5px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>
                    Dedicated support for gear, riders &amp; contracts
                  </p>
                </div>
              </div>

              <Link
                href="/band/artist/messages?concierge=true"
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px",
                  borderRadius: "12px",
                  backgroundColor: "#f1f5f9",
                  color: "#0a0a0f",
                  fontWeight: 800,
                  fontSize: "12.5px",
                  textAlign: "center",
                  textDecoration: "none",
                  border: "1px solid #e2e8f0",
                  transition: "all 0.15s ease",
                }}
              >
                Talk to Artist Liaison
              </Link>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
