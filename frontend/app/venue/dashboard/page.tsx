"use client";

import * as React from "react";
import { useVenueDashboard } from "@/hooks/use-venue-dashboard";
import { CalendarWidget } from "@/components/venue/dashboard/CalendarWidget";
import { RecentActivityWidget } from "@/components/venue/dashboard/RecentActivityWidget";
import { PerformanceWidget } from "@/components/venue/dashboard/PerformanceWidget";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { RefreshCw, CircleDot, Building2, ArrowRight, Calendar, Star } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

/**
 * Venue Home — lightweight overview page.
 *
 * Changes from previous version:
 *  - Removed StatsCards (booking counts belong in /venue/bookings)
 *  - Removed RevenueChartWidget (revenue detail belongs in /venue/earnings)
 *  - Removed QuickActionsWidget (actions available in sidebar navigation)
 *  - Kept: Welcome, Profile Completion, Today's Schedule (CalendarWidget),
 *           Venue Insights (PerformanceWidget), Recent Activity
 */
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
          title="Home Overview Load Failure"
          message={error || "An unexpected error occurred while loading your venue home."} 
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
            Home
          </h1>
          <p className="text-xs text-text-secondary">
            Welcome back{user?.name ? `, ${user.name}` : ""}! Here&apos;s your venue at a glance.
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

      {/* Quick Navigation Row — links to Bookings and Earnings modules */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl group hover:border-primary/50 transition-colors">
          <Link href="/venue/bookings">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-primary">Manage Bookings</p>
                <p className="text-xs text-text-secondary mt-0.5">View requests &amp; calendar</p>
              </div>
              <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors shrink-0" />
            </CardContent>
          </Link>
        </Card>

        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl group hover:border-primary/50 transition-colors">
          <Link href="/venue/earnings">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                <Building2 className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-primary">Payments &amp; Earnings</p>
                <p className="text-xs text-text-secondary mt-0.5">Track your venue revenue</p>
              </div>
              <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-emerald-400 transition-colors shrink-0" />
            </CardContent>
          </Link>
        </Card>

        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl group hover:border-primary/50 transition-colors">
          <Link href="/venue/reviews">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-xl group-hover:bg-yellow-500/20 transition-colors">
                <Star className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-primary">Reviews &amp; Ratings</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Avg: {data.average_rating != null ? `${data.average_rating} / 5` : "—"}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-yellow-400 transition-colors shrink-0" />
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Today's Schedule + Profile Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CalendarWidget overview={data.calendar_overview} />
        </div>
        <div>
          {/* Profile Completion Card */}
          <div className="bg-bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between h-full min-h-[300px]">
            <div className="space-y-2">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
                Profile Completion
              </span>
              <h3 className="text-lg font-extrabold text-text-primary">
                Complete your listings to start booking!
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Add detailed descriptions, addresses, capacity, and documents to get verified.
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
              <span>Higher score = better rank in search results.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Venue Insights + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceWidget performance={data.performance} />
        <RecentActivityWidget activity={data.recent_activity} />
      </div>
    </div>
  );
}
