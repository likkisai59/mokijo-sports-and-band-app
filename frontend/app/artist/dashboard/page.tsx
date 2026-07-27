"use client";

import * as React from "react";
import { useArtistDashboard } from "@/hooks/use-artist-dashboard";
import { StatsCards } from "@/components/artist/dashboard/StatsCards";
import { UpcomingEventsWidget } from "@/components/artist/dashboard/UpcomingEventsWidget";
import { BookingRequestsWidget } from "@/components/artist/dashboard/BookingRequestsWidget";
import { ReviewsWidget } from "@/components/artist/dashboard/ReviewsWidget";
import { RevenueChartWidget } from "@/components/artist/dashboard/RevenueChartWidget";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { RefreshCw, CircleDot } from "lucide-react";

/**
 * Artist Home — lightweight overview page.
 *
 * Changes from previous version:
 *  - Removed QuickActionsWidget (belongs in Bookings sidebar navigation)
 *  - Removed NotificationsWidget / Inbox widget (Inbox already in Sidebar nav)
 *  - StatsCards reduced to 4 metrics: Upcoming, Monthly Revenue, Rating, Views
 *  - Revenue chart bug fixed (empty-array guard)
 *  - Booking statistics (Total, Pending) moved to Bookings page
 */
export default function ArtistDashboardPage() {
  const { data, loading, error, refetch } = useArtistDashboard();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-sm text-text-secondary animate-pulse">
          Loading your home overview...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[65vh] p-4">
        <ErrorState 
          title="Home Overview Load Failure"
          message={error || "An unexpected error occurred while loading your home overview."} 
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
            Home
          </h1>
          <p className="text-xs text-text-secondary">
            Your BandConnect home — overview of your performance metrics, upcoming gigs, and recent reviews.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refetch}
          className="flex items-center gap-1.5 self-start sm:self-center text-xs h-9"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* 4 Lightweight Stat Cards */}
      <StatsCards stats={data} />

      {/* Revenue Chart + Profile Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChartWidget data={data.revenue_chart} />
        </div>
        <div className="space-y-6">
          {/* Profile Completion Card */}
          <div className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between h-full">
            <div className="space-y-2">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
                Profile Completion
              </span>
              <h3 className="text-lg font-extrabold text-text-primary">
                Complete your setup to receive gigs!
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Add profile images, pricing details, availability hours, and instruments to stand out to event hosts.
              </p>
            </div>

            <div className="py-4 flex items-center justify-center relative">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="45"
                  className="stroke-border/40"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="45"
                  className="stroke-primary transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={2 * Math.PI * 45 * (1 - data.profile_completion / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xl font-extrabold text-text-primary">
                {data.profile_completion}%
              </span>
            </div>

            <div className="text-xs text-text-muted flex items-center gap-1.5 justify-center">
              <CircleDot className="h-3.5 w-3.5 text-primary" />
              <span>Higher score = better listing rank.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Incoming Gigs + Recent Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingEventsWidget events={data.upcoming_events} />
        <BookingRequestsWidget requests={data.recent_booking_requests} />
      </div>

      {/* Reviews */}
      <ReviewsWidget reviews={data.recent_reviews} />
    </div>
  );
}
