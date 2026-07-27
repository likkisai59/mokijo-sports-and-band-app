"use client";

import * as React from "react";
import Link from "next/link";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";

/**
 * Returns the profile and settings routes for a given role.
 * Follows the canonical frontend portal routes defined in MASTER.md §5.6.
 */
function getRoleProfileRoutes(role: string | undefined | null): {
  profile: string;
  settings: string;
} {
  switch (role) {
    case "artist":
      return { profile: "/artist/profile", settings: "/artist/settings" };
    case "venue_owner":
      return { profile: "/venue/profile", settings: "/venue/settings" };
    case "client":
    default:
      return { profile: "/client/settings", settings: "/client/settings" };
  }
}

export function HeaderProfileDropdown() {
  const { user, logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close on Escape key
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const { profile: profileRoute, settings: settingsRoute } = getRoleProfileRoutes(user?.role);

  const handleLogout = () => {
    setOpen(false);
    toast.success("Successfully logged out!");
    logout();
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="profile-dropdown-trigger"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm font-medium transition-all",
          "hover:bg-bg-elevated text-text-secondary hover:text-text-primary",
          open && "bg-bg-elevated text-text-primary"
        )}
      >
        {/* Avatar circle */}
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-[11px] font-black text-primary border border-primary/30">
          {initials}
        </span>
        <span className="hidden sm:block text-xs font-semibold max-w-20 truncate">
          {user?.name?.split(" ")[0] || "Account"}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 opacity-60 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <>
          {/* Invisible backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div
            id="profile-dropdown-menu"
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 rounded-2xl border border-border bg-bg-card/95 backdrop-blur-md p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {/* User info header */}
            <div className="px-3 py-2 mb-1 border-b border-border/30">
              <p className="text-xs font-bold text-text-primary truncate">
                {user?.name || "User"}
              </p>
              <p className="text-[10px] text-text-muted truncate capitalize">
                {user?.role === "venue_owner" ? "Venue Owner" : user?.role || "Member"}
              </p>
            </div>

            {/* Menu links */}
            <div className="space-y-0.5">
              <Link
                href={profileRoute}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors group"
              >
                <User className="h-3.5 w-3.5 shrink-0 group-hover:text-primary transition-colors" />
                Profile
              </Link>

              <Link
                href={settingsRoute}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors group"
              >
                <Settings className="h-3.5 w-3.5 shrink-0 group-hover:text-primary transition-colors" />
                Settings
              </Link>

              <div className="border-t border-border/30 mt-1 pt-1">
                <button
                  id="profile-dropdown-logout"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-colors group"
                >
                  <LogOut className="h-3.5 w-3.5 shrink-0 group-hover:text-red-400 transition-colors" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
