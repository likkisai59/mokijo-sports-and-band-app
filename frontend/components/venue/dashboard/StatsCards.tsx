"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Calendar, 
  Clock, 
  CheckSquare, 
  TrendingUp, 
  DollarSign, 
  Star, 
  CheckCircle, 
  Eye,
  Activity
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format-currency";

interface StatsCardsProps {
  stats: {
    total_bookings: number;
    upcoming_events_count: number;
    active_bookings_count: number;
    pending_requests_count: number;
    monthly_revenue: number;
    total_revenue: number;
    average_rating: number;
    profile_completion: number;
    venue_views: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cardData = [
    {
      title: "Total Bookings",
      value: stats.total_bookings,
      description: "Lifetime venue bookings",
      icon: CheckSquare,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      href: "/venue/bookings"
    },
    {
      title: "Upcoming Events",
      value: stats.upcoming_events_count,
      description: "Confirmed upcoming slots",
      icon: Calendar,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      href: "/venue/bookings"
    },
    {
      title: "Active Bookings",
      value: stats.active_bookings_count,
      description: "Bookings currently active",
      icon: Activity,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
      href: "/venue/bookings"
    },
    {
      title: "Pending Requests",
      value: stats.pending_requests_count,
      description: "Awaiting approval",
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      href: "/venue/bookings"
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(stats.monthly_revenue),
      description: "Revenue this month",
      icon: TrendingUp,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      href: "/venue/earnings"
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.total_revenue),
      description: "Cumulative platform earnings",
      icon: DollarSign,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
      href: "/venue/earnings"
    },
    {
      title: "Average Rating",
      value: `${stats.average_rating} / 5`,
      description: "Based on guest reviews",
      icon: Star,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
      href: "/venue/reviews"
    },
    {
      title: "Profile Completion",
      value: `${stats.profile_completion}%`,
      description: "Onboarding progress",
      icon: CheckCircle,
      color: "text-teal-400",
      bg: "bg-teal-500/10 border-teal-500/20",
      href: "/venue/venues"
    },
    {
      title: "Venue Views",
      value: stats.venue_views,
      description: "Traffic in last 30 days",
      icon: Eye,
      color: "text-pink-400",
      bg: "bg-pink-500/10 border-pink-500/20",
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cardData.map((card, idx) => {
        const Icon = card.icon;
        const CardElement = (
          <Card className={`bg-bg-card/45 backdrop-blur-md border ${card.bg} transition-all duration-300 hover:scale-[1.02] shadow-lg h-full ${card.href ? "cursor-pointer hover:border-primary/30" : ""}`}>
            <CardContent className="p-4 flex items-center justify-between h-full">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-text-secondary block">
                  {card.title}
                </span>
                <span className="text-xl font-extrabold text-text-primary block">
                  {card.value}
                </span>
                <span className="text-[10px] text-text-muted block">
                  {card.description}
                </span>
              </div>
              <div className={`p-2 rounded-xl bg-bg-elevated border border-border/80 ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        );

        if (card.href) {
          return (
            <Link key={idx} href={card.href} className="block h-full">
              {CardElement}
            </Link>
          );
        }

        return (
          <React.Fragment key={idx}>
            {CardElement}
          </React.Fragment>
        );
      })}
    </div>
  );
}
