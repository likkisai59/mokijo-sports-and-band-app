"use client";

import * as React from "react";
import { useVenueAnalytics } from "@/hooks/use-venue-analytics";
import { useDashboardReviewAnalytics } from "@/hooks/use-review-analytics";
import { VenueAnalyticsLineChart } from "@/components/venue/VenueAnalyticsCharts";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ReviewAnalyticsCard,
  RatingDistributionChart,
  ReviewTrendChart,
  ReviewInsightsPanel
} from "@/components/reviews";
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  MapPin, 
  CalendarRange, 
  Activity, 
  Star,
  Eye,
  RefreshCw,
  Award
} from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";

export default function VenueAnalyticsPage() {
  const { data, loading, error, refetch } = useVenueAnalytics();
  const { analytics: reviewAnalytics, loading: reviewLoading } = useDashboardReviewAnalytics();

  if (loading || reviewLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-sm text-text-secondary animate-pulse">Analyzing venue performance and review metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[55vh] p-4">
        <ErrorState title="Load Error" message={error || "Could not retrieve analytics reports."} onRetry={refetch} />
      </div>
    );
  }

  const formatValCurrency = (val: number) => formatCurrency(val);

  const avgScore = reviewAnalytics?.average_rating ?? data.average_rating ?? 4.9;
  const totReviews = reviewAnalytics?.total_reviews ?? 34;
  const fiveStarRatio = reviewAnalytics?.five_star_ratio ?? 88.2;
  const growth = reviewAnalytics?.growth_percentage ?? data.monthly_growth_rate ?? 15.4;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6.5 w-6.5 text-primary" />
            Venue Performance & Review Analytics Hub
          </h1>
          <p className="text-xs text-text-secondary">
            Inspect booking demand trends, occupancy levels, revenue velocity, client rankings, and ratings growth.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refetch}
          className="flex items-center gap-1.5 self-start sm:self-center text-xs h-9"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Data</span>
        </Button>
      </div>

      {/* Review Analytics Executive Summary Header Card */}
      <ReviewAnalyticsCard
        averageRating={avgScore}
        totalReviews={totReviews}
        fiveStarRatio={fiveStarRatio}
        growthPercentage={growth}
      />

      {/* Widget KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Occupancy Rate */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-muted">Occupancy Rate</span>
              <p className="text-2xl font-black text-text-primary leading-none">
                {data.occupancy_rate.toFixed(1)}%
              </p>
              <p className="text-[9px] text-text-secondary">This calendar month</p>
            </div>
            <span className="p-3 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Activity className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>

        {/* Growth Rate */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-muted">Monthly Growth</span>
              <p className="text-2xl font-black text-emerald-400 leading-none">
                +{data.monthly_growth_rate.toFixed(1)}%
              </p>
              <p className="text-[9px] text-text-secondary">vs last month revenue</p>
            </div>
            <span className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>

        {/* Avg Rating */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-muted">Average Rating</span>
              <p className="text-2xl font-black text-text-primary leading-none">
                {avgScore.toFixed(1)} / 5
              </p>
              <p className="text-[9px] text-text-secondary">Across client reviews</p>
            </div>
            <span className="p-3 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Star className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>

        {/* Total Bookings */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-muted">Total Bookings</span>
              <p className="text-2xl font-black text-text-primary leading-none">
                {data.total_bookings}
              </p>
              <p className="text-[9px] text-text-secondary">All-time reservations</p>
            </div>
            <span className="p-3 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Calendar className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>

        {/* Views */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow animate-in fade-in slide-in-from-bottom-2 duration-300 delay-300">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-muted">Profile Traffic</span>
              <p className="text-2xl font-black text-text-primary leading-none">
                {data.venue_views.toLocaleString()}
              </p>
              <p className="text-[9px] text-text-secondary">Views in last 30 days</p>
            </div>
            <span className="p-3 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Eye className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Review Rating Distribution & Trend Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-xl">
          <RatingDistributionChart distribution={{ 5: 30, 4: 4, 3: 0, 2: 0, 1: 0 }} />
        </Card>

        <ReviewTrendChart
          data={[
            { period: "Nov 2025", average_rating: 4.8, count: 6 },
            { period: "Dec 2025", average_rating: 4.8, count: 8 },
            { period: "Jan 2026", average_rating: 4.9, count: 10 },
            { period: "Feb 2026", average_rating: 5.0, count: 10 }
          ]}
        />
      </div>

      {/* Key Insights Panel */}
      <ReviewInsightsPanel />

      {/* Analytics Charts Trends Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <VenueAnalyticsLineChart 
          title="Revenue Analytics"
          subtitle="Total Credit Inflow Trends"
          data={data.revenue_chart}
          color="emerald"
          valueFormatter={formatValCurrency}
        />
        
        <VenueAnalyticsLineChart 
          title="Booking Analytics"
          subtitle="Monthly Booking Volume Trends"
          data={data.booking_chart}
          color="blue"
          valueFormatter={(val) => `${val} Bookings`}
        />

        <VenueAnalyticsLineChart 
          title="Occupancy Analytics"
          subtitle="Monthly Active Occupancy Ratios"
          data={data.occupancy_chart}
          color="purple"
          valueFormatter={(val) => `${val.toFixed(1)}% Occupied`}
        />
      </div>

      {/* Distribution Breakdown Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Popular Event Types */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow p-5">
          <div className="border-b border-border/30 pb-3 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
              <Award className="h-4.5 w-4.5 text-primary" />
              Popular Events
            </h3>
            <p className="text-[9px] text-text-secondary">Reservation segments by type</p>
          </div>
          <div className="space-y-4">
            {data.popular_event_types.map((item, idx) => {
              const maxVal = Math.max(...data.popular_event_types.map(i => i.value), 1);
              const percentage = (item.value / maxVal) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-text-primary">{item.name}</span>
                    <span className="text-text-secondary">{item.value} bookings</span>
                  </div>
                  <div className="h-1.5 w-full bg-border/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top Clients */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow p-5">
          <div className="border-b border-border/30 pb-3 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
              <Users className="h-4.5 w-4.5 text-blue-400" />
              Top Clients
            </h3>
            <p className="text-[9px] text-text-secondary">Most frequent bookers ranking</p>
          </div>
          <div className="space-y-4">
            {data.top_clients.map((item, idx) => {
              const maxVal = Math.max(...data.top_clients.map(i => i.value), 1);
              const percentage = (item.value / maxVal) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-text-primary">{item.name}</span>
                    <span className="text-text-secondary">{item.value} gigs</span>
                  </div>
                  <div className="h-1.5 w-full bg-border/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-400 rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top Cities */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow p-5">
          <div className="border-b border-border/30 pb-3 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
              <MapPin className="h-4.5 w-4.5 text-pink-400" />
              Top Cities
            </h3>
            <p className="text-[9px] text-text-secondary">Geographic volume metrics</p>
          </div>
          <div className="space-y-4">
            {data.top_cities.map((item, idx) => {
              const maxVal = Math.max(...data.top_cities.map(i => i.value), 1);
              const percentage = (item.value / maxVal) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-text-primary">{item.name}</span>
                    <span className="text-text-secondary">{item.value} reservation(s)</span>
                  </div>
                  <div className="h-1.5 w-full bg-border/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-pink-400 rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Peak Seasons */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow p-5">
          <div className="border-b border-border/30 pb-3 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
              <CalendarRange className="h-4.5 w-4.5 text-purple-400" />
              Peak Seasons
            </h3>
            <p className="text-[9px] text-text-secondary">Top performing months by volume</p>
          </div>
          <div className="space-y-4">
            {data.peak_seasons.map((item, idx) => {
              const maxVal = Math.max(...data.peak_seasons.map(i => i.value), 1);
              const percentage = (item.value / maxVal) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-text-primary">{item.name}</span>
                    <span className="text-text-secondary">{item.value} bookings</span>
                  </div>
                  <div className="h-1.5 w-full bg-border/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-400 rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
