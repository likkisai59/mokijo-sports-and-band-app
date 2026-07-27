"use client";

import * as React from "react";
import Link from "next/link";
import { 
  UserCheck, 
  Calendar, 
  Image as ImageIcon, 
  Video, 
  DollarSign, 
  Inbox,
  ArrowRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function QuickActionsWidget() {
  const actions = [
    {
      label: "Complete Profile",
      description: "Improve discoverability",
      href: "/artist/profile",
      icon: UserCheck,
      color: "text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/10"
    },
    {
      label: "Update Availability",
      description: "Manage calendar slots",
      href: "/artist/profile?tab=availability",
      icon: Calendar,
      color: "text-blue-400 hover:bg-blue-500/10 border-blue-500/10"
    },
    {
      label: "Upload Gallery Photos",
      description: "Add live show photos",
      href: "/artist/profile?tab=gallery",
      icon: ImageIcon,
      color: "text-purple-400 hover:bg-purple-500/10 border-purple-500/10"
    },
    {
      label: "Upload Demo Video",
      description: "Add YouTube/Vimeo links",
      href: "/artist/profile?tab=media",
      icon: Video,
      color: "text-pink-400 hover:bg-pink-500/10 border-pink-500/10"
    },
    {
      label: "Manage Booking Rates",
      description: "Configure travel rates",
      href: "/artist/profile?tab=pricing",
      icon: DollarSign,
      color: "text-amber-400 hover:bg-amber-500/10 border-amber-500/10"
    },
    {
      label: "View Booking Inbox",
      description: "Review incoming gigs",
      href: "/artist/bookings",
      icon: Inbox,
      color: "text-indigo-400 hover:bg-indigo-500/10 border-indigo-500/10"
    }
  ];

  return (
    <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 shadow-xl">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {actions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <Link
              key={idx}
              href={act.href}
              className={`flex items-start gap-3 p-3.5 rounded-xl border border-border/50 bg-bg-elevated/20 transition-all duration-300 hover:scale-[1.01] hover:border-primary/20 group ${act.color}`}
            >
              <div className="p-2 rounded-lg bg-bg-elevated border border-border/80">
                <Icon className="h-4 w-4" />
              </div>
              <div className="space-y-0.5 flex-1">
                <span className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors block">
                  {act.label}
                </span>
                <span className="text-[10px] text-text-muted block">
                  {act.description}
                </span>
              </div>
              <ArrowRight className="h-3 w-3 self-center text-text-muted group-hover:translate-x-1 transition-transform" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
