"use client";
import { BookingWorkspace } from "@/components/bookings/workspace/BookingWorkspace";
export default function VenueBookingsWorkspacePage() {
  return <BookingWorkspace role="venue_owner" basePath="/band/venue/bookings" />;
}
