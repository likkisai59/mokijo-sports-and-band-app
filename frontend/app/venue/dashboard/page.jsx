"use client";

import * as React from "react";
import { useVenueDashboard } from "@/hooks/use-venue-dashboard";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

import { StatsCards } from "@/components/venue/dashboard/StatsCards";
import { RevenueChartWidget } from "@/components/venue/dashboard/RevenueChartWidget";
import { BookingRequestsWidget } from "@/components/venue/dashboard/BookingRequestsWidget";
import { CalendarWidget } from "@/components/venue/dashboard/CalendarWidget";
import { NotificationsWidget } from "@/components/venue/dashboard/NotificationsWidget";
import { PerformanceWidget } from "@/components/venue/dashboard/PerformanceWidget";
import { QuickActionsWidget } from "@/components/venue/dashboard/QuickActionsWidget";
import { RecentActivityWidget } from "@/components/venue/dashboard/RecentActivityWidget";
import { ReviewsWidget } from "@/components/venue/dashboard/ReviewsWidget";
import { UpcomingEventsWidget } from "@/components/venue/dashboard/UpcomingEventsWidget";

export default function VenueDashboardPage() {
  const { data, loading, error, refetch } = useVenueDashboard();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-sm text-text-secondary animate-pulse">
          Loading venue home...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[65vh] p-4">
        <ErrorState 
          title="Dashboard Load Failure"
          message={error || "An unexpected error occurred while loading your venue dashboard."} 
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="vd-page-title">Home</h1>
          <p className="vd-page-sub">
            Welcome back{user?.name ? `, ${user.name}` : ""}! Here&apos;s your venue at a glance.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refetch}
          className="flex items-center gap-1.5 self-start sm:self-center text-xs h-9 bg-[#ffffff0a] hover:bg-[#ffffff1a] border-border/80"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      <StatsCards stats={data} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <RevenueChartWidget data={data.revenue_chart} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UpcomingEventsWidget events={data.upcoming_events} />
            <BookingRequestsWidget requests={data.pending_requests} />
          </div>
          <CalendarWidget overview={data.calendar_overview} />
        </div>
        
        <div className="space-y-6">
          <QuickActionsWidget />
          <NotificationsWidget notifications={data.notifications} />
          <RecentActivityWidget activity={data.recent_activity} />
          <PerformanceWidget performance={data.performance} />
          <ReviewsWidget reviews={data.latest_reviews} />
        </div>
      </div>
    </div>
  );
}
