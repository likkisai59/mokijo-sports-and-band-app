import { redirect } from "next/navigation";

export default function VenueCalendarRedirectPage() {
  redirect("/venue/bookings?tab=calendar");
}
