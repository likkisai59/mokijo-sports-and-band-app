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
} from "lucide-react";

export function Sidebar({ role }) {
  const pathname = usePathname();

  const getMenuItems = () => {
    switch (role) {
      case "client":
        return [
          { name: "Home",       href: "/client/dashboard",  icon: Home },
          { name: "Profile",    href: "/client/profile",    icon: User },
          { name: "Bookings",   href: "/client/bookings",   icon: Calendar },
          { name: "Reviews",    href: "/client/reviews",    icon: MessageSquare },
          { name: "Favorites",  href: "/client/favorites",  icon: Heart },
          { name: "Inbox",      href: "/client/messages",   icon: Inbox },
          { name: "Payments",   href: "/client/payments",   icon: IndianRupee },
          { name: "Settings",   href: "/client/settings",   icon: Settings },
        ];

      case "artist":
        return [
          { name: "Home",       href: "/band/artist/dashboard",  icon: Home },
          { name: "Profile",    href: "/band/artist/profile",    icon: User },
          { name: "Bookings",   href: "/band/artist/bookings",   icon: Calendar },
          { name: "Reviews",    href: "/band/artist/reviews",    icon: MessageSquare },
          { name: "Inbox",      href: "/band/artist/messages",   icon: Inbox },
          { name: "Payments",   href: "/band/artist/earnings",   icon: IndianRupee },
          { name: "Settings",   href: "/band/artist/settings",   icon: Settings },
        ];

      case "venue_owner":
        return [
          { name: "Home",       href: "/band/venue/dashboard",   icon: Home },
          { name: "Profile",    href: "/band/venue/profile",     icon: Building2 },
          { name: "Bookings",   href: "/band/venue/bookings",    icon: Calendar },
          { name: "Reviews",    href: "/band/venue/reviews",     icon: MessageSquare },
          { name: "Inbox",      href: "/band/venue/messages",    icon: Inbox },
          { name: "Payments",   href: "/band/venue/earnings",    icon: IndianRupee },
          { name: "Settings",   href: "/band/venue/settings",    icon: Settings },
        ];

      case "admin":
        return [
          { name: "Home",       href: "/band/admin/dashboard",   icon: Home },
          { name: "Users",      href: "/band/admin/users",       icon: Users },
          { name: "Artists",    href: "/band/admin/artists",     icon: Music },
          { name: "Venues",     href: "/band/admin/venues",      icon: Building2 },
          { name: "Bookings",   href: "/band/admin/bookings",    icon: Calendar },
          { name: "Inbox",      href: "/band/admin/messages",    icon: Inbox },
          { name: "Payments",   href: "/band/admin/payments",    icon: IndianRupee },
          { name: "Reports",    href: "/band/admin/reports",     icon: BarChart2 },
          { name: "Settings",   href: "/band/admin/settings",    icon: Settings },
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-64 border-r border-border bg-bg-card md:block">
      <div className="flex h-full flex-col gap-4 p-4">
        <div className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href + "/"));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group select-none",
                  isActive
                    ? "bg-primary text-white font-semibold shadow-sm"
                    : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-text-secondary group-hover:text-text-primary"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
