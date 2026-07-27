"use client";

import * as React from "react";
import { Bell, RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";
import { useUnreadCount } from "@/features/notifications/hooks";
import { useNotificationsStore } from "@/features/notifications/store";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useAuth } from "@/hooks/use-auth";

export function NotificationsBell() {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const unreadCount = useUnreadCount(30000); // Polls every 30s
  const { fetchUnreadCount, loading } = useNotificationsStore();

  const handleToggle = () => {
    setOpen(!open);
    if (!open) {
      fetchUnreadCount();
    }
  };

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await fetchUnreadCount();
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        id="notifications-bell-btn"
        aria-label="Notifications"
        onClick={handleToggle}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-xl",
          "text-text-secondary hover:text-text-primary hover:bg-bg-elevated",
          "transition-all duration-150 cursor-pointer border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary/45",
          open && "bg-bg-elevated text-text-primary border-primary/40"
        )}
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-white shadow ring-2 ring-bg-primary animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Tray Dropdown Popover */}
      {open && (
        <>
          {/* Backdrop for closing */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          
          <div className="absolute right-0 mt-2.5 w-80 rounded-xl border border-border bg-bg-card shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            
            {/* Header control inside tray popover */}
            <div className="flex items-center justify-end px-3 py-1 border-b border-border/10 bg-bg-elevated/10">
              <button
                onClick={handleRefresh}
                title="Refresh count"
                className="text-text-muted hover:text-text-primary p-1 transition-colors cursor-pointer"
              >
                <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
              </button>
            </div>

            {/* Notification Center Tray */}
            <NotificationCenter 
              isTrayMode={true} 
              onClose={() => setOpen(false)} 
            />
          </div>
        </>
      )}
    </div>
  );
}
