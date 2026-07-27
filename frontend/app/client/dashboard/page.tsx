"use client";

import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { bookingService } from "@/services/bookingService";
import {
  CalendarRange,
  Heart,
  Music,
  Building2,
  ArrowRight,
  User,
  Sparkles,
  CheckCircle2,
  CalendarCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

/**
 * Client Home — role landing page after login.
 *
 * Changes:
 *  - Added "My Bookings" summary card (Total, Upcoming, Completed) using live API
 *  - Added "Find Venues" quick action card linking to /venues
 *  - Improved contrast and spacing
 *  - Booking management remains at /client/bookings
 */
export default function ClientDashboardPage() {
  const { user } = useAuth();

  // Lightweight booking summary — fetches only counts using the existing API
  const [bookingSummary, setBookingSummary] = React.useState<{
    total: number;
    upcoming: number;
    completed: number;
  } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchSummary() {
      try {
        // Fetch in parallel: total count, accepted/confirmed (upcoming), completed
        const [all, accepted, completed] = await Promise.all([
          bookingService.getClientBookings({ limit: 1 }),
          bookingService.getClientBookings({ status: "accepted", limit: 1 }),
          bookingService.getClientBookings({ status: "completed", limit: 1 }),
        ]);
        if (!cancelled) {
          setBookingSummary({
            total: all.total ?? 0,
            upcoming: accepted.total ?? 0,
            completed: completed.total ?? 0,
          });
        }
      } catch {
        // Non-critical — summary is decorative; fail silently
        if (!cancelled) setBookingSummary({ total: 0, upcoming: 0, completed: 0 });
      }
    }
    fetchSummary();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
            Home
          </h1>
          <p className="text-xs text-text-secondary">
            Welcome back{user?.name ? `, ${user.name}` : ""}! Discover artists, manage your bookings, and find amazing venues.
          </p>
        </div>
      </div>

      {/* My Bookings Summary Card */}
      <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-primary" />
            My Bookings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-3 gap-4">
            {/* Total */}
            <div className="flex flex-col items-center gap-1.5 p-3 bg-bg-elevated/30 border border-border/50 rounded-xl">
              <span className="text-2xl font-black text-text-primary">
                {bookingSummary !== null ? bookingSummary.total : "—"}
              </span>
              <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                Total
              </span>
            </div>

            {/* Upcoming */}
            <div className="flex flex-col items-center gap-1.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <CalendarCheck2 className="h-4 w-4 text-emerald-400 mb-0.5" />
              <span className="text-2xl font-black text-text-primary">
                {bookingSummary !== null ? bookingSummary.upcoming : "—"}
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                Upcoming
              </span>
            </div>

            {/* Completed */}
            <div className="flex flex-col items-center gap-1.5 p-3 bg-primary/10 border border-primary/20 rounded-xl">
              <CheckCircle2 className="h-4 w-4 text-primary mb-0.5" />
              <span className="text-2xl font-black text-text-primary">
                {bookingSummary !== null ? bookingSummary.completed : "—"}
              </span>
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                Completed
              </span>
            </div>
          </div>

          <div className="mt-4">
            <Link href="/client/bookings">
              <Button variant="outline" size="sm" className="text-xs w-full font-bold h-9">
                View All Bookings
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-bold text-text-primary mb-3 uppercase tracking-wider">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl group hover:border-primary/50 transition-colors">
            <Link href="/client/bookings">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <CalendarRange className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary">My Bookings</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Manage your event requests
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors shrink-0" />
              </CardContent>
            </Link>
          </Card>

          <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl group hover:border-primary/50 transition-colors">
            <Link href="/artists">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-secondary/10 rounded-xl group-hover:bg-secondary/20 transition-colors">
                  <Music className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary">Find Artist</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Discover performers for your event
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-secondary transition-colors shrink-0" />
              </CardContent>
            </Link>
          </Card>

          <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl group hover:border-primary/50 transition-colors">
            <Link href="/venues">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                  <Building2 className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary">Find Venues</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Browse event spaces near you
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-emerald-400 transition-colors shrink-0" />
              </CardContent>
            </Link>
          </Card>

          <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl group hover:border-primary/50 transition-colors">
            <Link href="/client/favorites">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-pink-500/10 rounded-xl group-hover:bg-pink-500/20 transition-colors">
                  <Heart className="h-6 w-6 text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary">Favourites</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Your saved artists and venues
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-pink-400 transition-colors shrink-0" />
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>

      {/* Account Overview + Getting Started */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-text-secondary">Name</span>
              <span className="text-xs font-bold text-text-primary">
                {user?.name || "—"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-text-secondary">Email</span>
              <span className="text-xs font-bold text-text-primary truncate max-w-[180px]">
                {user?.email || "—"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-text-secondary">Account Type</span>
              <span className="text-xs font-bold text-text-primary capitalize">
                {user?.role || "Client"}
              </span>
            </div>
            <div className="pt-2">
              <Link href="/client/settings">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs w-full font-bold"
                >
                  Edit Profile Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {[
              {
                step: "1",
                label: "Browse artists in the marketplace",
                href: "/artists",
              },
              {
                step: "2",
                label: "Find a venue for your event",
                href: "/venues",
              },
              {
                step: "3",
                label: "Create a booking request",
                href: "/client/bookings",
              },
              {
                step: "4",
                label: "Complete your profile",
                href: "/client/settings",
              },
            ].map((item) => {
              return (
                <Link
                  key={item.step}
                  href={item.href}
                  className="flex items-center gap-3 hover:text-text-primary transition-colors group"
                >
                  <span className="h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                    {item.step}
                  </span>
                  <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors flex-1">
                    {item.label}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-text-muted ml-auto group-hover:text-primary transition-colors" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
