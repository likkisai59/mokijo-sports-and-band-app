"use client";

import * as React from "react";
import { venueService } from "@/services/venueService";
import { VenueAnalyticsData } from "@/types/venue";

export function useVenueAnalytics() {
  const [data, setData] = React.useState<VenueAnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await venueService.getAnalytics();
      setData(result);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          "Failed to load venue business analytics."
      );
    } finally {
      setLoading(false);
    }
  }, []);

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
