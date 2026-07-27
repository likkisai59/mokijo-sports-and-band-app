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
  Music as MusicIcon,
  BarChart2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/shared/BrandLogo";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: "client" | "artist" | "venue" | "admin";
}

export function MobileNav({ open, onOpenChange, role }: MobileNavProps) {
  const pathname = usePathname();

  const getMenuItems = (): MenuItem[] => {
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
          { name: "Home",       href: "/artist/dashboard",  icon: Home },
          { name: "Profile",    href: "/artist/profile",    icon: User },
          { name: "Bookings",   href: "/artist/bookings",   icon: Calendar },
          { name: "Reviews",    href: "/artist/reviews",    icon: MessageSquare },
          { name: "Inbox",      href: "/artist/messages",   icon: Inbox },
          { name: "Payments",   href: "/artist/earnings",   icon: IndianRupee },
          { name: "Settings",   href: "/artist/settings",   icon: Settings },
        ];

      case "venue":
        return [
          { name: "Home",       href: "/venue/dashboard",   icon: Home },
          { name: "Profile",    href: "/venue/profile",     icon: Building2 },
          { name: "Bookings",   href: "/venue/bookings",    icon: Calendar },
          { name: "Reviews",    href: "/venue/reviews",     icon: MessageSquare },
          { name: "Inbox",      href: "/venue/messages",    icon: Inbox },
          { name: "Payments",   href: "/venue/earnings",    icon: IndianRupee },
          { name: "Settings",   href: "/venue/settings",    icon: Settings },
        ];

      case "admin":
        return [
          { name: "Home",       href: "/admin/dashboard",   icon: Home },
          { name: "Users",      href: "/admin/users",       icon: Users },
          { name: "Artists",    href: "/admin/artists",     icon: MusicIcon },
          { name: "Venues",     href: "/admin/venues",      icon: Building2 },
          { name: "Bookings",   href: "/admin/bookings",    icon: Calendar },
          { name: "Inbox",      href: "/admin/messages",    icon: Inbox },
          { name: "Payments",   href: "/admin/payments",    icon: IndianRupee },
          { name: "Reports",    href: "/admin/reports",     icon: BarChart2 },
          { name: "Settings",   href: "/admin/settings",    icon: Settings },
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      {/* Drawer */}
      <div className="fixed bottom-0 left-0 top-0 z-50 w-72 bg-bg-card p-6 border-r border-border flex flex-col gap-4 animate-in slide-in-from-left duration-250">
        <div className="flex items-center justify-between">
          <BrandLogo onClick={() => onOpenChange(false)} iconSize="sm" textSize="lg" />
          <Button
            variant="ghost"
            size="icon"
            className="text-text-secondary hover:text-text-primary"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 space-y-1 mt-6 overflow-y-auto">
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
                onClick={() => onOpenChange(false)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
