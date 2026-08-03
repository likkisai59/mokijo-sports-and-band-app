"use client";

import * as React from "react";
import { bandReviewService } from "@/services/bandReviewService";

export function useBandCanReviewBooking(bookingId) {
  const [eligibility, setEligibility] = React.useState(null);
  const [checking, setChecking] = React.useState(false);

  const checkEligibility = React.useCallback(async () => {
    if (!bookingId) return;
    setChecking(true);
    try {
      const result = await bandReviewService.checkEligibility(bookingId);
      setEligibility(result);
    } catch (err) {
      setEligibility(null);
    } finally {
      setChecking(false);
    }
  }, [bookingId]);

  React.useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  return {
    eligibility,
    checking,
    canReview: eligibility?.eligible ?? false,
    alreadyReviewed: eligibility?.already_reviewed ?? false,
    reason: eligibility?.reason || null,
    refetch: checkEligibility
  };
}

export function useBandCreateReview() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const createReview = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await bandReviewService.createReview(payload);
      return result;
    } catch (err) {
      setError(err.message || "Failed to submit review.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createReview, loading, error };
}
