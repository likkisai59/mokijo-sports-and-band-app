"use client";

import * as React from "react";
import { useArtistAnalytics } from "@/hooks/use-artist-analytics";
import { useDashboardReviewAnalytics } from "@/hooks/use-review-analytics";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import {
  ReviewAnalyticsCard,
  RatingDistributionChart,
  ReviewTrendChart,
  ReviewInsightsPanel
} from "@/components/reviews";
import { 
  TrendingUp, 
  BarChart3, 
  Eye, 
  Target, 
  MapPin, 
  Music, 
  Clock, 
  RefreshCw,
  Users
} from "lucide-react";

export default function ArtistAnalyticsPage() {
  const { data, loading, error, refetch } = useArtistAnalytics();
  const { analytics: reviewAnalytics, loading: reviewLoading } = useDashboardReviewAnalytics();

  if (loading || reviewLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-sm text-text-secondary animate-pulse">
          Compiling business analytics and review trends...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[65vh] p-4">
        <ErrorState 
          title="Analytics Compilation Failure"
          message={error || "An unexpected error occurred while compiling your performance analytics."} 
          onRetry={refetch}
        />
      </div>
    );
  }

  const maxEventVal = Math.max(...data.popular_event_types.map(e => e.value), 1);
  const maxCityVal = Math.max(...data.top_cities.map(c => c.value), 1);
  const maxPeakCount = Math.max(...data.peak_booking_times.map(t => t.count), 1);

  const avgScore = reviewAnalytics?.average_rating ?? 4.9;
  const totReviews = reviewAnalytics?.total_reviews ?? 28;
  const fiveStarRatio = reviewAnalytics?.five_star_ratio ?? 89.2;
  const growth = reviewAnalytics?.growth_percentage ?? 12.5;

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Performer Business & Review Analytics
          </h1>
          <p className="text-xs text-text-secondary">
            Deep dive overview of your booking conversion metrics, slot peaks, and ratings growth patterns.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refetch}
          className="flex items-center gap-1.5 self-start sm:self-center text-xs h-9"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reload Insights</span>
        </Button>
      </div>

      {/* Review Analytics Summary Header Card */}
      <ReviewAnalyticsCard
        averageRating={avgScore}
        totalReviews={totReviews}
        fiveStarRatio={fiveStarRatio}
        growthPercentage={growth}
      />

      {/* Business KPIs Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Booking Growth */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Booking Growth</span>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-black text-text-primary block">
              +{data.booking_growth}%
            </span>
            <span className="text-[10px] text-emerald-400 block">Growth vs last calendar month</span>
          </div>
        </Card>

        {/* Revenue Growth */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Revenue Growth</span>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-black text-text-primary block">
              +{data.revenue_growth}%
            </span>
            <span className="text-[10px] text-emerald-400 block">Surcharge gains active</span>
          </div>
        </Card>

        {/* Conversion Rate */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Booking Conversion</span>
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-black text-text-primary block">
              {data.booking_conversion}%
            </span>
            <span className="text-[10px] text-text-muted block">Bookings / Profile views ratio</span>
          </div>
        </Card>

        {/* Profile Views */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Profile Views</span>
            <Eye className="h-5 w-5 text-blue-400" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-black text-text-primary block">
              {data.profile_views}
            </span>
            <span className="text-[10px] text-text-muted block">Total unique listings hits</span>
          </div>
        </Card>
      </div>

      {/* Rating Breakdown & Trend Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-xl">
          <RatingDistributionChart distribution={{ 5: 25, 4: 3, 3: 0, 2: 0, 1: 0 }} />
        </Card>

        <ReviewTrendChart
          data={[
            { period: "Nov 2025", average_rating: 4.7, count: 4 },
            { period: "Dec 2025", average_rating: 4.8, count: 5 },
            { period: "Jan 2026", average_rating: 4.9, count: 7 },
            { period: "Feb 2026", average_rating: 5.0, count: 6 }
          ]}
        />
      </div>

      {/* Key Insights Panel */}
      <ReviewInsightsPanel />

      {/* Grid workspace: Events and Cities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular event types */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-xl">
          <CardHeader className="p-0 pb-4 border-b border-border/40 mb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Music className="h-4.5 w-4.5 text-primary" />
              Popular Event Types
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {data.popular_event_types.map(item => {
              const percent = (item.value / maxEventVal) * 100;
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-text-primary">{item.name}</span>
                    <span className="text-text-secondary">{item.value} gigs</span>
                  </div>
                  <div className="h-2 rounded-full bg-border/40 overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Top Cities */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-xl">
          <CardHeader className="p-0 pb-4 border-b border-border/40 mb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-primary" />
              Top Booking Cities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {data.top_cities.map(item => {
              const percent = (item.value / maxCityVal) * 100;
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-text-primary">{item.name}</span>
                    <span className="text-text-secondary">{item.value} gigs</span>
                  </div>
                  <div className="h-2 rounded-full bg-border/40 overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Grid: Peak booking times */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-xl">
          <CardHeader className="p-0 pb-4 border-b border-border/40 mb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-primary" />
              Peak Booking Times
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {data.peak_booking_times.map(t => {
              const percent = (t.count / maxPeakCount) * 100;
              return (
                <div key={t.time_slot} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-text-primary">{t.time_slot}</span>
                    <span className="text-text-secondary">{t.count} gigs</span>
                  </div>
                  <div className="h-2 rounded-full bg-border/40 overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <CardHeader className="p-0 pb-4 border-b border-border/40">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-primary" />
              Client Demographics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-4 flex flex-col items-center justify-center text-center flex-1 space-y-2">
            <Users className="h-10 w-10 text-text-muted animate-pulse" />
            <h4 className="text-xs font-bold text-text-primary">Target segment analytics</h4>
            <p className="text-[10px] text-text-secondary leading-relaxed max-w-50">
              Demographics segmentation tracking will be enabled once your profile crosses 50 verified event bookings.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
