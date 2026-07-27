"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bookingService } from "@/services/bookingService";
import { BookingRequestFormData, bookingRequestSchema } from "@/utils/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Clock, IndianRupee, MapPin, Send, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface BookingRequestFormProps {
  artistProfileId?: string;
  venueId?: string;
  artistName?: string;
  venueName?: string;
  proposedPrice?: number;
  onSuccess?: (bookingId: string) => void;
  onCancel?: () => void;
}

export function BookingRequestForm({
  artistProfileId,
  venueId,
  artistName,
  venueName,
  proposedPrice,
  onSuccess,
  onCancel,
}: BookingRequestFormProps) {
  const [summary, setSummary] = useState<string>("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingRequestFormData>({
    resolver: zodResolver(bookingRequestSchema),
    defaultValues: {
      artist_profile_id: artistProfileId || null,
      venue_id: venueId || null,
      event_title: "",
      event_type: "Wedding",
      event_date: "",
      start_time: "18:00",
      end_time: "22:00",
      guest_count: 50,
      proposed_price: proposedPrice || 15000,
      location: venueName || "",
      address: "",
      city: "",
      state: "",
      country: "India",
      google_maps_coords: "",
      special_requests: "",
      notes: "",
    },
  });

  const watchedValues = watch();

  const summaryText = useMemo(() => {
    const title = watchedValues.event_title?.trim() || "your event";
    const date = watchedValues.event_date || "a selected date";
    const timeRange =
      watchedValues.start_time && watchedValues.end_time
        ? `${watchedValues.start_time} - ${watchedValues.end_time}`
        : "a scheduled time";
    const location = watchedValues.location?.trim() || "the requested venue";
    return `Requesting ${title} for ${date} at ${timeRange} in ${location}.`;
  }, [
    watchedValues.event_title,
    watchedValues.event_date,
    watchedValues.start_time,
    watchedValues.end_time,
    watchedValues.location,
  ]);

  useEffect(() => {
    setSummary(summaryText);
  }, [summaryText]);

  const onSubmit = async (data: BookingRequestFormData) => {
    try {
      // Compose a human-readable location string from address parts
      const locationParts = [
        data.location?.trim(),
        data.address?.trim(),
        data.city?.trim(),
        data.state?.trim(),
        data.country?.trim(),
      ].filter(Boolean);
      const composedLocation = locationParts.join(", ") || "Location not specified";

      // Map frontend field names to backend API contract
      const apiPayload: Record<string, unknown> = {
        artist_profile_id: artistProfileId || null,
        venue_id: venueId || null,
        // Backend expects event_name, not event_title
        event_name: data.event_title,
        event_date: data.event_date,
        start_time: data.start_time,
        end_time: data.end_time,
        location: composedLocation,
        // Ensure numeric types — valueAsNumber already guarantees this at RHF layer
        proposed_price: Number(data.proposed_price),
        notes: [
          data.special_requests?.trim() ? `Special requests: ${data.special_requests.trim()}` : "",
          data.notes?.trim() || "",
        ]
          .filter(Boolean)
          .join("\n") || null,
      };

      const res = await bookingService.createBooking(apiPayload);
      toast.success("Booking request submitted successfully!");
      if (onSuccess) onSuccess(res.id);
    } catch (err) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = error.response?.data?.error?.message || "Failed to submit booking request.";
      toast.error(msg);
    }
  };

  return (
    <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl w-full max-w-2xl mx-auto overflow-hidden">
      <CardHeader className="border-b border-border/60 bg-bg-card/30 p-6">
        <CardTitle className="text-xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Create Booking Request
        </CardTitle>
        <p className="text-xs text-text-secondary mt-1">
          {artistName && venueName
            ? `Submit inquiry for ${artistName} at ${venueName}`
            : artistName
              ? `Submit booking inquiry for performer ${artistName}`
              : venueName
                ? `Request a reservation for ${venueName}`
                : "Hire performers or spaces for live gig entertainment"}
        </p>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: Event Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
              Event Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="event_title">Event Title</Label>
                <div className="relative">
                  <Input
                    id="event_title"
                    placeholder="e.g. Annual Tech Summit Afterparty"
                    className="text-text-primary text-xs bg-bg-card border-border/80"
                    {...register("event_title")}
                  />
                </div>
                {errors.event_title && (
                  <p className="text-xs text-error font-medium">{errors.event_title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="event_type">Event Type</Label>
                <select
                  id="event_type"
                  className="w-full h-9 rounded-lg border border-border/80 bg-bg-card text-text-primary text-xs px-3 focus:outline-none focus:ring-1 focus:ring-primary"
                  {...register("event_type")}
                >
                  <option value="Wedding">Wedding Celebration</option>
                  <option value="Corporate Gig">Corporate Event</option>
                  <option value="Private Event">Private Party</option>
                  <option value="Concert">Public Concert</option>
                  <option value="Festival">Festival Gig</option>
                  <option value="Club Performance">Club/Pub Event</option>
                  <option value="Other">Other Occasion</option>
                </select>
                {errors.event_type && (
                  <p className="text-xs text-error font-medium">{errors.event_type.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="event_date" className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-text-muted" />
                  <span>Date</span>
                </Label>
                <Input
                  id="event_date"
                  type="date"
                  className="text-text-primary text-xs bg-bg-card border-border/80"
                  {...register("event_date")}
                />
                {errors.event_date && (
                  <p className="text-xs text-error font-medium">{errors.event_date.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="start_time" className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-text-muted" />
                  <span>Start Time</span>
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  className="text-text-primary text-xs bg-bg-card border-border/80"
                  {...register("start_time")}
                />
                {errors.start_time && (
                  <p className="text-xs text-error font-medium">{errors.start_time.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="end_time" className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-text-muted" />
                  <span>End Time</span>
                </Label>
                <Input
                  id="end_time"
                  type="time"
                  className="text-text-primary text-xs bg-bg-card border-border/80"
                  {...register("end_time")}
                />
                {errors.end_time && (
                  <p className="text-xs text-error font-medium">{errors.end_time.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="guest_count" className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-text-muted" />
                  <span>Expected Guests</span>
                </Label>
                <Input
                  id="guest_count"
                  type="number"
                  placeholder="50"
                  className="text-text-primary text-xs bg-bg-card border-border/80"
                  {...register("guest_count", { valueAsNumber: true })}
                />
                {errors.guest_count && (
                  <p className="text-xs text-error font-medium">{errors.guest_count.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proposed_price" className="flex items-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5 text-text-muted" />
                  <span>Proposed Budget (INR)</span>
                </Label>
                <Input
                  id="proposed_price"
                  type="number"
                  placeholder="15000"
                  className="text-text-primary text-xs bg-bg-card border-border/80"
                  {...register("proposed_price", { valueAsNumber: true })}
                />
                {errors.proposed_price && (
                  <p className="text-xs text-error font-medium">{errors.proposed_price.message}</p>
                )}
              </div>

            </div>
          </div>

          {/* Section 2: Location Details */}
          <div className="space-y-4 pt-4 border-t border-border/60">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
              Location details
            </h3>

            <div className="space-y-1.5">
              <Label htmlFor="location" className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-text-muted" />
                <span>Venue Name / Location Description</span>
              </Label>
              <Input
                id="location"
                placeholder="e.g. Taj West End, Grand Ballroom"
                className="text-text-primary text-xs bg-bg-card border-border/80"
                {...register("location")}
              />
              {errors.location && (
                <p className="text-xs text-error font-medium">{errors.location.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                placeholder="e.g. 25 Race Course Road"
                className="text-text-primary text-xs bg-bg-card border-border/80"
                {...register("address")}
              />
              {errors.address && (
                <p className="text-xs text-error font-medium">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Bangalore"
                  className="text-text-primary text-xs bg-bg-card border-border/80"
                  {...register("city")}
                />
                {errors.city && (
                  <p className="text-xs text-error font-medium">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="Karnataka"
                  className="text-text-primary text-xs bg-bg-card border-border/80"
                  {...register("state")}
                />
                {errors.state && (
                  <p className="text-xs text-error font-medium">{errors.state.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  className="text-text-primary text-xs bg-bg-card border-border/80"
                  {...register("country")}
                />
                {errors.country && (
                  <p className="text-xs text-error font-medium">{errors.country.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="google_maps_coords">Google Maps URL or Coordinates (Optional)</Label>
              <Input
                id="google_maps_coords"
                placeholder="e.g. https://maps.google.com/?q=..."
                className="text-text-primary text-xs bg-bg-card border-border/80"
                {...register("google_maps_coords")}
              />
            </div>
          </div>

          {/* Section 3: Notes & Special Requests */}
          <div className="space-y-4 pt-4 border-t border-border/60">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
              Notes & Special Instructions
            </h3>

            <div className="rounded-xl border border-border/70 bg-bg-elevated/70 p-3">
              <p className="text-[11px] font-medium text-text-secondary">Request preview</p>
              <p className="mt-1 text-sm text-text-primary">{summary}</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="special_requests">Special Equipment / Performance Requests</Label>
              <textarea
                id="special_requests"
                rows={2}
                placeholder="e.g. Wireless microphones requested, custom sound check required, specific song choice etc."
                className="w-full rounded-lg border border-border/80 bg-bg-card text-text-primary text-xs p-3 focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                {...register("special_requests")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Introductory Note for Artist / Venue</Label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Share more context about the event crowd, musical preference, layout, or timeline scheduling."
                className="w-full rounded-lg border border-border/80 bg-bg-card text-text-primary text-xs p-3 focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                {...register("notes")}
              />
            </div>
          </div>

          {/* Action triggers */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="font-bold text-xs h-9 px-4 cursor-pointer"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="font-bold text-xs h-9 px-5 flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span>Submitting request...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit Booking Request</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
