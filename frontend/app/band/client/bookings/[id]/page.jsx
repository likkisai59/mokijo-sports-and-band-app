"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { bandBookingService } from "@/services/bandBookingService";
import { BookingDetailsDialog } from "@/components/bookings/BookingDetailsDialog";

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadBooking(id);
    }
  }, [id]);

  const loadBooking = async (bookingId) => {
    try {
      setLoading(true);
      const data = await bandBookingService.getBookingDetails(bookingId);
      setBooking(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Go back to the bookings list
    router.push("/band/client/bookings");
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-text-muted text-sm animate-pulse">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
        <p className="text-sm font-bold text-text-primary mb-1">Booking not found</p>
        <p className="text-xs text-text-secondary mb-4">
          The booking you requested does not exist or you do not have permission to view it.
        </p>
        <button onClick={handleClose} className="text-primary hover:underline text-xs font-bold">
          Return to Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto mt-10">
      <h1 className="text-2xl font-black text-text-primary mb-6 uppercase tracking-tight">Booking Details</h1>
      {/* Reusing the dialog content component directly inline */}
      <div className="bg-bg-card rounded-2xl border border-border shadow-xl overflow-hidden p-6">
        <BookingDetailsDialog 
          booking={booking} 
          isOpen={true} 
          onClose={handleClose} 
          role="client" 
          isPageMode={true} 
        />
      </div>
    </div>
  );
}
