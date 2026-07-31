import { redirect } from "next/navigation";

export default function ArtistCalendarRedirectPage() {
  redirect("/artist/bookings?tab=calendar");
}
