"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import {
  Home,
  User,
  Calendar,
  Heart,
  MessageSquare,
  Inbox,
  IndianRupee,
  Settings,
  Building2,
  Users,
  Music,
  BarChart2,
  LogOut,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function Sidebar({ role }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getMenuSections = () => {
    switch (role) {
      case "venue":
        return [
          {
            title: "MAIN",
            items: [
              { name: "Dashboard", href: "/venue/dashboard", icon: Home },
              { name: "Venue Profile", href: "/venue/profile", icon: Building2 },
              { name: "Bookings", href: "/venue/bookings", icon: Calendar },
            ],
          },
          {
            title: "MANAGEMENT",
            items: [
              { name: "Reviews", href: "/venue/reviews", icon: MessageSquare },
              { name: "Messages", href: "/venue/messages", icon: Inbox },
              { name: "Payouts", href: "/venue/earnings", icon: IndianRupee },
            ],
          },
        ];

      case "artist":
        return [
          {
            title: "MAIN",
            items: [
              { name: "Dashboard", href: "/band/artist/dashboard", icon: Home },
              { name: "Artist Profile", href: "/band/artist/profile", icon: User },
              { name: "Gigs Calendar", href: "/band/artist/bookings", icon: Calendar },
            ],
          },
          {
            title: "MANAGEMENT",
            items: [
              { name: "Reviews", href: "/band/artist/reviews", icon: MessageSquare },
              { name: "Messages", href: "/band/artist/messages", icon: Inbox },
              { name: "Earnings", href: "/band/artist/earnings", icon: IndianRupee },
            ],
          },
        ];

      case "client":
        return [
          {
            title: "MAIN",
            items: [
              { name: "Dashboard", href: "/band/client/dashboard", icon: Home },
              { name: "My Profile", href: "/band/client/profile", icon: User },
              { name: "Bookings", href: "/band/client/bookings", icon: Calendar },
              { name: "Favorites", href: "/band/client/favorites", icon: Heart },
            ],
          },
          {
            title: "MANAGEMENT",
            items: [
              { name: "Reviews", href: "/band/client/reviews", icon: MessageSquare },
              { name: "Messages", href: "/band/client/messages", icon: Inbox },
              { name: "Billing", href: "/band/client/payments", icon: IndianRupee },
            ],
          },
        ];

      case "admin":
        return [
          {
            title: "OVERVIEW",
            items: [
              { name: "Dashboard", href: "/admin/dashboard", icon: Home },
              { name: "Users", href: "/admin/users", icon: Users },
              { name: "Artists", href: "/admin/artists", icon: Music },
              { name: "Venues", href: "/admin/venues", icon: Building2 },
            ],
          },
          {
            title: "MANAGEMENT",
            items: [
              { name: "Bookings", href: "/admin/bookings", icon: Calendar },
              { name: "Inbox", href: "/admin/messages", icon: Inbox },
              { name: "Payments", href: "/admin/payments", icon: IndianRupee },
              { name: "Promo Codes", href: "/admin/promos", icon: Tag },
              { name: "Reports", href: "/admin/reports", icon: BarChart2 },
            ],
          },
        ];

      default:
        return [];
    }
  };

  const sections = getMenuSections();

  const brandName =
    role === "venue"
      ? user?.venue_name || "Grand Arena"
      : role === "artist"
        ? user?.artist_name || "Groove Collective"
        : role === "admin"
          ? "Super Admin"
          : "BandConnect";

  const brandInitial = brandName.charAt(0).toUpperCase();

  const settingsHref =
    role === "venue"
      ? "/venue/settings"
      : role === "artist"
      ? "/band/artist/settings"
      : role === "admin"
      ? "/admin/settings"
      : "/band/client/settings";

  return (
    <aside
      style={{
        position: "fixed",
        top: "76px",
        left: 0,
        bottom: 0,
        width: "260px",
        backgroundColor: "#ffffff",
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "24px 16px 20px",
        zIndex: 30,
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      {/* 1. Header Identity & Menu Navigation */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Brand Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px 10px",
            backgroundColor: "#f8fafc",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              backgroundColor: "#0a0a0f",
              color: "#c6ff3d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "17px",
              flexShrink: 0,
            }}
          >
            {brandInitial}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <span
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 800,
                color: "#0a0a0f",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {brandName}
            </span>
            <span
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "#64748b",
                textTransform: "capitalize",
              }}
            >
              {role === "artist" ? "Verified Performer" : role === "venue" ? "Venue Host" : role}
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {sections.map((sec, secIdx) => (
            <div key={sec.title || secIdx} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {sec.title && (
                <div
                  style={{
                    padding: "0 10px 4px",
                    fontSize: "11px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#94a3b8",
                  }}
                >
                  {sec.title}
                </div>
              )}

              {/* Items List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href + "/"));

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 14px",
                        fontSize: "13.5px",
                        fontWeight: isActive ? 800 : 600,
                        borderRadius: "12px",
                        textDecoration: "none",
                        transition: "all 0.15s ease",
                        backgroundColor: isActive ? "#0a0a0f" : "transparent",
                        color: isActive ? "#c6ff3d" : "#475569",
                        boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                      }}
                    >
                      <Icon
                        style={{
                          width: "18px",
                          height: "18px",
                          color: isActive ? "#c6ff3d" : "#64748b",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Bottom Links (Settings & Sign Out) */}
      <div
        style={{
          paddingTop: "16px",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <Link
          href={settingsHref}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 14px",
            fontSize: "13.5px",
            fontWeight: 600,
            color: "#475569",
            borderRadius: "12px",
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
        >
          <Settings style={{ width: "18px", height: "18px", color: "#64748b" }} />
          <span>Settings</span>
        </Link>

        {logout && (
          <button
            type="button"
            onClick={logout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 14px",
              fontSize: "13.5px",
              fontWeight: 600,
              color: "#ef4444",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
            }}
          >
            <LogOut style={{ width: "18px", height: "18px", color: "#ef4444" }} />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
