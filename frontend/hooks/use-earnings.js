"use client";

import * as React from "react";
import { earningsService } from "@/services/earningsService";
import { bandEarningsService } from "@/services/bandEarningsService";
import { useAuth } from "@/hooks/use-auth";

export function useEarnings(type) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const { user } = useAuth();
  const isBandRole = ["artist", "venue_owner", "client"].includes(user?.role);
  
  const fetchEarnings = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let summary;
      if (isBandRole) {
        summary = type === "artist" 
          ? await bandEarningsService.getEarningsSummary() 
          : await bandEarningsService.getVenueEarningsSummary();
      } else {
        summary = type === "artist"
          ? await earningsService.getEarningsSummary()
          : await earningsService.getVenueEarningsSummary();
      }
      setData(summary);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          `Failed to load ${type} earnings metrics.`
      );
    } finally {
      setLoading(false);
    }
  }, [type, isBandRole]);

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
