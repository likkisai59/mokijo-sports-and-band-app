"use client";

import * as React from "react";
import { Bell, Info, AlertTriangle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";
import {
  notificationService,
  NotificationItem,
} from "@/services/notificationService";
import { useAuth } from "@/hooks/use-auth";

export function AdminNotifications() {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await notificationService.getNotifications(1, 20);
      setNotifications(data.notifications || []);
    } catch {
      // silently fail — notification fetch is non-critical
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const getIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes("dispute") || lower.includes("warn") || lower.includes("alert"))
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    if (lower.includes("confirm") || lower.includes("approved") || lower.includes("completed"))
      return <CheckCircle className="h-4 w-4 text-secondary" />;
    return <Info className="h-4 w-4 text-primary" />;
  };

  const formatTime = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "just now";
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    } catch {
      return "";
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full border border-border/80 text-text-secondary hover:text-text-primary hover:border-primary/50 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/45 cursor-pointer"
        type="button"
        aria-label="Open notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-bg-primary animate-pulse" />
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-bg-elevated text-text-primary shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-primary">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[9px] bg-primary/15 text-primary rounded-full px-1.5 py-0.5 font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchNotifications}
                  title="Refresh"
                  className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto scrollbar-thin">
              {loading ? (
                <div className="p-4 text-center text-xs text-text-muted">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center space-y-1">
                  <Bell className="h-6 w-6 text-text-muted mx-auto" />
                  <p className="text-xs text-text-muted">No notifications yet.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markOneRead(n.id)}
                    className={cn(
                      "flex items-start gap-3 px-3 py-3 border-b border-border/30 transition-colors relative",
                      !n.is_read
                        ? "bg-primary/5 hover:bg-primary/8 cursor-pointer"
                        : "hover:bg-bg-card/40"
                    )}
                  >
                    <div className="mt-0.5 shrink-0">{getIcon(n.title)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-text-primary truncate">
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-text-secondary mt-0.5 leading-normal line-clamp-2">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-1 text-[9px] text-text-muted mt-1.5 font-semibold">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(n.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
