"use client";

import * as React from "react";
import { 
  Calendar, 
  TrendingUp, 
  Star, 
  Eye 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format-currency";

interface StatsCardsProps {
  stats: {
    total_bookings: number;
    upcoming_events_count: number;
    pending_requests_count: number;
    monthly_revenue: number;
    total_earnings: number;
    average_rating: number;
    profile_completion: number;
    profile_views: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cardData = [
    {
      title: "Upcoming Events",
      value: stats.upcoming_events_count,
      description: "Confirmed upcoming gigs",
      icon: Calendar,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20"
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(stats.monthly_revenue),
      description: "Earnings this month",
      icon: TrendingUp,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20"
    },
    {
      title: "Average Rating",
      value: `${stats.average_rating.toFixed(1)} / 5`,
      description: "Based on client reviews",
      icon: Star,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20"
    },
    {
      title: "Profile Views",
      value: stats.profile_views,
      description: "Views in the last 30 days",
      icon: Eye,
      color: "text-pink-400",
      bg: "bg-pink-500/10 border-pink-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cardData.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card key={idx} className={`bg-bg-card/45 backdrop-blur-md border ${card.bg} transition-all duration-300 hover:scale-[1.02] shadow-lg`}>
            <CardContent className="p-4 flex items-center justify-between">
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
              <div className={`p-2.5 rounded-xl bg-bg-elevated border border-border/80 ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
