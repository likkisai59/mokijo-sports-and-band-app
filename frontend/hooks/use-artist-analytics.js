"use client";

import * as React from "react";
import { artistService } from "@/services/artistService";
import { bandAnalyticsService } from "@/services/bandAnalyticsService";
import { useAuth } from "@/hooks/use-auth";

export function useArtistAnalytics() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const { user } = useAuth();
  const isBandRole = ["artist", "venue_owner", "client"].includes(user?.role);

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const insights = isBandRole 
        ? await bandAnalyticsService.getArtistAnalytics() 
        : await artistService.getAnalytics();
      setData(insights);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load performer business analytics.");
    } finally {
      setLoading(false);
    }
  }, [isBandRole]);

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics
  };
}
