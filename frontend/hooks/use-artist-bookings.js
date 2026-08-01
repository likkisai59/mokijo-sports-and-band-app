"use client";

import * as React from "react";
import { bookingService } from "@/services/bookingService";

export function useArtistBookings() {
  const [bookings, setBookings] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Filter params
  const [status, setStatus] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const limit = 10;

  const fetchBookings = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingService.getArtistBookings({
        status: status || undefined,
        search: search || undefined,
        page,
        limit
      });
      setBookings(data.bookings);
      setTotal(data.total);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load booking requests.");
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  React.useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    total,
    loading,
    error,
    status,
    setStatus,
    search,
    setSearch,
    page,
    setPage,
    limit,
    refetch: fetchBookings
  };
}
