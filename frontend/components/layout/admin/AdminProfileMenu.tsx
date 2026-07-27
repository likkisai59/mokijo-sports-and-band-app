"use client";

import * as React from "react";
import Link from "next/link";
import { User, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AdminProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = React.useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-border/80 p-0.5 hover:border-primary/50 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/45 cursor-pointer"
        type="button"
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback>{user.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <>
          {/* Backdrop for closing */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-bg-elevated text-text-primary shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100 p-1">
            <div className="px-3 py-2 border-b border-border/50">
              <p className="text-sm font-bold text-text-primary truncate">{user.name}</p>
              <p className="text-xs text-text-secondary truncate">{user.email}</p>
            </div>
            <div className="py-1">
              <Link href="/admin/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-primary/10 hover:text-primary rounded-md transition-colors">
                <User className="h-4 w-4" />
                <span>My Profile</span>
              </Link>
              <Link href="/admin/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-primary/10 hover:text-primary rounded-md transition-colors">
                <Settings className="h-4 w-4" />
                <span>System Settings</span>
              </Link>
            </div>
            <div className="border-t border-border/50 pt-1">
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-destructive/10 text-destructive hover:text-destructive rounded-md transition-colors text-left cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
