"use client";

import { Button } from "@/components/ui/button";
import { BookingRequestDetail } from "@/types/booking";
import { formatCurrency } from "@/utils/format-currency";
import { format } from "date-fns";
import { ArrowRight, CalendarClock, Eye } from "lucide-react";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { useRouter } from "next/navigation";

interface BookingHistoryTableProps {
  bookings: BookingRequestDetail[];
  onViewDetails: (booking: BookingRequestDetail) => void;
  role: "client" | "artist" | "venue";
}

export function BookingHistoryTable({ bookings, onViewDetails, role }: BookingHistoryTableProps) {
  const router = useRouter();
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-bg-card/30 border border-dashed border-border/80 rounded-2xl">
        <CalendarClock className="h-10 w-10 text-text-muted mb-3" />
        <p className="text-sm font-bold text-text-primary mb-1">No bookings found</p>
        <p className="text-xs text-text-secondary max-w-xs">
          There are no booking requests matching the active filter selections.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border/60 text-text-muted uppercase font-bold tracking-wider">
            <th className="p-4">Event Details</th>
            <th className="p-4">Date & Time</th>
            {role === "client" ? (
              <th className="p-4">Provider Info</th>
            ) : (
              <th className="p-4">Client Info</th>
            )}
            <th className="p-4">Budget (INR)</th>
            <th className="p-4">Status</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40 text-text-secondary">
          {bookings.map((b) => (
            <tr key={b.id} className="hover:bg-bg-elevated/20 transition-colors">
              <td className="p-4">
                <div className="space-y-0.5">
                  <p className="font-extrabold text-text-primary text-sm tracking-tight">
                    {b.event_title}
                  </p>
                  <p className="text-[10px] text-primary font-semibold uppercase">{b.event_type}</p>
                </div>
              </td>

              <td className="p-4">
                <div className="space-y-0.5 text-text-primary">
                  <p className="font-semibold">{format(new Date(b.event_date), "PP")}</p>
                  <p className="text-[10px] text-text-muted">
                    {b.start_time} - {b.end_time} ({b.duration} hrs)
                  </p>
                </div>
              </td>

              <td className="p-4">
                {role === "client" ? (
                  <div className="space-y-0.5">
                    <p className="font-semibold text-text-primary text-sm tracking-tight truncate max-w-[200px]">
                      {b.artist_name || b.venue_name || (b.venue_id ? "Venue Space" : "Artist Performer")}
                    </p>
                    <p className="text-[10px] text-text-muted">{b.venue_id ? "Venue Space Booking" : "Artist Booking"}</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <p className="font-medium text-text-primary">{b.client.name}</p>
                    <p className="text-[10px] text-text-muted truncate max-w-37.5">
                      {b.client.email}
                    </p>
                  </div>
                )}
              </td>

              <td className="p-4 font-bold text-text-primary">{formatCurrency(b.proposed_price)}</td>

              <td className="p-4">
                <BookingStatusBadge status={b.status} />
              </td>

              <td className="p-4 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (role === "client") {
                      router.push(`/client/bookings/${b.id}`);
                    } else {
                      onViewDetails(b);
                    }
                  }}
                  className="font-bold text-[10px] h-8 px-2 flex items-center gap-1 hover:text-text-primary cursor-pointer ml-auto"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Details</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
