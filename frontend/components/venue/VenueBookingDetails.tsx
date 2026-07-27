"use client";

import * as React from "react";
import { BookingRequestDetail } from "@/types/booking";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Mail, 
  CheckCircle,
  XCircle,
  FileText,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";

interface VenueBookingDetailsProps {
  booking: BookingRequestDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (bookingId: string) => Promise<void>;
  onReject: (bookingId: string) => Promise<void>;
  onComplete: (bookingId: string) => Promise<void>;
  onCancel: (bookingId: string) => Promise<void>;
}

export function VenueBookingDetails({
  booking,
  isOpen,
  onClose,
  onAccept,
  onReject,
  onComplete,
  onCancel
}: VenueBookingDetailsProps) {
  const [submitting, setSubmitting] = React.useState(false);

  if (!booking) return null;

  const handleAction = async (actionFn: (id: string) => Promise<void>) => {
    setSubmitting(true);
    try {
      await actionFn(booking.id);
      onClose();
    } catch {
      // errors handled by service/caller
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/25">Pending Action</Badge>;
      case "accepted":
        return <Badge className="bg-primary/10 text-primary border border-primary/25">Accepted / Confirmed</Badge>;
      case "rejected":
        return <Badge className="bg-error/10 text-error border border-error/25">Rejected</Badge>;
      case "cancelled":
        return <Badge className="bg-zinc-500/10 text-zinc-400 border border-zinc-500/25">Cancelled</Badge>;
      case "completed":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">Completed</Badge>;
      default:
        return <Badge className="bg-zinc-500/10 text-zinc-400 border border-zinc-500/25">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-bg-card border border-border/85 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[85vh] text-text-primary">
        
        <DialogHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-lg font-bold text-text-primary tracking-tight">
              Reservation #{(booking.id || "").substring(0, 8).toUpperCase()}
            </DialogTitle>
            {getStatusBadge(booking.status)}
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="space-y-6 py-4">
          
          {/* Event Details Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Event Information
            </h4>
            <div className="p-4 border border-border/60 bg-bg-elevated/10 rounded-2xl space-y-3">
              <p className="text-sm font-bold text-text-primary leading-snug">{booking.event_name}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-text-secondary pt-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-text-muted" />
                  <span>{format(new Date(booking.event_date), "do MMMM, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-text-muted" />
                  <span>{booking.start_time} - {booking.end_time}</span>
                </div>
                <div className="flex items-start gap-2 sm:col-span-2">
                  <MapPin className="h-3.5 w-3.5 text-text-muted mt-0.5" />
                  <span className="leading-relaxed">{booking.location}</span>
                </div>
              </div>

              {booking.notes && (
                <div className="mt-3 pt-3 border-t border-border/30 text-xs text-text-secondary leading-relaxed bg-bg-card/40 p-2.5 rounded-lg border border-border/50">
                  <span className="font-bold text-text-primary block mb-0.5">Special Instructions:</span>
                  {booking.notes}
                </div>
              )}
            </div>
          </div>

          {/* Client Details Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              Client Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 border border-border/60 bg-bg-elevated/10 rounded-2xl text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-text-muted">Contact Name</span>
                <p className="font-bold text-text-primary">{booking.client.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-text-muted">Email Address</span>
                <p className="font-bold text-text-primary flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-text-muted" />
                  {booking.client.email}
                </p>
              </div>
            </div>
          </div>

          {/* Price Quote */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              Proposed Quote
            </h4>
            <div className="p-4 border border-border/60 bg-primary/5 rounded-2xl flex items-center justify-between">
              <span className="text-xs text-text-secondary">Total Rental Price (Excl. Tax)</span>
              <span className="text-base font-black text-primary">
                ₹{Number(booking.proposed_price).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Timeline Tracking Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Resolution Log Timeline
            </h4>
            <div className="relative pl-4 border-l border-border/70 space-y-4 text-xs">
              {booking.timeline?.map((step, idx) => (
                <div key={idx} className="relative">
                  <span className={`absolute -left-[21px] top-0.5 rounded-full p-0.5 border ${
                    step.status === "accepted" ? "bg-primary border-primary/20 text-white" :
                    step.status === "rejected" || step.status === "cancelled" ? "bg-error border-error/20 text-white" :
                    step.status === "completed" ? "bg-emerald-500 border-emerald-500/20 text-white" :
                    "bg-amber-500 border-amber-500/20 text-white"
                  }`}>
                    {step.status === "accepted" ? <CheckCircle className="h-2 w-2" /> :
                     step.status === "completed" ? <CheckCircle className="h-2 w-2" /> :
                     step.status === "rejected" || step.status === "cancelled" ? <XCircle className="h-2 w-2" /> :
                     <Clock className="h-2 w-2" />}
                  </span>
                  <div className="space-y-0.5">
                    <p className="font-bold text-text-primary capitalize leading-none">{step.status}</p>
                    <p className="text-[10px] text-text-muted">
                      {format(new Date(step.timestamp), "MMM d, yyyy HH:mm")} — by {step.by}
                    </p>
                    <p className="text-[10px] text-text-secondary pt-0.5 leading-relaxed">{step.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Action Panel Footer */}
        <DialogFooter className="border-t border-border/40 pt-4 flex sm:items-center sm:justify-end gap-2.5">
          {booking.status === "pending" && (
            <>
              <Button
                variant="outline"
                onClick={() => handleAction(onReject)}
                disabled={submitting}
                className="text-error border-error/25 hover:bg-error/5 h-9.5 text-xs font-bold w-full sm:w-auto"
              >
                Reject Request
              </Button>
              <Button
                onClick={() => handleAction(onAccept)}
                disabled={submitting}
                className="bg-primary hover:bg-primary/95 text-white h-9.5 text-xs font-bold w-full sm:w-auto"
              >
                Accept Reservation
              </Button>
            </>
          )}

          {booking.status === "accepted" && (
            <>
              <Button
                variant="outline"
                onClick={() => handleAction(onCancel)}
                disabled={submitting}
                className="text-error border-error/25 hover:bg-error/5 h-9.5 text-xs font-bold w-full sm:w-auto"
              >
                Cancel Booking
              </Button>
              <Button
                onClick={() => handleAction(onComplete)}
                disabled={submitting}
                className="bg-emerald-500 hover:bg-emerald-600 text-white h-9.5 text-xs font-bold w-full sm:w-auto"
              >
                Mark as Completed
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary h-9.5 text-xs font-semibold w-full sm:w-auto"
          >
            Close Viewer
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
