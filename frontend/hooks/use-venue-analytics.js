"use client";

import * as React from "react";
import { venueService } from "@/services/venueService";

export function useVenueAnalytics() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await venueService.getAnalytics();
      setData(result);
    } catch (err) {
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
