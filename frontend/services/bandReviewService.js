import { API_BASE_URL } from "./api";
import { getAuthToken } from "@/utils/auth";

const getHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const bandReviewService = {
  checkEligibility: async (bookingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/band/reviews/eligibility/${bookingId}`, {
        headers: getHeaders()
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (err) {
      console.error("Failed to check band review eligibility", err);
      return null;
    }
  },

  createReview: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/band/reviews`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to submit review.");
    }
    
    return await response.json();
  }
};
