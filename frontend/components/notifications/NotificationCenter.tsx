"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Clock,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  ArrowRight,
  Square,
  CheckSquare
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useNotifications } from "@/features/notifications/hooks";
import { NotificationItem } from "@/features/notifications/types";
import { useAuth } from "@/hooks/use-auth";
import toast from "react-hot-toast";

interface NotificationCenterProps {
  /** Optional callback triggered after any action (mark read, delete) */
  onActionSuccess?: () => void;
  /** Optional flag to render inside a smaller container/tray instead of full screen */
  isTrayMode?: boolean;
  /** Optional callback to close the tray/parent popover */
  onClose?: () => void;
}

export function NotificationCenter({
  onActionSuccess,
  isTrayMode = false,
  onClose
}: NotificationCenterProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  // Connect to notifications Zustand state
  const {
    notifications,
    unreadCount,
    total,
    loading,
    error,
    filters,
    setFilters,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  // Tab filter: 'all' | 'unread' | 'read'
  const [activeTab, setActiveTab] = React.useState<"all" | "unread" | "read">("all");
  
  // Selection states for checkboxes
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Filter list on client side for 'read' tab, or request backend filtering for others
  const displayedNotifications = React.useMemo(() => {
    if (activeTab === "read") {
      return notifications.filter((n) => n.is_read);
    }
    return notifications;
  }, [notifications, activeTab]);

  const handleTabChange = (tab: "all" | "unread" | "read") => {
    setActiveTab(tab);
    setSelectedIds([]);
    
    // Configure API parameters
    if (tab === "unread") {
      setFilters({ unread_only: true, page: 1 });
    } else {
      setFilters({ unread_only: false, page: 1 });
    }
  };

  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await markAsRead(id);
      toast.success("Notification marked as read");
      if (onActionSuccess) onActionSuccess();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      toast.success("All notifications marked as read");
      if (onActionSuccess) onActionSuccess();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      toast.success("Notification deleted");
      if (onActionSuccess) onActionSuccess();
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  // Bulk actions
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === displayedNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedNotifications.map((n) => n.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const loadingToast = toast.loading("Deleting selected notifications...");
    try {
      await Promise.all(selectedIds.map((id) => deleteNotification(id)));
      setSelectedIds([]);
      toast.dismiss(loadingToast);
      toast.success("Selected notifications deleted successfully");
      if (onActionSuccess) onActionSuccess();
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Failed to delete some notifications");
    }
  };

  const handleDeleteAllRead = async () => {
    const readNotifications = notifications.filter((n) => n.is_read);
    if (readNotifications.length === 0) return;
    const loadingToast = toast.loading("Deleting all read notifications...");
    try {
      await Promise.all(readNotifications.map((n) => deleteNotification(n.id)));
      toast.dismiss(loadingToast);
      toast.success("All read notifications deleted");
      if (onActionSuccess) onActionSuccess();
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Failed to delete notifications");
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.is_read) {
      await markAsRead(n.id);
    }
    if (onClose) onClose();

    // Deep link routing based on reference types & roles
    if (n.reference_type === "Booking" && n.reference_id) {
      const role = user?.role;
      if (role === "artist") {
        router.push(`/artist/bookings?id=${n.reference_id}`);
      } else if (role === "venue_owner") {
        router.push(`/venue/bookings?id=${n.reference_id}`);
      } else {
        router.push(`/client/bookings?id=${n.reference_id}`);
      }
    } else if (n.reference_type === "Payment" && n.reference_id) {
      router.push(`/payments?id=${n.reference_id}`);
    } else if (n.reference_type === "Review" && n.reference_id) {
      router.push(`/reviews?id=${n.reference_id}`);
    } else if (n.link) {
      router.push(n.link);
    } else {
      router.push("/notifications");
    }
  };

  const getIcon = (type?: string, title?: string) => {
    const iconClass = "h-4 w-4 shrink-0";
    const lowerType = type?.toLowerCase() || "";
    const lowerTitle = title?.toLowerCase() || "";

    if (lowerType.includes("request") || lowerTitle.includes("request")) {
      return (
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
          <Calendar className={iconClass} />
        </div>
      );
    }
    if (lowerType.includes("confirm") || lowerTitle.includes("confirmed")) {
      return (
        <div className="p-1.5 rounded-lg bg-green-500/10 text-green-500">
          <CheckCircle className={iconClass} />
        </div>
      );
    }
    if (lowerType.includes("dispute") || lowerTitle.includes("dispute")) {
      return (
        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
          <AlertTriangle className={iconClass} />
        </div>
      );
    }
    if (lowerType.includes("cancel") || lowerTitle.includes("cancelled")) {
      return (
        <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
          <XCircle className={iconClass} />
        </div>
      );
    }
    if (lowerType.includes("failed") || lowerTitle.includes("failed")) {
      return (
        <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
          <AlertTriangle className={iconClass} />
        </div>
      );
    }
    return (
      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
        <Info className={iconClass} />
      </div>
    );
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
    <div
      className={cn(
        "flex flex-col bg-bg-card text-text-primary rounded-xl overflow-hidden",
        !isTrayMode && "border border-border/80 shadow-md p-6 max-w-4xl mx-auto w-full"
      )}
    >
      {/* Header Controls */}
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <h2 className={cn("font-extrabold tracking-tight", isTrayMode ? "text-sm" : "text-xl")}>
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Bulk Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 py-3 border-b border-border/20">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTabChange("all")}
            className={cn(
              "text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
              activeTab === "all"
                ? "bg-bg-elevated text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            All
          </button>
          <button
            onClick={() => handleTabChange("unread")}
            className={cn(
              "text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
              activeTab === "unread"
                ? "bg-bg-elevated text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            Unread
          </button>
          <button
            onClick={() => handleTabChange("read")}
            className={cn(
              "text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
              activeTab === "read"
                ? "bg-bg-elevated text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            Read
          </button>
        </div>

        {/* Bulk Removal Tools (Hidden in tray mode for compact visual weight) */}
        {!isTrayMode && displayedNotifications.length > 0 && (
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={toggleSelectAll}
              className="text-xs text-text-muted hover:text-text-primary font-semibold flex items-center gap-1 cursor-pointer bg-bg-elevated/40 px-2 py-1 rounded"
            >
              Select All
            </button>

            {selectedIds.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                <span>Delete ({selectedIds.length})</span>
              </button>
            )}

            {notifications.some((n) => n.is_read) && (
              <button
                onClick={handleDeleteAllRead}
                className="text-xs text-text-muted hover:text-red-500 font-semibold flex items-center gap-1 cursor-pointer px-2 py-1 rounded"
              >
                <span>Delete Read</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div
        className={cn(
          "divide-y divide-border/20 overflow-y-auto scrollbar-thin",
          isTrayMode ? "max-h-[350px] min-h-[150px]" : "min-h-[350px]"
        )}
      >
        {loading ? (
          /* Loading Skeletons */
          <div className="flex flex-col p-4 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 items-start animate-pulse py-2">
                <div className="h-8 w-8 bg-bg-elevated rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-bg-elevated rounded w-1/4" />
                  <div className="h-3 bg-bg-elevated rounded w-3/4" />
                  <div className="h-2.5 bg-bg-elevated rounded w-1/6" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-500 animate-bounce" />
            <p className="text-xs font-semibold text-text-primary">{error}</p>
            <button
              onClick={refresh}
              className="text-xs font-bold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/95 transition-all shadow cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : displayedNotifications.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center text-text-muted space-y-2">
            <Bell className="h-8 w-8 opacity-40 text-text-muted" />
            <p className="text-xs font-semibold">No notifications to display</p>
            <p className="text-[11px] opacity-75">
              We&apos;ll alert you here when booking events occur.
            </p>
          </div>
        ) : (
          displayedNotifications.map((n) => {
            const isSelected = selectedIds.includes(n.id);
            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={cn(
                  "flex items-start gap-3 p-3.5 hover:bg-bg-elevated/40 cursor-pointer transition-colors relative group",
                  !n.is_read && "bg-primary/5 hover:bg-primary/8"
                )}
              >
                {/* Selection Checkbox (Hidden in Tray Mode) */}
                {!isTrayMode && (
                  <button
                    onClick={(e) => toggleSelect(n.id, e)}
                    className="p-1 hover:bg-bg-elevated rounded self-center text-text-muted hover:text-text-primary cursor-pointer transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 opacity-40" />
                    )}
                  </button>
                )}

                {/* Type Icon */}
                {getIcon(n.notification_type || undefined, n.title)}

                {/* Message Block */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4
                      className={cn(
                        "text-xs font-extrabold truncate",
                        !n.is_read ? "text-text-primary" : "text-text-secondary"
                      )}
                    >
                      {n.title}
                    </h4>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.is_read && (
                        <button
                          onClick={(e) => handleMarkRead(n.id, e)}
                          title="Mark as read"
                          className="p-1 hover:bg-bg-elevated rounded text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(n.id, e)}
                        title="Delete notification"
                        className="p-1 hover:bg-bg-elevated rounded text-text-muted hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-1 text-[9px] text-text-muted mt-2 font-bold uppercase tracking-wider">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(n.created_at)}</span>
                    {(n.reference_type || n.link) && (
                      <span className="flex items-center gap-0.5 text-primary lowercase tracking-normal normal-case font-extrabold hover:underline">
                        &bull; View Details <ArrowRight className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Unread dot indicator */}
                {!n.is_read && (
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls for dedicated full page */}
      {!isTrayMode && total > filters.limit! && (
        <div className="flex items-center justify-between pt-4 border-t border-border/20 mt-4">
          <p className="text-xs text-text-secondary">
            Showing {(filters.page! - 1) * filters.limit! + 1} -{" "}
            {Math.min(filters.page! * filters.limit!, total)} of {total} notifications
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters({ page: Math.max(1, filters.page! - 1) })}
              disabled={filters.page === 1}
              className="text-xs font-bold border border-border px-3 py-1.5 rounded-lg disabled:opacity-40 cursor-pointer transition-all"
            >
              Prev
            </button>
            <button
              onClick={() =>
                setFilters({ page: Math.min(Math.ceil(total / filters.limit!), filters.page! + 1) })
              }
              disabled={filters.page! * filters.limit! >= total}
              className="text-xs font-bold border border-border px-3 py-1.5 rounded-lg disabled:opacity-40 cursor-pointer transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Footer controls for Tray Mode */}
      {isTrayMode && !loading && notifications.length > 0 && (
        <div className="p-2 border-t border-border/20 bg-bg-elevated/20 text-center">
          <button
            onClick={() => {
              if (onClose) onClose();
              router.push("/notifications");
            }}
            className="text-xs font-bold text-primary hover:underline w-full py-1 cursor-pointer"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
