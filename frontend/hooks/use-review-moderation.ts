"use client";

import { useState, useCallback, useEffect } from "react";
import { reviewService } from "@/services/reviewService";
import {
  ReviewReport,
  ReportListResponse,
  ReportReviewPayload,
  ModerationActionPayload,
  ReviewModerationHistory,
  ModerationDashboardStats
} from "@/types/review";
import toast from "react-hot-toast";

export function useReviewReports(statusFilter?: string, reasonFilter?: string, page: number = 1, limit: number = 20) {
  const [data, setData] = useState<ReportListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reviewService.getReports({
        status: statusFilter,
        reason: reasonFilter,
        page,
        limit
      });
      setData(res);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to load review reports.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, reasonFilter, page, limit]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { data, loading, error, refetch: fetchReports };
}

export function usePendingReports() {
  return useReviewReports("pending", undefined, 1, 10);
}

export function useReviewModeration() {
  const [submitting, setSubmitting] = useState<boolean>(false);

  const reportReview = async (reviewId: string, payload: ReportReviewPayload) => {
    setSubmitting(true);
    try {
      const report = await reviewService.reportReview(reviewId, payload);
      toast.success("Review report submitted successfully for moderation.");
      return report;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Could not report review.";
      toast.error(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const hideReview = async (reviewId: string, notes?: string) => {
    setSubmitting(true);
    try {
      const res = await reviewService.hideReview(reviewId, notes);
      toast.success("Review has been hidden from public view.");
      return res;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to hide review.");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const restoreReview = async (reviewId: string, notes?: string) => {
    setSubmitting(true);
    try {
      const res = await reviewService.restoreReview(reviewId, notes);
      toast.success("Review has been restored to public view.");
      return res;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to restore review.");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const removeReview = async (reviewId: string, notes?: string) => {
    setSubmitting(true);
    try {
      const res = await reviewService.removeReview(reviewId, notes);
      toast.success("Review has been permanently removed.");
      return res;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove review.");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const updateReport = async (reportId: string, payload: ModerationActionPayload) => {
    setSubmitting(true);
    try {
      const res = await reviewService.updateReport(reportId, payload);
      toast.success(`Report status updated (${payload.action}).`);
      return res;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update report.");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitting,
    reportReview,
    hideReview,
    restoreReview,
    removeReview,
    updateReport
  };
}

export function useReviewHistory(reviewId?: string) {
  const [history, setHistory] = useState<ReviewModerationHistory[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reviewService.getModerationHistory({ review_id: reviewId });
      setHistory(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load moderation history.");
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, total, loading, error, refetch: fetchHistory };
}

export function useModerationDashboard() {
  const [stats, setStats] = useState<ModerationDashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reviewService.getModerationStats();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load moderation stats.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
