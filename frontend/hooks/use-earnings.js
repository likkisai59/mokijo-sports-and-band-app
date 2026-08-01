"use client";

import * as React from "react";
import { earningsService } from "@/services/earningsService";

export function useEarnings(type) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchEarnings = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary =
        type === "artist"
          ? await earningsService.getEarningsSummary()
          : await earningsService.getVenueEarningsSummary();
      setData(summary);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          `Failed to load ${type} earnings metrics.`
      );
    } finally {
      setLoading(false);
    }
  }, [type]);

  React.useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return {
    data,
    loading,
    error,
    refetch: fetchEarnings,
  };
}
