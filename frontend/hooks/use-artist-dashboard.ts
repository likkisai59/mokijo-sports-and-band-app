"use client";

import * as React from "react";
import { artistService } from "@/services/artistService";
import { ArtistDashboardData } from "@/types/artist";
import toast from "react-hot-toast";

export function useArtistDashboard() {
  const [data, setData] = React.useState<ArtistDashboardData | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchDashboard = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await artistService.getDashboardStats();
      setData(stats);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to load dashboard data.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboard,
  };
}
