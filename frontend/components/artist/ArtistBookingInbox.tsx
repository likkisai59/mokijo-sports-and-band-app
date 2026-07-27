"use client";

import * as React from "react";
import { useArtistBookings } from "@/hooks/use-artist-bookings";
import { BookingRequestDetail } from "@/types/booking";
import { bookingService } from "@/services/bookingService";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { 
  Search,
  Filter, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Mail, 
  FileText,
  X, 
  Check, 
  TrendingUp,
  History
} from "lucide-react";

import { formatCurrency } from "@/utils/format-currency";
import { format } from "date-fns";
import toast from "react-hot-toast";

export function ArtistBookingInbox() {
  const {
    bookings,
    total,
    loading,
    error,
    status,
    setStatus,
    search,
    setSearch,
    page,
    setPage,
    limit,
    refetch
  } = useArtistBookings();

  // Active details drawer request
  const [selectedBooking, setSelectedBooking] = React.useState<BookingRequestDetail | null>(null);
  const [counterValue, setCounterValue] = React.useState<string>("");
  const [counterMsg, setCounterMsg] = React.useState<string>("");
  const [showCounterBox, setShowCounterBox] = React.useState(false);
  const [actioning, setActioning] = React.useState(false);

  // Cancellation confirm states
  const [cancelOpen, setCancelOpen] = React.useState<boolean>(false);
  const [cancelReason, setCancelReason] = React.useState<string>("");
  const [reasonError, setReasonError] = React.useState<string | null>(null);

  const totalPages = Math.ceil(total / limit);

  const selectBooking = async (b: BookingRequestDetail) => {
    setSelectedBooking(b);
    setShowCounterBox(false);
    setCounterValue("");
    setCounterMsg("");
    // Re-fetch detail to get full timeline
    try {
      const detail = await bookingService.getBookingDetails(b.id);
      setSelectedBooking(detail);
    } catch {}
  };

  const handleAccept = async (id: string) => {
    setActioning(true);
    try {
      const res = await bookingService.acceptBooking(id);
      setSelectedBooking(res);
      refetch();
      toast.success("Booking request accepted!");
    } catch {
      toast.error("Failed to accept booking.");
    } finally {
      setActioning(false);
    }
  };

  const handleReject = async (id: string) => {
    setActioning(true);
    try {
      const res = await bookingService.rejectBooking(id);
      setSelectedBooking(res);
      refetch();
      toast.success("Booking request rejected.");
    } catch {
      toast.error("Failed to reject booking.");
    } finally {
      setActioning(false);
    }
  };

  const handleCounter = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    const rate = Number(counterValue);
    if (!rate || rate <= 0) {
      toast.error("Please enter a valid counter rate.");
      return;
    }

    setActioning(true);
    try {
      const res = await bookingService.counterOffer(id, rate, counterMsg);
      setSelectedBooking(res);
      refetch();
      setShowCounterBox(false);
      setCounterValue("");
      setCounterMsg("");
      toast.success("Counter offer submitted!");
    } catch {
      toast.error("Failed to submit counter offer.");
    } finally {
      setActioning(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (cancelReason.trim().length < 10) {
      setReasonError("Please provide a reason of at least 10 characters.");
      return;
    }
    setReasonError(null);
    setActioning(true);
    try {
      const res = await bookingService.cancelBooking(id, cancelReason);
      setSelectedBooking(res);
      refetch();
      setCancelOpen(false);
      setCancelReason("");
      toast.success("Booking request cancelled.");
    } catch {
      toast.error("Failed to cancel booking.");
    } finally {
      setActioning(false);
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">Pending</Badge>;
      case "accepted":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">Accepted</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px]">Rejected</Badge>;
      case "counter_offered":
        return <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">Countered</Badge>;
      case "cancelled":
        return <Badge className="bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 text-[10px]">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{s}</Badge>;
    }
  };

  if (error) {
    return <ErrorState title="Error loading bookings" message={error} onRetry={refetch} />;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* List Table Workspace */}
      <div className="xl:col-span-2 space-y-4">
        {/* Filters */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 max-w-sm flex-1">
            <Search className="h-4.5 w-4.5 text-text-muted shrink-0" />
            <Input
              placeholder="Search by client or event..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 text-xs text-text-primary"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" />
            <select
              value={status}
              onChange={e => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-lg border border-border bg-bg-card text-text-primary text-xs"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="counter_offered">Countered</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </Card>

        {/* Requests Table */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl overflow-hidden shadow-xl">
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center gap-2 justify-center">
                <Spinner className="h-8 w-8 text-primary" />
                <span className="text-xs text-text-secondary">Retrieving requests list...</span>
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-20 text-center text-xs text-text-muted italic">
                No booking requests match your search criteria.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/50 bg-bg-elevated/20 text-text-muted font-bold uppercase tracking-wider">
                    <th className="p-4">Event & Client</th>
                    <th className="p-4">Date & Slot</th>
                    <th className="p-4">Offer Rate</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {bookings.map(b => (
                    <tr 
                      key={b.id} 
                      onClick={() => selectBooking(b)}
                      className={`hover:bg-bg-elevated/10 cursor-pointer transition-colors ${selectedBooking?.id === b.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                    >
                      <td className="p-4">
                        <div className="font-extrabold text-text-primary">{b.event_name}</div>
                        <div className="text-[10px] text-text-secondary flex items-center gap-1 mt-0.5">
                          <User className="h-3 w-3" /> {b.client.name}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-text-primary">
                        <div>{format(new Date(b.event_date), "dd MMM yyyy")}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">{b.start_time} - {b.end_time}</div>
                      </td>
                      <td className="p-4 font-black text-text-primary">
                        {b.counter_price ? (
                          <div className="space-y-0.5">
                            <span className="text-primary">{formatCurrency(b.counter_price)}</span>
                            <div className="text-[9px] text-text-muted line-through font-normal">{formatCurrency(b.proposed_price)}</div>
                          </div>
                        ) : (
                          formatCurrency(b.proposed_price)
                        )}
                      </td>
                      <td className="p-4">{getStatusBadge(b.status)}</td>
                      <td className="p-4 text-right">
                        <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold">
                          View details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-text-muted">Showing {bookings.length} of {total} items</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="h-8"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="h-8"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Details drawer Panel */}
      <div className="xl:col-span-1">
        {selectedBooking ? (
          <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl overflow-hidden sticky top-6">
            <CardHeader className="pb-3 border-b border-border/50 flex flex-row justify-between items-center bg-bg-elevated/10">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary">
                Request Console
              </CardTitle>
              <button 
                onClick={() => setSelectedBooking(null)}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <CardContent className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* Event detail cards */}
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="text-base font-black text-text-primary">{selectedBooking.event_name}</h4>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <div className="space-y-2 text-xs text-text-secondary">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-text-muted" />
                    <span>{format(new Date(selectedBooking.event_date), "EEEE, dd MMMM yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-text-muted" />
                    <span>{selectedBooking.start_time} - {selectedBooking.end_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-text-muted" />
                    <span className="truncate">{selectedBooking.location}</span>
                  </div>
                </div>
              </div>

              {/* Client Card info */}
              <div className="p-3.5 border border-border/60 bg-bg-elevated/10 rounded-xl space-y-2 text-xs">
                <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Host Information</span>
                <div className="flex items-center gap-2 font-bold text-text-primary">
                  <User className="h-4 w-4 text-primary" />
                  <span>{selectedBooking.client.name}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <Mail className="h-4 w-4 text-text-muted" />
                  <span className="truncate">{selectedBooking.client.email}</span>
                </div>
              </div>

              {/* Proposed rates */}
              <div className="flex items-center justify-between border-y border-border/40 py-3.5 text-xs">
                <div>
                  <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Proposed rate</span>
                  <span className="text-lg font-black text-text-primary">{formatCurrency(selectedBooking.proposed_price)}</span>
                </div>
                {selectedBooking.counter_price && (
                  <div className="text-right">
                    <span className="text-[10px] text-primary uppercase font-bold tracking-wider block">Your counter offer</span>
                    <span className="text-lg font-black text-primary">{formatCurrency(selectedBooking.counter_price)}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <div className="space-y-1 text-xs">
                  <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block"><FileText className="h-3 w-3 mr-1 inline" /> Host Notes</span>
                  <p className="text-text-secondary leading-relaxed bg-bg-elevated/5 border border-border/50 p-2.5 rounded-lg">
                    {selectedBooking.notes}
                  </p>
                </div>
              )}

              {/* Action operations buttons */}
              {selectedBooking.status === "pending" && !showCounterBox && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    disabled={actioning}
                    onClick={() => handleAccept(selectedBooking.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 flex items-center justify-center gap-1.5"
                  >
                    <Check className="h-4 w-4" /> Accept
                  </Button>
                  <Button
                    disabled={actioning}
                    onClick={() => handleReject(selectedBooking.id)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold h-10 flex items-center justify-center gap-1.5"
                  >
                    <X className="h-4 w-4" /> Reject
                  </Button>
                  <Button
                    disabled={actioning}
                    onClick={() => setShowCounterBox(true)}
                    variant="outline"
                    className="col-span-2 border-primary text-primary hover:bg-primary/5 font-bold h-10 flex items-center justify-center gap-1.5"
                  >
                    <TrendingUp className="h-4 w-4" /> Negotiate / Counter Offer
                  </Button>
                </div>
              )}

              {/* Counter offer form */}
              {showCounterBox && (
                <form onSubmit={(e) => handleCounter(e, selectedBooking.id)} className="space-y-3 p-3.5 border border-primary/20 bg-primary/5 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-text-primary flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-primary" /> Counter Price negotiation</span>
                    <button type="button" onClick={() => setShowCounterBox(false)} className="text-text-muted hover:text-text-primary">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="counter_price_input">Counter Price (Rate)</Label>
                    <Input
                      id="counter_price_input"
                      type="number"
                      required
                      placeholder="Enter price..."
                      value={counterValue}
                      onChange={e => setCounterValue(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="counter_msg_input">Message note (Optional)</Label>
                    <Input
                      id="counter_msg_input"
                      placeholder="Add terms, specs..."
                      value={counterMsg}
                      onChange={e => setCounterMsg(e.target.value)}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={actioning}
                    className="w-full bg-primary hover:bg-primary/95 text-white h-9 font-bold"
                  >
                    Submit Counter Offer
                  </Button>
                </form>
              )}

              {/* Cancel actions */}
              {(selectedBooking.status === "pending" || selectedBooking.status === "counter_offered" || selectedBooking.status === "accepted") && (
                <Button
                  disabled={actioning}
                  onClick={() => setCancelOpen(true)}
                  variant="ghost"
                  className="w-full text-error hover:text-red-400 hover:bg-red-500/5 text-xs h-9 font-bold"
                >
                  Cancel Request
                </Button>
              )}

              {/* TIMELINE LIST */}
              <div className="space-y-3 pt-3 border-t border-border/40">
                <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider flex items-center gap-1.5"><History className="h-4 w-4" /> Booking Timeline Log</span>
                <div className="space-y-4 pl-3 relative border-l border-border/50 mt-2">
                  {selectedBooking.timeline?.map((evt, idx) => (
                    <div key={idx} className="relative text-[11px] leading-relaxed">
                      {/* Timeline dot */}
                      <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-bg-card" />
                      <div className="flex justify-between items-center text-[10px] text-text-muted">
                        <span className="font-bold capitalize text-text-primary">By {evt.by}</span>
                        <span>{format(new Date(evt.timestamp), "dd MMM HH:mm")}</span>
                      </div>
                      <p className="text-text-secondary mt-0.5">{evt.message}</p>
                    </div>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>
        ) : (
          <div className="py-20 text-center text-xs text-text-muted italic border border-dashed border-border/60 rounded-2xl">
            Select a request item from the table list to open the negotiation console.
          </div>
        )}
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="bg-bg-card border border-border/80 max-w-md text-text-primary">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black tracking-tight text-text-primary">
              Cancel Booking Request?
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary mt-1">
              Please provide a cancellation reason. This action is permanent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 my-4">
            <Label htmlFor="cancel_reason_artist" className="text-xs font-bold text-text-primary">
              Cancellation Reason
            </Label>
            <textarea
              id="cancel_reason_artist"
              placeholder="Provide reason here..."
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
              Keep Request
            </Button>
            <Button
              disabled={actioning}
              onClick={() => {
                if (selectedBooking) {
                  handleCancel(selectedBooking.id);
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold"
            >
              {actioning ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
