"use client";

import * as React from "react";
import { venueService } from "@/services/venueService";
import toast from "react-hot-toast";

export function useVenueVerification() {
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState(null);

  const fetchProfile = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await venueService.getProfile();
      setProfile(data);
    } catch (err) {
      setError(
        err.response?.data?.error?.message || "Failed to load venue verification profile."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const resubmitDocs = async (data) => {
    setSubmitting(true);
    try {
      const updated = await venueService.resubmitVerificationDocuments(data);
      setProfile(updated);
      toast.success("Verification documents successfully resubmitted!");
      return true;
    } catch (err) {
      const msg = err.response?.data?.error?.message || "Failed to resubmit documents.";
      toast.error(msg);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    profile,
    loading,
    submitting,
    error,
    refetch: fetchProfile,
    resubmitDocs,
  };
}
