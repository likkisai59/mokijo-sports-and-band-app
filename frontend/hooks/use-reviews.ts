"use client";

import * as React from "react";
import { reviewService } from "@/services/reviewService";
import {
  Review,
  ReviewDetail,
  RatingDistribution,
  CreateReviewPayload,
  UpdateReviewPayload,
  ReviewFiltersPayload,
  ReviewEligibility
} from "@/types/review";
import { useReviewStore } from "@/store/review-store";

export function useReviews(type: "artist" | "venue") {
  const [reviews, setReviews] = React.useState<ReviewDetail[]>([]);
  const [averageRating, setAverageRating] = React.useState(0);
  const [totalReviews, setTotalReviews] = React.useState(0);
  const [distribution, setDistribution] = React.useState<RatingDistribution>({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  });

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters state
  const [ratingFilter, setRatingFilter] = React.useState<number | undefined>(undefined);
  const [search, setSearch] = React.useState<string>("");
  const [page, setPage] = React.useState<number>(1);
  const limit = 10;

  const fetchReviews = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchFn =
        type === "artist"
          ? reviewService.getArtistReviews
          : reviewService.getVenueReviews;

      const data = await fetchFn({
        rating: ratingFilter,
        search: search.trim() || undefined,
        page,
        limit,
      });

      setReviews(data.reviews || []);
      setAverageRating(data.average_rating || 0);
      setTotalReviews(data.total_reviews || 0);
      setDistribution(
        data.rating_distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      );
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          `Failed to load ${type} reviews.`
      );
    } finally {
      setLoading(false);
    }
  }, [type, ratingFilter, search, page]);

  React.useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    averageRating,
    totalReviews,
    distribution,
    loading,
    error,
    ratingFilter,
    setRatingFilter,
    search,
    setSearch,
    page,
    setPage,
    limit,
    refetch: fetchReviews,
  };
}

export function useReview(id: string) {
  const { selectedReview, loading, error, fetchReviewById } = useReviewStore();

  React.useEffect(() => {
    if (id) {
      fetchReviewById(id);
    }
  }, [id, fetchReviewById]);

  return { review: selectedReview, loading, error };
}

export function useCreateReview() {
  const { createReview, loading, error } = useReviewStore();
  return { createReview, loading, error };
}

export function useSubmitReview() {
  const { createReview, loading, error } = useReviewStore();
  return { submitReview: createReview, loading, error };
}

export function useUpdateReview() {
  const { updateReview, loading, error } = useReviewStore();
  return { updateReview, loading, error };
}

export function useDeleteReview() {
  const { deleteReview, loading, error } = useReviewStore();
  return { deleteReview, loading, error };
}

export function useCanReviewBooking(bookingId: string, targetUserId?: string) {
  const { eligibilityMap, checkEligibility } = useReviewStore();
  const [checking, setChecking] = React.useState(false);

  React.useEffect(() => {
    if (bookingId && !eligibilityMap[bookingId]) {
      setChecking(true);
      checkEligibility(bookingId, targetUserId).finally(() => setChecking(false));
    }
  }, [bookingId, targetUserId, eligibilityMap, checkEligibility]);

  const eligibility = eligibilityMap[bookingId] || null;

  return {
    eligibility,
    checking,
    canReview: eligibility?.eligible ?? false,
    alreadyReviewed: eligibility?.already_reviewed ?? false,
    reason: eligibility?.reason || null,
    refetch: () => checkEligibility(bookingId, targetUserId)
  };
}

export function useBookingReviews(bookingId: string) {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchBookingReviews = React.useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const data = await reviewService.getBookingReviews(bookingId);
      setReviews(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch booking reviews.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  React.useEffect(() => {
    fetchBookingReviews();
  }, [fetchBookingReviews]);

  return { reviews, loading, error, refetch: fetchBookingReviews };
}

export function useMyReviews() {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchMyReviews = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await reviewService.getMyReviews();
      setReviews(data.items);
    } catch (err: any) {
      setError(err.message || "Failed to fetch user reviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMyReviews();
  }, [fetchMyReviews]);

  return { reviews, loading, error, refetch: fetchMyReviews };
}
