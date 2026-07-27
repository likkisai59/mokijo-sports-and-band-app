"use client";

import * as React from "react";
import { useReviewReports, useModerationDashboard, useReviewModeration } from "@/hooks/use-review-moderation";
import { ReportedReviewCard } from "./ReportedReviewCard";
import { ReportDetailsDialog } from "./ReportDetailsDialog";
import { ModerationHistoryDialog } from "./ModerationHistoryDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { ReviewReport } from "@/types/review";
import { ShieldAlert, RefreshCw, Filter, History, EyeOff, CheckCircle, Clock } from "lucide-react";

export function ModerationQueue() {
  const [statusFilter, setStatusFilter] = React.useState<string | undefined>("pending");
  const [selectedReport, setSelectedReport] = React.useState<ReviewReport | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState<boolean>(false);
  const [historyOpen, setHistoryOpen] = React.useState<boolean>(false);

  const { data, loading, error, refetch } = useReviewReports(statusFilter);
  const { stats, refetch: refetchStats } = useModerationDashboard();
  const { hideReview, restoreReview, updateReport } = useReviewModeration();

  const handleRefreshAll = () => {
    refetch();
    refetchStats();
  };

  const handleSelectReport = (report: ReviewReport) => {
    setSelectedReport(report);
    setDetailsOpen(true);
  };

  const handleHide = async (reviewId: string) => {
    await hideReview(reviewId);
    handleRefreshAll();
  };

  const handleRestore = async (reviewId: string) => {
    await restoreReview(reviewId);
    handleRefreshAll();
  };

  const handleDismiss = async (reportId: string) => {
    await updateReport(reportId, { action: "dismiss" });
    handleRefreshAll();
  };

  return (
    <div className="space-y-6">
      {/* Moderation KPI Metric Stat Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow p-4">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-muted">Pending Reports</span>
              <p className="text-2xl font-black text-amber-400 leading-none">
                {stats?.pending_reports_count ?? 0}
              </p>
              <p className="text-[9px] text-text-secondary">Requires moderator review</p>
            </div>
            <span className="p-3 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>

        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow p-4">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-muted">Under Review</span>
              <p className="text-2xl font-black text-purple-400 leading-none">
                {stats?.under_review_count ?? 0}
              </p>
              <p className="text-[9px] text-text-secondary">Assigned to moderators</p>
            </div>
            <span className="p-3 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldAlert className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>

        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow p-4">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-muted">Hidden Reviews</span>
              <p className="text-2xl font-black text-orange-400 leading-none">
                {stats?.hidden_reviews_count ?? 0}
              </p>
              <p className="text-[9px] text-text-secondary">Hidden from public APIs</p>
            </div>
            <span className="p-3 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <EyeOff className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>

        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow p-4">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-muted">Total Moderated</span>
              <p className="text-2xl font-black text-emerald-400 leading-none">
                {stats?.total_moderated_count ?? 0}
              </p>
              <p className="text-[9px] text-text-secondary">Immutable audit actions</p>
            </div>
            <span className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Moderation Controls Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Filter className="h-4 w-4 text-text-muted mr-1 hidden sm:inline" />
          {[
            { label: "Pending", value: "pending" },
            { label: "Under Review", value: "under_review" },
            { label: "Action Taken", value: "resolved_action_taken" },
            { label: "Dismissed", value: "resolved_dismissed" },
            { label: "All Queue", value: undefined }
          ].map((tab) => {
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.label}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  active
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-bg-surface/50 text-text-secondary hover:text-text-primary hover:bg-bg-surface"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            className="text-xs h-9 font-bold flex items-center gap-1.5 border-border/80"
          >
            <History className="h-3.5 w-3.5 text-primary" />
            <span>Audit History</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            className="text-xs h-9 flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Reported Review Items Feed Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-xs text-text-secondary animate-pulse">Fetching reported review items...</p>
        </div>
      ) : error ? (
        <ErrorState title="Queue Load Error" message={error} onRetry={handleRefreshAll} />
      ) : !data || data.items.length === 0 ? (
        <div className="bg-bg-card/30 border border-border/60 rounded-2xl p-12 text-center space-y-3">
          <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-block">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-bold text-text-primary">Moderation Queue Clear</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            No reported reviews match the selected filter status. The community review feed is compliant with platform standards.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.items.map((report) => (
            <ReportedReviewCard
              key={report.id}
              report={report}
              onSelectReport={handleSelectReport}
              onHide={handleHide}
              onRestore={handleRestore}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}

      {/* Report Detail Modal */}
      <ReportDetailsDialog
        report={selectedReport}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onSuccess={handleRefreshAll}
      />

      {/* Audit History Modal */}
      <ModerationHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </div>
  );
}
