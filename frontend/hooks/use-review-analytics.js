"use client";

import * as React from "react";
import { reviewService } from "@/services/reviewService";

export function useProfileReviewAnalytics(userId) {
  const [analytics, setAnalytics] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchAnalytics = React.useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await reviewService.getProfileAnalytics(userId);
      setAnalytics(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load profile review analytics.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, loading, error, refetch: fetchAnalytics };
}

export function useDashboardReviewAnalytics() {
  const [analytics, setAnalytics] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reviewService.getDashboardAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load dashboard review analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, loading, error, refetch: fetchAnalytics };
}

export function useAdminReviewAnalytics() {
  const [analytics, setAnalytics] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reviewService.getAdminAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load admin review analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, loading, error, refetch: fetchAnalytics };
}

export function useMarketplaceReviewAnalytics() {
  const [analytics, setAnalytics] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reviewService.getMarketplaceAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load marketplace review analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, loading, error, refetch: fetchAnalytics };
}

export function useReviewAnalytics(targetId) {
  const [statistics, setStatistics] = React.useState(null);
  const [summary, setSummary] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, summaryData] = await Promise.all([
        reviewService.getStatistics(targetId),
        reviewService.getSummary()
      ]);
      setStatistics(statsData);
      setSummary(summaryData);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load review statistics.");
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { statistics, summary, loading, error, refetch: fetchAll };
}
