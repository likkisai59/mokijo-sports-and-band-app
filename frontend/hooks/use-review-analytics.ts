"use client";

import * as React from "react";
import { reviewService } from "@/services/reviewService";
import {
  ProfileReviewAnalytics,
  DashboardReviewAnalytics,
  AdminReviewAnalytics,
  MarketplaceReviewAnalytics
} from "@/types/review";

export function useProfileReviewAnalytics(userId?: string) {
  const [analytics, setAnalytics] = React.useState<ProfileReviewAnalytics | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

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
    } catch (err: any) {
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
  const [analytics, setAnalytics] = React.useState<DashboardReviewAnalytics | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reviewService.getDashboardAnalytics();
      setAnalytics(data);
    } catch (err: any) {
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
  const [analytics, setAnalytics] = React.useState<AdminReviewAnalytics | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reviewService.getAdminAnalytics();
      setAnalytics(data);
    } catch (err: any) {
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
  const [analytics, setAnalytics] = React.useState<MarketplaceReviewAnalytics | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reviewService.getMarketplaceAnalytics();
      setAnalytics(data);
    } catch (err: any) {
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

export function useReviewAnalytics(targetId?: string) {
  const [statistics, setStatistics] = React.useState<any>(null);
  const [summary, setSummary] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

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
    } catch (err: any) {
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
