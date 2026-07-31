"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { bookingService } from "@/services/bookingService";
import { BookingRequestDetail } from "@/types/booking";
import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { BookingTimeline } from "@/components/bookings/BookingTimeline";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  MessageSquare,
  Send,
  Trash2,
  Building2,
  Music,
  Star,
  Receipt
} from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/utils/format-currency";
import toast from "react-hot-toast";

export default function ClientBookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = React.useState<BookingRequestDetail | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actioning, setActioning] = React.useState<boolean>(false);

  // Cancellation states
  const [cancelOpen, setCancelOpen] = React.useState<boolean>(false);
  const [cancelReason, setCancelReason] = React.useState<string>("");
  const [reasonError, setReasonError] = React.useState<string | null>(null);

  // Note/comment thread input
  const [newComment, setNewComment] = React.useState<string>("");

  const fetchDetails = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingService.getBookingDetails(bookingId);
      setBooking(data);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to load booking details.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  React.useEffect(() => {
    if (bookingId) {
      fetchDetails();
    }
  }, [bookingId, fetchDetails]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !booking) return;

    setActioning(true);
    try {
      await bookingService.addBookingNote(booking.id, newComment.trim());
      setNewComment("");
      toast.success("Comment added.");
      const updated = await bookingService.getBookingDetails(booking.id);
      setBooking(updated);
    } catch {
      toast.error("Failed to add comment.");
    } finally {
      setActioning(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    if (cancelReason.trim().length < 10) {
      setReasonError("Please provide a cancellation reason at least 10 characters long.");
      return;
    }
    setReasonError(null);
    setActioning(true);
    try {
      let res: BookingRequestDetail;
      if (booking.venue_id) {
        res = await bookingService.cancelVenueBooking(booking.id, cancelReason);
      } else {
        res = await bookingService.cancelBooking(booking.id, cancelReason);
      }
      toast.success("Booking request cancelled successfully.");
      setBooking(res);
      setCancelOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to cancel booking.";
      toast.error(msg);
    } finally {
      setActioning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-xs text-text-secondary animate-pulse">
          Retrieving booking logistics...
        </p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container mx-auto py-10 px-4">
        <ErrorState
          title="Logistics query failed"
          message={error || "Booking not found."}
          onRetry={fetchDetails}
        />
      </div>
    );
  }

  const canCancel = ["pending", "under_review", "negotiation", "accepted", "confirmed"].includes(booking.status);

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/client/bookings")}
          className="h-8 w-8 p-0 hover:bg-bg-elevated/40 text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <nav className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
          <Link href="/client/dashboard" className="hover:text-text-primary transition-colors">
            Dashboard
          </Link>
          <span className="text-text-muted">›</span>
          <Link href="/client/bookings" className="hover:text-text-primary transition-colors">
            Bookings
          </Link>
          <span className="text-text-muted">›</span>
          <span className="text-text-primary">Details</span>
        </nav>
      </div>

      {/* Top Banner Card */}
      <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl overflow-hidden">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
              {booking.venue_id ? "Venue Reservation" : "Band Booking"}
            </span>
            <h1 className="text-2xl font-black text-text-primary tracking-tight font-heading leading-tight">
              {booking.event_name}
            </h1>
            <p className="text-xs text-text-secondary flex items-center gap-1.5 font-medium">
              <Calendar className="h-3.5 w-3.5 text-text-muted" />
              <span>Event Date:</span>
              <span className="font-bold text-text-primary">{format(new Date(booking.event_date), "PP")}</span>
              <span className="text-text-muted">|</span>
              <Clock className="h-3.5 w-3.5 text-text-muted" />
              <span className="font-bold text-text-primary">
                {booking.start_time} - {booking.end_time} ({booking.duration || 0} hrs)
              </span>
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <BookingStatusBadge status={booking.status} />
              <span className="text-[10px] text-text-muted font-mono font-semibold">
                ID: {booking.id.slice(0, 8)}
              </span>
            </div>
            <p className="text-sm font-black text-text-primary">
              Budget: <span className="text-primary">{formatCurrency(booking.proposed_price)}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Page Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Booking details details details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performer / Venue details card */}
          <Card className="bg-bg-card/45 border border-border/80 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-tight flex items-center gap-2 pb-2 border-b border-border/30">
              {booking.venue_id ? (
                <>
                  <Building2 className="h-4.5 w-4.5 text-primary" />
                  Venue Information
                </>
              ) : (
                <>
                  <Music className="h-4.5 w-4.5 text-primary" />
                  Performer Information
                </>
              )}
            </h3>

            {booking.venue_id && booking.venue ? (
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="text-base font-extrabold text-text-primary">{booking.venue.name}</h4>
                    <p className="text-xs text-text-secondary mt-0.5">{booking.venue.address}</p>
                  </div>
                  <span className="text-xs font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-xl">
                    Capacity: {booking.venue.capacity}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 rounded-xl border border-border bg-bg-primary/20">
                    <span className="block text-[10px] text-text-muted">Base Rate:</span>
                    <span className="text-xs font-extrabold text-text-primary">{formatCurrency(booking.venue.base_price)}</span>
                  </div>
                </div>
              </div>
            ) : !booking.venue_id && booking.artist ? (
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="text-base font-extrabold text-text-primary">{booking.artist.display_name}</h4>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">{booking.artist.bio || "No biography provided."}</p>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
                    <Star className="h-3.5 w-3.5 fill-amber-500" />
                    <span className="text-xs">{booking.artist.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 rounded-xl border border-border bg-bg-primary/20">
                    <span className="block text-[10px] text-text-muted">Base Rate:</span>
                    <span className="text-xs font-extrabold text-text-primary">{formatCurrency(booking.artist.base_rate)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-secondary italic">Logistics provider profile details not available.</p>
            )}
          </Card>

          {/* Event Logistics card */}
          <Card className="bg-bg-card/45 border border-border/80 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-tight flex items-center gap-2 pb-2 border-b border-border/30">
              <MapPin className="h-4.5 w-4.5 text-primary" />
              Event Logistics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <Users className="h-4.5 w-4.5 text-text-muted mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-text-muted">Expected Attendance</span>
                    <span className="text-xs font-bold text-text-primary">{booking.guest_count || "N/A"} guests</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4.5 w-4.5 text-text-muted mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-text-muted">Location</span>
                    <span className="text-xs font-bold text-text-primary">{booking.location}</span>
                    <span className="block text-[10px] text-text-secondary mt-0.5">
                      {[booking.address, booking.city, booking.state, booking.country].filter(Boolean).join(", ")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {booking.special_requests && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-text-muted flex items-center gap-1 font-bold">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      SPECIAL REQUESTS
                    </span>
                    <p className="text-xs text-text-secondary bg-bg-primary/40 border border-border rounded-xl p-3 leading-relaxed">
                      {booking.special_requests}
                    </p>
                  </div>
                )}

                {booking.notes && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-text-muted flex items-center gap-1 font-bold">
                      <MessageSquare className="h-3.5 w-3.5 text-primary" />
                      CLIENT NOTE
                    </span>
                    <p className="text-xs text-text-secondary bg-bg-primary/40 border border-border rounded-xl p-3 leading-relaxed">
                      {booking.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Payment Summary */}
          <Card className="bg-bg-card/45 border border-border/80 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-tight flex items-center gap-2 pb-2 border-b border-border/30">
              <Receipt className="h-4.5 w-4.5 text-primary" />
              Escrow Payment Summary
            </h3>

            <div className="p-4 rounded-xl border border-border/60 bg-bg-primary/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-xs font-extrabold text-text-primary">
                  Order amount: <span className="text-primary">{formatCurrency(booking.counter_price || booking.proposed_price)}</span>
                </p>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  Commission: 10% platform service fee included.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`font-semibold text-[10px] border ${
                    booking.status === "confirmed" || booking.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  }`}
                >
                  {booking.status === "confirmed" || booking.status === "completed" ? "CAPTURED (Escrow Active)" : "PENDING (Awaiting confirmation)"}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Timeline & Cancellation */}
        <div className="space-y-6">
          {/* Action Trigger Block */}
          {canCancel && (
            <Card className="bg-bg-card/45 border border-border/80 rounded-2xl p-6 shadow-xl">
              <div className="space-y-3">
                <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">Management Actions</h4>
                <p className="text-[11px] text-text-secondary">
                  If the performer or venue has not yet completed the reservation, you can cancel this request.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setCancelOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 font-bold h-9 text-xs cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  Cancel Event Booking
                </Button>
              </div>
            </Card>
          )}

          {/* Timeline Tracking */}
          <Card className="bg-bg-card/45 border border-border/80 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-tight pb-2 border-b border-border/30">
              Booking Timeline
            </h3>

            <BookingTimeline events={booking.timeline as any} />
          </Card>

          {/* Add Message form */}
          <Card className="bg-bg-card/45 border border-border/80 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-text-primary">Add Note to Thread</h4>
            <form onSubmit={handleAddComment} className="flex gap-2">
              <Input
                placeholder="Type comment message..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="h-9 text-xs text-text-primary bg-bg-primary/50 border-border/60"
              />
              <Button
                type="submit"
                disabled={actioning || !newComment.trim()}
                className="h-9 w-9 p-0 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Cancellation Confirmation Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="bg-bg-card border border-border/80 max-w-md text-text-primary">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black tracking-tight text-text-primary">
              <Trash2 className="h-5 w-5 text-red-500" />
              Cancel Booking Request?
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary mt-1">
              This action is permanent. Please provide a reason for cancelling this event reservation request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 my-4">
            <Label htmlFor="cancel_reason" className="text-xs font-bold text-text-primary">
              Cancellation Rationale
            </Label>
            <textarea
              id="cancel_reason"
              placeholder="e.g. Event venue scheduling conflict or budget changes..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-lg border border-border bg-bg-primary/50 text-xs font-semibold focus-visible:ring-primary focus-visible:outline-none resize-none"
            />
            {reasonError && (
              <p className="text-[10px] font-bold text-red-500 animate-pulse">{reasonError}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              disabled={actioning}
              onClick={() => {
                setCancelOpen(false);
                setReasonError(null);
              }}
              className="border-border/60 hover:bg-bg-elevated/20 text-xs font-bold"
            >
              No, Keep Booking
            </Button>
            <Button
              disabled={actioning}
              onClick={handleCancelBooking}
              className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold"
            >
              {actioning ? "Cancelling Request..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
