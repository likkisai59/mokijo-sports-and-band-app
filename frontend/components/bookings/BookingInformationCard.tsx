"use client";

import { Card } from "@/components/ui/card";
import { BookingRequestDetail } from "@/types/booking";
import { Building2, Heart, MapPin, MessageSquare, ShieldCheck, Users } from "lucide-react";

interface BookingInformationCardProps {
  booking: BookingRequestDetail;
  className?: string;
}

export function BookingInformationCard({ booking, className }: BookingInformationCardProps) {
  return (
    <Card
      className={`bg-bg-card border border-border/80 rounded-2xl shadow-md p-6 space-y-6 ${className || ""}`}
    >
      {/* Target Party Information */}
      {(booking.artist_profile_id || booking.venue_id) && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
            Booking Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {booking.artist_profile_id && (
              <div className="flex items-center gap-3 bg-bg-elevated/40 border border-border/60 p-3 rounded-xl">
                <Heart className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-[10px] text-text-muted">Performer ID</p>
                  <p className="text-xs font-bold text-text-primary truncate max-w-45">
                    {booking.artist_profile_id}
                  </p>
                </div>
              </div>
            )}

            {booking.venue_id && (
              <div className="flex items-center gap-3 bg-bg-elevated/40 border border-border/60 p-3 rounded-xl">
                <Building2 className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-[10px] text-text-muted">Venue Space ID</p>
                  <p className="text-xs font-bold text-text-primary truncate max-w-45">
                    {booking.venue_id}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guest count & location */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Event Logistics</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Users className="h-4.5 w-4.5 text-text-secondary mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-text-muted">Guest Attendance</p>
              <p className="text-xs font-bold text-text-primary">{booking.guest_count} guests expected</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-4.5 w-4.5 text-text-secondary mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-text-muted">Event Venue</p>
              <p className="text-xs font-bold text-text-primary">{booking.location}</p>
              <p className="text-[10px] text-text-secondary leading-normal mt-0.5">
                {booking.address}, {booking.city}, {booking.state}, {booking.country}
              </p>
              {booking.google_maps_coords && (
                <a
                  href={booking.google_maps_coords}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-[9px] text-primary hover:underline font-semibold mt-1"
                >
                  View on Google Maps &rarr;
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Special Requests and Notes */}
      {(booking.special_requests || booking.notes) && (
        <div className="space-y-4 pt-4 border-t border-border/50">
          {booking.special_requests && (
            <div className="space-y-1">
              <span className="text-[10px] text-text-muted flex items-center gap-1 font-bold">
                <ShieldCheck className="h-3.5 w-3.5" />
                SPECIAL REQUIREMENTS
              </span>
              <p className="text-xs text-text-secondary bg-bg-elevated/40 border border-border/50 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">
                {booking.special_requests}
              </p>
            </div>
          )}

          {booking.notes && (
            <div className="space-y-1">
              <span className="text-[10px] text-text-muted flex items-center gap-1 font-bold">
                <MessageSquare className="h-3.5 w-3.5" />
                HOST NOTE
              </span>
              <p className="text-xs text-text-secondary bg-bg-elevated/40 border border-border/50 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">
                {booking.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
