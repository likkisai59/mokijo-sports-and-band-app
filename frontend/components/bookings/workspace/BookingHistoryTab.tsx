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
  History,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

interface BookingHistoryTabProps {
  role: "client" | "artist" | "venue" | "admin";
  bookings: BookingRequestDetail[];
  loading: boolean;
  onRefresh: () => void;
}

type HistoryFilter = "all" | "completed" | "cancelled" | "expired";

export function BookingHistoryTab({
  role,
  bookings,
  loading,
  onRefresh,
}: BookingHistoryTabProps) {
  const [filter, setFilter] = React.useState<HistoryFilter>("all");
  const [search, setSearch] = React.useState("");
  const [selectedBookingId, setSelectedBookingId] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const limit = 12;

  // Filter historical status items (completed, cancelled, expired)
  const historyBookings = React.useMemo(() => {
    return bookings.filter((b) =>
      ["completed", "cancelled", "expired"].includes(b.status.toLowerCase())
    );
  }, [bookings]);

  const filteredBookings = React.useMemo(() => {
    return historyBookings.filter((b) => {
      const st = b.status.toLowerCase();
      let matchesFilter = true;
      if (filter === "completed") matchesFilter = st === "completed";
      else if (filter === "cancelled") matchesFilter = st === "cancelled";
      else if (filter === "expired") matchesFilter = st === "expired";

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.event_name.toLowerCase().includes(q) ||
        (b.client?.name && b.client.name.toLowerCase().includes(q)) ||
        (b.artist?.display_name && b.artist.display_name.toLowerCase().includes(q)) ||
        (b.artist_name && b.artist_name.toLowerCase().includes(q)) ||
        b.id.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [historyBookings, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / limit));
  const paginatedBookings = React.useMemo(() => {
    const start = (page - 1) * limit;
    return filteredBookings.slice(start, start + limit);
  }, [filteredBookings, page, limit]);

  const counts = React.useMemo(() => {
    return {
      all: historyBookings.length,
      completed: historyBookings.filter((b) => b.status.toLowerCase() === "completed").length,
      cancelled: historyBookings.filter((b) => b.status.toLowerCase() === "cancelled").length,
      expired: historyBookings.filter((b) => b.status.toLowerCase() === "expired").length,
    };
  }, [historyBookings]);

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-bg-card/40 p-2 rounded-xl border border-border/60">
        <div className="flex flex-wrap items-center gap-1">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => { setFilter("all"); setPage(1); }}
            className="text-xs h-8 font-bold gap-1.5"
          >
            <History className="h-3.5 w-3.5" />
            <span>All History</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {counts.all}
            </Badge>
          </Button>

          <Button
            variant={filter === "completed" ? "default" : "ghost"}
            size="sm"
            onClick={() => { setFilter("completed"); setPage(1); }}
            className="text-xs h-8 font-bold gap-1.5"
          >
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>Completed</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {counts.completed}
            </Badge>
          </Button>

          <Button
            variant={filter === "cancelled" ? "default" : "ghost"}
            size="sm"
            onClick={() => { setFilter("cancelled"); setPage(1); }}
            className="text-xs h-8 font-bold gap-1.5"
          >
            <XCircle className="h-3.5 w-3.5 text-red-400" />
            <span>Cancelled</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {counts.cancelled}
            </Badge>
          </Button>

          <Button
            variant={filter === "expired" ? "default" : "ghost"}
            size="sm"
            onClick={() => { setFilter("expired"); setPage(1); }}
            className="text-xs h-8 font-bold gap-1.5"
          >
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>Expired</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {counts.expired}
            </Badge>
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted" />
          <Input
            placeholder="Search history records..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 text-xs h-8 bg-bg-card border-border/80"
          />
        </div>
      </div>

      {/* History Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-xs text-text-secondary animate-pulse">Loading booking history...</p>
        </div>
      ) : paginatedBookings.length === 0 ? (
        <Card className="bg-bg-card/30 border-border/40 p-8 text-center">
          <History className="h-8 w-8 mx-auto mb-2 text-text-muted opacity-50" />
          <h3 className="text-xs font-bold text-text-primary mb-1">No history records</h3>
          <p className="text-[11px] text-text-secondary">
            No completed, cancelled, or expired bookings match your filter query.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedBookings.map((b) => (
            <Card
              key={b.id}
              onClick={() => setSelectedBookingId(b.id)}
              className="bg-bg-card/45 hover:bg-bg-card border border-border/70 hover:border-primary/50 transition-all cursor-pointer shadow-sm"
            >
              <CardHeader className="p-4 pb-2 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-xs font-bold text-text-primary line-clamp-1">
                    {b.event_name}
                  </CardTitle>
                  <BookingStatusBadge status={b.status} />
                </div>
                <div className="text-[11px] text-text-secondary flex items-center gap-1">
                  <User className="h-3 w-3 text-primary shrink-0" />
                  <span>
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

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-text-secondary">
          <span>
            Page {page} of {totalPages} ({filteredBookings.length} items)
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
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
