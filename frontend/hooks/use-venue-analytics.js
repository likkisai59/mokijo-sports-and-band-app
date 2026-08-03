"use client";

import * as React from "react";
import { venueService } from "@/services/venueService";
import { bandAnalyticsService } from "@/services/bandAnalyticsService";
import { useAuth } from "@/hooks/use-auth";

export function useVenueAnalytics() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const { user } = useAuth();
  const isBandRole = ["artist", "venue_owner", "client"].includes(user?.role);

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = isBandRole 
        ? await bandAnalyticsService.getVenueAnalytics() 
        : await venueService.getAnalytics();
      setData(result);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          "Failed to load venue business analytics."
      );
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
    refetch: fetchAnalytics,
  };
}
