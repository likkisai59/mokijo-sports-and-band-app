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
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function Sidebar({ role }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getMenuSections = () => {
    switch (role) {
      case "venue":
      default:
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

  return (
    <aside
      style={{ top: "72px", height: "calc(100vh - 72px)" }}
      className="fixed bottom-0 left-0 z-30 hidden w-[280px] border-r border-[#e2e8f0] bg-[#ffffff] md:flex flex-col justify-between py-[32px] px-[18px] font-['Raleway','Outfit',sans-serif] select-none overflow-y-auto shadow-xs"
    >
      {/* Top-Left Ambient Subtle Glow */}
      <div className="absolute top-0 left-0 right-0 h-[220px] bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.06)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 space-y-[28px]">
        {/* 1. Brand/Club Section with Larger Typography and 46px Badge */}
        <div className="flex items-center gap-[14px] mb-[32px] px-[8px]">
          {/* 46px Circular Gradient Badge */}
          <div className="w-[46px] h-[46px] rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] text-[#ffffff] flex items-center justify-center font-[900] text-[22px] shadow-[0_4px_16px_rgba(16,185,129,0.35)] shrink-0">
            {brandInitial}
          </div>

          <div className="min-w-0 flex-1">
            <span className="block text-[18.5px] font-[800] text-[#0f172a] tracking-[-0.3px] truncate">
              {brandName}
            </span>
          </div>
        </div>

        {/* 2. Menu Navigation Items with Spacious 20px Gap Between Items */}
        <div className="space-y-[36px]">
          {sections.map((sec, secIdx) => (
            <div key={sec.title || secIdx} className="space-y-[14px]">
              {sec.title && (
                <div className="px-[10px] text-[13px] font-[800] uppercase tracking-[0.09em] text-[#94a3b8]">
                  {sec.title}
                </div>
              )}

              {/* Generous 20px vertical gap between each tab item */}
              <div className="space-y-[20px]">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href + "/"));

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-[14px] px-[16px] py-[13px] text-[15.5px] font-[700] tracking-[0.02em] rounded-[10px] transition-all duration-200 overflow-hidden group",
                        isActive
                          ? "bg-[#ecfdf5] text-[#047857] font-[800] border border-[#a7f3d0] shadow-xs"
                          : "text-[#334155] hover:bg-[rgba(16,185,129,0.08)] hover:text-[#10b981]"
                      )}
                    >
                      {/* Active Left Indicator Bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-[65%] bg-gradient-to-b from-[#10b981] to-[#059669] rounded-r-sm" />
                      )}

                      <span className="flex items-center justify-center w-[22px] h-[22px] shrink-0">
                        <Icon
                          className={cn(
                            "w-[20px] h-[20px] transition-transform duration-200",
                            isActive
                              ? "stroke-[2.5] text-[#047857]"
                              : "stroke-[2] text-current group-hover:scale-110"
                          )}
                        />
                      </span>

                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Bottom Links with 16px Spacing */}
      <div className="relative z-10 mt-auto pt-[24px] border-t border-[#e2e8f0] space-y-[16px]">
        <Link
          href={role === "venue" ? "/venue/settings" : "/band/settings"}
          className="flex items-center gap-[14px] px-[16px] py-[12px] text-[14.5px] font-[600] text-[#475569] hover:bg-[rgba(16,185,129,0.08)] hover:text-[#0f172a] rounded-[10px] transition-all duration-200"
        >
          <span className="flex items-center justify-center w-[22px] h-[22px] shrink-0">
            <Settings className="w-[19px] h-[19px] stroke-[2] text-current" />
          </span>
          <span>Settings</span>
        </Link>

        {logout && (
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-[14px] px-[16px] py-[12px] text-[14.5px] font-[600] text-[#ef4444] hover:bg-red-50 rounded-[10px] transition-all duration-200 cursor-pointer text-left"
          >
            <span className="flex items-center justify-center w-[22px] h-[22px] shrink-0">
              <LogOut className="w-[19px] h-[19px] stroke-[2] text-[#ef4444]" />
            </span>
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
