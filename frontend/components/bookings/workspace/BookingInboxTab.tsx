"use client";

import * as React from "react";
import { BookingRequestDetail } from "@/types/booking";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { BookingStatusBadge } from "../BookingStatusBadge";
import { BookingDetailsDialog } from "../BookingDetailsDialog";
import {
  Search,
  Calendar,
  User,
  Inbox,
} from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

interface BookingInboxTabProps {
  role: "client" | "artist" | "venue" | "admin";
  bookings: BookingRequestDetail[];
  loading: boolean;
  onRefresh: () => void;
}

type SubTab = "incoming" | "countered" | "pending" | "accepted" | "rejected";

export function BookingInboxTab({
  role,
  bookings,
  loading,
  onRefresh,
}: BookingInboxTabProps) {
  const [subTab, setSubTab] = React.useState<SubTab>("incoming");
  const [search, setSearch] = React.useState("");
  const [selectedBookingId, setSelectedBookingId] = React.useState<string | null>(null);

  // Active non-historical statuses
  const activeBookings = React.useMemo(() => {
    return bookings.filter(
      (b) => !["completed", "cancelled", "expired"].includes(b.status.toLowerCase())
    );
  }, [bookings]);

  const filteredBookings = React.useMemo(() => {
    return activeBookings.filter((b) => {
      // Subtab filter
      const st = b.status.toLowerCase();
      let matchesTab = false;
      if (subTab === "incoming") {
        matchesTab = st === "requested" || st === "received" || st === "created";
      } else if (subTab === "countered") {
        matchesTab = st === "countered" || st === "counter_offered";
      } else if (subTab === "pending") {
        matchesTab = st.includes("pending") || st === "draft";
      } else if (subTab === "accepted") {
        matchesTab = st === "accepted" || st === "confirmed";
      } else if (subTab === "rejected") {
        matchesTab = st === "rejected";
      }

      // Search filter
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.event_name.toLowerCase().includes(q) ||
        (b.client?.name && b.client.name.toLowerCase().includes(q)) ||
        (b.artist?.display_name && b.artist.display_name.toLowerCase().includes(q)) ||
        (b.artist_name && b.artist_name.toLowerCase().includes(q)) ||
        b.id.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [activeBookings, subTab, search]);

  const subTabCounts = React.useMemo(() => {
    return {
      incoming: activeBookings.filter((b) =>
        ["requested", "received", "created"].includes(b.status.toLowerCase())
      ).length,
      countered: activeBookings.filter((b) =>
        ["countered", "counter_offered"].includes(b.status.toLowerCase())
      ).length,
      pending: activeBookings.filter((b) =>
        b.status.toLowerCase().includes("pending") || b.status.toLowerCase() === "draft"
      ).length,
      accepted: activeBookings.filter((b) =>
        ["accepted", "confirmed"].includes(b.status.toLowerCase())
      ).length,
      rejected: activeBookings.filter((b) => b.status.toLowerCase() === "rejected").length,
    };
  }, [activeBookings]);

  return (
    <div className="space-y-4">
      {/* Sub Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-bg-card/40 p-2 rounded-xl border border-border/60">
        <div className="flex flex-wrap items-center gap-1">
          <Button
            variant={subTab === "incoming" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSubTab("incoming")}
            className="text-xs h-8 font-bold gap-1.5"
          >
            <span>Incoming Requests</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {subTabCounts.incoming}
            </Badge>
          </Button>

          <Button
            variant={subTab === "countered" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSubTab("countered")}
            className="text-xs h-8 font-bold gap-1.5"
          >
            <span>Counter Offers</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {subTabCounts.countered}
            </Badge>
          </Button>

          <Button
            variant={subTab === "pending" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSubTab("pending")}
            className="text-xs h-8 font-bold gap-1.5"
          >
            <span>Pending</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {subTabCounts.pending}
            </Badge>
          </Button>

          <Button
            variant={subTab === "accepted" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSubTab("accepted")}
            className="text-xs h-8 font-bold gap-1.5"
          >
            <span>Accepted</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {subTabCounts.accepted}
            </Badge>
          </Button>

          <Button
            variant={subTab === "rejected" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSubTab("rejected")}
            className="text-xs h-8 font-bold gap-1.5"
          >
            <span>Rejected</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {subTabCounts.rejected}
            </Badge>
          </Button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted" />
          <Input
            placeholder="Search active requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-8 bg-bg-card border-border/80"
          />
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-xs text-text-secondary animate-pulse">Loading active inbox...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <Card className="bg-bg-card/30 border-border/40 p-8 text-center">
          <Inbox className="h-8 w-8 mx-auto mb-2 text-text-muted opacity-50" />
          <h3 className="text-xs font-bold text-text-primary mb-1">No requests found</h3>
          <p className="text-[11px] text-text-secondary">
            No active booking requests match the current tab filter or search query.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map((b) => (
            <Card
              key={b.id}
              onClick={() => setSelectedBookingId(b.id)}
              className="bg-bg-card/50 hover:bg-bg-card border border-border/80 hover:border-primary/50 transition-all cursor-pointer shadow-sm flex flex-col justify-between"
            >
              <CardHeader className="p-4 pb-2 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-xs font-bold text-text-primary line-clamp-1">
                    {b.event_name}
                  </CardTitle>
                  <BookingStatusBadge status={b.status} />
                </div>
                <div className="text-[11px] text-text-secondary flex items-center gap-1">
                  <User className="h-3 w-3 text-primary shrink-0" />
                  <span className="truncate">
                    {role === "client"
                      ? b.artist?.display_name || b.artist_name || "Performer"
                      : b.client?.name || "Client"}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2 space-y-2 text-[11px] text-text-secondary">
                <div className="flex items-center gap-1.5 text-text-muted">
                  <Calendar className="h-3 w-3 text-primary shrink-0" />
                  <span>{formatDate(b.event_date)}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <span className="text-xs font-extrabold text-primary">
                    {formatCurrency(b.proposed_price)}
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">
                    ID: {b.id.slice(0, 8)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      {selectedBookingId && (
        <BookingDetailsDialog
          bookingId={selectedBookingId}
          isOpen={!!selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
          onRefresh={onRefresh}
          role={role}
        />
      )}
    </div>
  );
}
