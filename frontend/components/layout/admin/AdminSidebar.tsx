"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Music,
  Building2,
  Users,
  Settings,
  Calendar,
  IndianRupee,
  BarChart2,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useUIStore } from "@/store/ui-store";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Admin sidebar navigation.
 * Links are limited strictly to routes that exist under app/admin/.
 */
const menuItems: MenuItem[] = [
  { name: "Home font",  href: "/admin/dashboard", icon: Home },
  { name: "Users",      href: "/admin/users",     icon: Users },
  { name: "Artists",    href: "/admin/artists",   icon: Music },
  { name: "Venues",     href: "/admin/venues",    icon: Building2 },
  { name: "Bookings",   href: "/admin/bookings",  icon: Calendar },
  { name: "Payments",   href: "/admin/payments",  icon: IndianRupee },
  { name: "Moderation", href: "/admin/reviews/moderation", icon: ShieldAlert },
  { name: "Reports",    href: "/admin/reports",   icon: BarChart2 },
  { name: "Settings",   href: "/admin/settings",  icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar navigation body */}
      <aside
        className={cn(
          "fixed bottom-0 top-16 z-40 flex w-64 flex-col border-r border-border bg-bg-card transition-all duration-300 md:left-0",
          sidebarOpen ? "left-0" : "-left-64"
        )}
      >
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 scrollbar-thin">
          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group",
                    isActive
                      ? "bg-primary text-white font-semibold"
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
          </nav>
        </div>
      </aside>
    </>
  );
}
