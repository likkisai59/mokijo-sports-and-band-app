"use client";

import * as React from "react";
import {
  Users,
  Music,
  Calendar,
  IndianRupee,
  ShieldCheck,
  TrendingUp,
  FileText,
  Activity,
  Percent,
  CheckCircle,
  XCircle,
  Star
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AdminPageContainer } from "@/components/layout/admin/AdminPageContainer";
import { AdminStatCard } from "@/components/layout/admin/AdminWidgets";
import {
  ReviewActivityChart,
  RoleComparisonChart,
  TopRatedProfilesWidget
} from "@/components/reviews";
import { useAdminReviewAnalytics } from "@/hooks/use-review-analytics";
import toast from "react-hot-toast";

function CustomAreaChart() {
  return (
    <div className="w-full h-64 relative mt-4">
      <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="50" x2="500" y2="50" stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="4" />
        <line x1="0" y1="100" x2="500" y2="100" stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="4" />
        <line x1="0" y1="150" x2="500" y2="150" stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="4" />

        <path
          d="M 0 160 Q 100 120 200 140 T 400 60 T 500 40 L 500 200 L 0 200 Z"
          fill="url(#chartGlow)"
        />
        <path
          d="M 0 160 Q 100 120 200 140 T 400 60 T 500 40"
          fill="none"
          stroke="#FF6B35"
          strokeWidth="3"
        />
        <circle cx="200" cy="140" r="4" fill="#FF6B35" stroke="#12121A" strokeWidth="2" />
        <circle cx="400" cy="60" r="4" fill="#FF6B35" stroke="#12121A" strokeWidth="2" />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-text-secondary px-2">
        <span>Jan</span>
        <span>Mar</span>
        <span>May</span>
        <span>Jul</span>
        <span>Sep</span>
        <span>Nov</span>
      </div>
    </div>
  );
}

function CustomBarChart() {
  return (
    <div className="w-full h-64 relative mt-4 flex items-end justify-between gap-2 px-4 pt-6">
      {[60, 80, 45, 90, 110, 75, 120, 95, 130, 85, 140, 105].map((val, idx) => (
        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
          <div className="text-[9px] text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity font-bold">
            {val}
          </div>
          <div
            className="w-full rounded-t bg-primary/25 group-hover:bg-primary border border-primary/20 transition-all duration-300"
            style={{ height: `${(val / 150) * 160}px` }}
          />
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { analytics: adminAnalytics } = useAdminReviewAnalytics();

  const [approvals, setApprovals] = React.useState([
    { id: "1", name: "The Metal Core", type: "Band", email: "metal@core.in", time: "10 min ago" },
    { id: "2", name: "Royal Plaza Turf", type: "Venue", email: "plaza@royal.com", time: "1 hour ago" },
    { id: "3", name: "Jazz Elements Trio", type: "Band", email: "elements@jazz.org", time: "2 hours ago" },
  ]);

  const handleApprove = (id: string, name: string) => {
    setApprovals((prev) => prev.filter((item) => item.id !== id));
    toast.success(`Successfully approved profile: ${name}`);
  };

  const handleDecline = (id: string, name: string) => {
    setApprovals((prev) => prev.filter((item) => item.id !== id));
    toast.error(`Declined profile verification for: ${name}`);
  };

  const handleQuickAction = (actionName: string) => {
    toast.success(`Quick Action triggered: ${actionName}`);
  };

  return (
    <AdminPageContainer
      title="Admin Home"
      description="Real-time metric counters, escrow cash positions, review analytics, system approvals queue, and performance logs."
      actions={
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleQuickAction("Generate Report")} className="flex items-center gap-1.5 font-bold">
            <FileText className="h-4 w-4" />
            <span>Export PDF Report</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleQuickAction("Diagnostics")} className="flex items-center gap-1.5 font-bold">
            <Activity className="h-4 w-4" />
            <span>Run Diagnostics</span>
          </Button>
        </div>
      }
    >
      {/* 1. Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AdminStatCard
          title="Total Users"
          value="12,450"
          trend={{ value: "+12.4%", isPositive: true }}
          description="Registered profiles"
          icon={Users}
        />
        <AdminStatCard
          title="Platform Average Rating"
          value={`${(adminAnalytics?.platform_average_rating ?? 4.85).toFixed(2)} ★`}
          trend={{ value: "+0.3", isPositive: true }}
          description="Across all verified reviews"
          icon={Star}
        />
        <AdminStatCard
          title="Total Reviews Submitted"
          value={`${adminAnalytics?.total_reviews ?? 148}`}
          trend={{ value: `+${adminAnalytics?.growth_percentage ?? 12.5}%`, isPositive: true }}
          description="Platform review volume"
          icon={Music}
        />
        <AdminStatCard
          title="Bookings Completed"
          value="5,640"
          trend={{ value: "+18.9%", isPositive: true }}
          description="Successful bookings"
          icon={Calendar}
        />
        <AdminStatCard
          title="Escrow Cash Held"
          value="₹18,40,500"
          trend={{ value: "+15.2%", isPositive: true }}
          description="Held in platform escrow"
          icon={IndianRupee}
        />
        <AdminStatCard
          title="Platform Revenue"
          value="₹4,85,000"
          trend={{ value: "+9.4%", isPositive: true }}
          description="10% commission deductions"
          icon={TrendingUp}
        />
        <AdminStatCard
          title="Pending Approvals"
          value={approvals.length + 25}
          trend={{ value: "-4.5%", isPositive: true }}
          description="Awaiting admin reviews"
          icon={ShieldCheck}
        />
        <AdminStatCard
          title="Commissions Rate"
          value="10%"
          description="Fixed marketplace flat rate"
          icon={Percent}
        />
      </div>

      {/* 2. Platform Review Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <ReviewActivityChart
          data={adminAnalytics?.activity_breakdown || [
            { period: "Nov 2025", average_rating: 4.8, count: 20 },
            { period: "Dec 2025", average_rating: 4.8, count: 32 },
            { period: "Jan 2026", average_rating: 4.9, count: 45 },
            { period: "Feb 2026", average_rating: 4.9, count: 51 }
          ]}
        />

        <RoleComparisonChart
          data={adminAnalytics?.role_comparison || [
            { role: "Client Reviews", average_rating: 4.9, total_reviews: 60 },
            { role: "Artist Reviews", average_rating: 4.8, total_reviews: 45 },
            { role: "Venue Reviews", average_rating: 4.7, total_reviews: 43 }
          ]}
        />

        <TopRatedProfilesWidget
          items={adminAnalytics?.top_rated_artists || [
            { id: "1", name: "The Metal Core", entity_type: "artist", average_rating: 5.0, total_reviews: 18 },
            { id: "2", name: "Royal Plaza Turf", entity_type: "venue", average_rating: 4.9, total_reviews: 14 }
          ]}
        />
      </div>

      {/* 3. Custom Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-primary" />
              <span>Platform Commissions Revenue (INR)</span>
            </CardTitle>
            <CardDescription>Monthly flat commissions fees generated over time</CardDescription>
          </CardHeader>
          <CardContent>
            <CustomAreaChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-secondary" />
              <span>Marketplace Gigs Completed</span>
            </CardTitle>
            <CardDescription>Event bookings count per month</CardDescription>
          </CardHeader>
          <CardContent>
            <CustomBarChart />
          </CardContent>
        </Card>
      </div>

      {/* 4. Action Toggles & Lists Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border/30">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-primary" />
              <span>Pending Profiles Verification Queue</span>
            </CardTitle>
            <CardDescription>Review new band listings and venue details</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {approvals.length === 0 ? (
                <div className="p-8 text-center text-xs text-text-muted">No pending verify requests.</div>
              ) : (
                approvals.map((app) => (
                  <div key={app.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary text-sm">{app.name}</span>
                        <Badge variant="secondary">{app.type}</Badge>
                      </div>
                      <p className="text-text-secondary mt-1">{app.email} • {app.time}</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <Button
                        onClick={() => handleApprove(app.id, app.name)}
                        size="sm"
                        className="flex items-center gap-1 font-bold h-8 text-[11px]"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Approve</span>
                      </Button>
                      <Button
                        onClick={() => handleDecline(app.id, app.name)}
                        variant="destructive"
                        size="sm"
                        className="flex items-center gap-1 font-bold h-8 text-[11px]"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Decline</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/30">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-secondary" />
              <span>Latest Accounts Registered</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {[
                { name: "Sarah Connor", role: "client", initials: "SC" },
                { name: "Iron & Wine", role: "artist", initials: "IW" },
                { name: "Grand Arena Owner", role: "venue_owner", initials: "GA" },
                { name: "Dev Administrator", role: "admin", initials: "DA" }
              ].map((usr, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3.5 text-xs">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px] font-bold">{usr.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-text-primary truncate">{usr.name}</p>
                    <p className="text-[10px] text-text-muted mt-0.5 uppercase font-bold">{usr.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
