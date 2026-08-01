"use client";

import { useState, useCallback, useEffect } from "react";
import { reviewService } from "@/services/reviewService";
import toast from "react-hot-toast";

export function useReviewReports(statusFilter, reasonFilter, page = 1, limit = 20) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    } catch (err) {
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
  const [submitting, setSubmitting] = useState(false);

  const reportReview = async (reviewId, payload) => {
    setSubmitting(true);
    try {
      const report = await reviewService.reportReview(reviewId, payload);
      toast.success("Review report submitted successfully for moderation.");
      return report;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Could not report review.";
      toast.error(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const hideReview = async (reviewId, notes) => {
    setSubmitting(true);
    try {
      const res = await reviewService.hideReview(reviewId, notes);
      toast.success("Review has been hidden from public view.");
      return res;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to hide review.");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const restoreReview = async (reviewId, notes) => {
    setSubmitting(true);
    try {
      const res = await reviewService.restoreReview(reviewId, notes);
      toast.success("Review has been restored to public view.");
      return res;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to restore review.");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const removeReview = async (reviewId, notes) => {
    setSubmitting(true);
    try {
      const res = await reviewService.removeReview(reviewId, notes);
      toast.success("Review has been permanently removed.");
      return res;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove review.");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const updateReport = async (reportId, payload) => {
    setSubmitting(true);
    try {
      const res = await reviewService.updateReport(reportId, payload);
      toast.success(`Report status updated (${payload.action}).`);
      return res;
    } catch (err) {
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

export function useReviewHistory(reviewId) {
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reviewService.getModerationHistory({ review_id: reviewId });
      setHistory(res.items);
      setTotal(res.total);
    } catch (err) {
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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reviewService.getModerationStats();
      setStats(data);
    } catch (err) {
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
