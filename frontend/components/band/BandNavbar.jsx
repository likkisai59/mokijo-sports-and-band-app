import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Music,
  Mic2,
  Building2,
  LogIn,
  UserPlus,
  Bell,
  User,
  LogOut,
  Calendar,
  Settings,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { getBandUser, isBandAuthenticated, bandLogout } from "@/lib/bandAuth";

export default function BandNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const authUser = getBandUser();
    setUser(authUser);
  }, [location.pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    bandLogout();
    setUser(null);
    setProfileOpen(false);
    navigate("/band/login");
  };

  const isActive = (path) => {
    if (path === "/band" && location.pathname === "/band") return true;
    if (path !== "/band" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const notifications = [
    {
      id: 1,
      title: "Booking Accepted!",
      desc: "The Groove Collective accepted your Wedding gig request.",
      time: "10m ago",
      unread: true,
    },
    {
      id: 2,
      title: "Date Reminder",
      desc: "Corporate Annual Gala is scheduled for Sep 12.",
      time: "2h ago",
      unread: false,
    },
  ];

  return (
    <header className="band-nav-header">
      <div className="band-nav-inner">
        {/* Brand Logo */}
        <Link to="/band" className="flex items-center gap-3" style={{ textDecoration: "none" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "14px",
              backgroundColor: "#0a0a0f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Music style={{ width: "20px", height: "20px", color: "#c6ff3d" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontWeight: 900, fontSize: "18px", letterSpacing: "-0.02em", color: "#0a0a0f" }}>
                Band<span style={{ color: "#5c5c66" }}>Connect</span>
              </span>
              <span
                style={{
                  padding: "2px 8px",
                  fontSize: "10px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  borderRadius: "9999px",
                  backgroundColor: "#c6ff3d",
                  color: "#0a0a0f",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                Live
              </span>
            </div>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "-2px 0 0 0", fontWeight: 500 }}>
              Mokijo Sports & Entertainment
            </p>
          </div>
        </Link>

        {/* ── CENTER NAVIGATION: ONLY SHOWN WHEN USER IS NOT LOGGED IN ── */}
        {!user && (
          <nav className="hidden md:flex band-nav-links">
            <Link
              to="/band"
              className={`band-nav-item ${isActive("/band") && location.pathname === "/band" ? "active" : ""}`}
            >
              Explore
            </Link>
            <Link
              to="/band/artists"
              className={`band-nav-item ${isActive("/band/artists") ? "active" : ""}`}
            >
              <Mic2 style={{ width: "14px", height: "14px" }} />
              Artists & Bands
            </Link>
            <Link
              to="/band/venues"
              className={`band-nav-item ${isActive("/band/venues") ? "active" : ""}`}
            >
              <Building2 style={{ width: "14px", height: "14px" }} />
              Venues
            </Link>
          </nav>
        )}

        {/* ── RIGHT CONTROLS ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {user ? (
            /* ── LOGGED IN STATE: NOTIFICATION BELL & PROFILE ICON ── */
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Notification Bell with Badge */}
              <div style={{ position: "relative" }} ref={notifRef}>
                <button
                  onClick={() => {
                    setNotificationOpen(!notificationOpen);
                    setProfileOpen(false);
                  }}
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "14px",
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(10,10,15,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                    position: "relative",
                    transition: "all 0.2s ease",
                  }}
                  aria-label="Notifications"
                >
                  <Bell style={{ width: "18px", height: "18px", color: "#0a0a0f" }} />
                  <span
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      width: "8px",
                      height: "8px",
                      borderRadius: "9999px",
                      backgroundColor: "#c6ff3d",
                      border: "2px solid #ffffff",
                    }}
                  />
                </button>

                {/* Notifications Dropdown Modal */}
                {notificationOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "52px",
                      width: "320px",
                      backgroundColor: "#ffffff",
                      borderRadius: "20px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                      padding: "16px",
                      zIndex: 100,
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#0a0a0f" }}>Notifications</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#10b981", backgroundColor: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: "9999px" }}>
                        1 New
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "12px",
                            backgroundColor: n.unread ? "#f8fafc" : "transparent",
                            border: n.unread ? "1px solid #e2e8f0" : "1px solid transparent",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: "12px", fontWeight: 800, color: "#0a0a0f" }}>{n.title}</span>
                            <span style={{ fontSize: "10px", color: "#94a3b8" }}>{n.time}</span>
                          </div>
                          <p style={{ fontSize: "11px", color: "#64748b", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                            {n.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Avatar & Trigger */}
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button
                  onClick={() => {
                    setProfileOpen(!profileOpen);
                    setNotificationOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "6px 14px 6px 6px",
                    borderRadius: "16px",
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(10,10,15,0.08)",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "12px",
                      backgroundColor: "#0a0a0f",
                      color: "#c6ff3d",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "14px",
                    }}
                  >
                    {(user.name || "U")[0].toUpperCase()}
                  </div>

                  <div style={{ textAlign: "left" }} className="hidden sm:block">
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#0a0a0f", display: "block", lineHeight: 1.2 }}>
                      {user.name || "User"}
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "capitalize" }}>
                      {user.role === "venue_owner" ? "Venue Host" : user.role || "Client"}
                    </span>
                  </div>

                  <ChevronDown style={{ width: "14px", height: "14px", color: "#64748b" }} />
                </button>

                {/* Profile Menu Dropdown */}
                {profileOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "52px",
                      width: "240px",
                      backgroundColor: "#ffffff",
                      borderRadius: "20px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                      padding: "10px",
                      zIndex: 100,
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#0a0a0f", display: "block" }}>
                        {user.name || "Account"}
                      </span>
                      <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>
                        {user.email || "Verified Member"}
                      </span>
                    </div>

                    {user.role !== "admin" && (
                      <>
                        <Link
                          to={
                            user.role === "artist"
                              ? "/band/artist/dashboard"
                              : user.role === "venue_owner"
                              ? "/venue/dashboard"
                              : "/band/client/dashboard"
                          }
                          onClick={() => setProfileOpen(false)}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "10px",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#0a0a0f",
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            transition: "background 0.15s ease",
                          }}
                        >
                          <Sparkles style={{ width: "16px", height: "16px", color: "#64748b" }} />
                          <span>Dashboard Portal</span>
                        </Link>

                        <Link
                          to="/band/client/bookings"
                          onClick={() => setProfileOpen(false)}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "10px",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#0a0a0f",
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <Calendar style={{ width: "16px", height: "16px", color: "#64748b" }} />
                          <span>My Event Bookings</span>
                        </Link>
                      </>
                    )}

                    {user.role === "artist" && (
                      <Link
                        to="/band/artist/profile"
                        onClick={() => setProfileOpen(false)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "10px",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#0a0a0f",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <Settings style={{ width: "16px", height: "16px", color: "#64748b" }} />
                        <span>Profile & Rider Specs</span>
                      </Link>
                    )}

                    <div style={{ borderTop: "1px solid #f1f5f9", marginTop: "4px", paddingTop: "4px" }}>
                      <button
                        onClick={handleLogout}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#e11d48",
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          textAlign: "left",
                        }}
                      >
                        <LogOut style={{ width: "16px", height: "16px", color: "#e11d48" }} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── PUBLIC / GUEST STATE: SIGN IN & JOIN BUTTONS ── */
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/band/login"
                style={{
                  padding: "10px 18px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#0a0a0f",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <LogIn style={{ width: "16px", height: "16px", color: "#64748b" }} />
                <span>Sign In</span>
              </Link>
              <Link
                to="/band/register"
                className="band-search-action-btn"
                style={{ height: "42px", padding: "0 20px", textDecoration: "none" }}
              >
                <UserPlus style={{ width: "16px", height: "16px" }} />
                <span>Join Platform</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                padding: "10px",
                borderRadius: "12px",
                backgroundColor: "#ffffff",
                border: "1px solid rgba(10,10,15,0.1)",
                cursor: "pointer",
              }}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X style={{ width: "20px", height: "20px" }} /> : <Menu style={{ width: "20px", height: "20px" }} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "16px 20px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {!user && (
            <>
              <Link to="/band" onClick={() => setMobileMenuOpen(false)} style={{ padding: "10px 14px", borderRadius: "10px", fontWeight: 700, fontSize: "14px", color: "#0a0a0f", textDecoration: "none" }}>
                Explore Home
              </Link>
              <Link to="/band/artists" onClick={() => setMobileMenuOpen(false)} style={{ padding: "10px 14px", borderRadius: "10px", fontWeight: 700, fontSize: "14px", color: "#0a0a0f", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
                <Mic2 style={{ width: "16px", height: "16px" }} />
                Artists & Bands
              </Link>
              <Link to="/band/venues" onClick={() => setMobileMenuOpen(false)} style={{ padding: "10px 14px", borderRadius: "10px", fontWeight: 700, fontSize: "14px", color: "#0a0a0f", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
                <Building2 style={{ width: "16px", height: "16px" }} />
                Venues
              </Link>
            </>
          )}

          <div style={{ paddingTop: "12px", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "8px" }}>
            {user ? (
              <>
                <Link to="/band/client/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ padding: "10px 14px", borderRadius: "10px", fontWeight: 800, fontSize: "14px", color: "#0a0a0f", backgroundColor: "#f8fafc", textDecoration: "none" }}>
                  Dashboard Portal
                </Link>
                <Link to="/band/client/bookings" onClick={() => setMobileMenuOpen(false)} style={{ padding: "10px 14px", borderRadius: "10px", fontWeight: 700, fontSize: "14px", color: "#0a0a0f", textDecoration: "none" }}>
                  My Bookings
                </Link>
                <button onClick={handleLogout} style={{ textAlign: "left", padding: "10px 14px", borderRadius: "10px", fontWeight: 700, fontSize: "14px", color: "#e11d48", backgroundColor: "transparent", border: "none", cursor: "pointer" }}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/band/login" onClick={() => setMobileMenuOpen(false)} style={{ textAlign: "center", padding: "10px", borderRadius: "10px", fontWeight: 700, fontSize: "13px", color: "#0a0a0f", backgroundColor: "#f1f5f9", textDecoration: "none" }}>
                  Sign In
                </Link>
                <Link to="/band/register" onClick={() => setMobileMenuOpen(false)} style={{ textAlign: "center", padding: "10px", borderRadius: "10px", fontWeight: 800, fontSize: "13px", color: "#0a0a0f", backgroundColor: "#c6ff3d", textDecoration: "none" }}>
                  Join Platform
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
