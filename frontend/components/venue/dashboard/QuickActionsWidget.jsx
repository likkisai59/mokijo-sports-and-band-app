"use client";

import * as React from "react";
import Link from "next/link";
import { 
  UserCheck, 
  Calendar, 
  Image as ImageIcon, 
  DollarSign, 
  Inbox,
  ArrowRight,
  MessageSquare,
  ShieldCheck
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function QuickActionsWidget() {
  const actions = [
    {
      label: "Complete Profile",
      description: "Improve listing search rank",
      href: "/venue/venues",
      icon: UserCheck,
      color: "text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/10"
    },
    {
      label: "Manage Availability",
      description: "Add blocked/maintenance dates",
      href: "/venue/bookings",
      icon: Calendar,
      color: "text-blue-400 hover:bg-blue-500/10 border-blue-500/10"
    },
    {
      label: "Update Pricing",
      description: "Configure rents & weekend rates",
      href: "/venue/venues",
      icon: DollarSign,
      color: "text-purple-400 hover:bg-purple-500/10 border-purple-500/10"
    },
    {
      label: "Upload Gallery",
      description: "Add photos and virtual tours",
      href: "/venue/venues",
      icon: ImageIcon,
      color: "text-pink-400 hover:bg-pink-500/10 border-pink-500/10"
    },
    {
      label: "Manage Reviews",
      description: "Reply to client feedback & ratings",
      href: "/venue/reviews",
      icon: MessageSquare,
      color: "text-amber-400 hover:bg-amber-500/10 border-amber-500/10"
    },
    {
      label: "View Booking Requests",
      description: "Review incoming reservations",
      href: "/venue/bookings",
      icon: Inbox,
      color: "text-indigo-400 hover:bg-indigo-500/10 border-indigo-500/10"
    },
    {
      label: "Compliance Verification",
      description: "Check status & submit documents",
      href: "/venue/verification",
      icon: ShieldCheck,
      color: "text-teal-400 hover:bg-teal-500/10 border-teal-500/10"
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
