"use client";

import * as React from "react";
import { artistService } from "@/services/artistService";
import { ArtistAnalytics } from "@/types/analytics";

export function useArtistAnalytics() {
  const [data, setData] = React.useState<ArtistAnalytics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const insights = await artistService.getAnalytics();
      setData(insights);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load performer business analytics.");
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
    refetch: fetchAnalytics
  };
}
