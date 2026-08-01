import { create } from "zustand";
import { reviewService } from "@/services/reviewService";

const initialFilters = {
  page: 1,
  limit: 20,
  sort_by: "created_at",
  sort_order: "desc"
};

export const useReviewStore = create((set, get) => ({
  reviews: [],
  selectedReview: null,
  loading: false,
  error: null,
  filters: initialFilters,
  eligibilityMap: {},
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    pages: 0
  },

  dashboardAnalytics: null,
  adminAnalytics: null,
  profileAnalyticsMap: {},

  reports: [],
  reportsPagination: {
    total: 0,
    page: 1,
    limit: 20,
    pages: 0
  },
  moderationStats: null,
  moderationHistory: [],

  fetchReviews: async (customFilters) => {
    const activeFilters = { ...get().filters, ...customFilters };
    set({ loading: true, error: null, filters: activeFilters });
    try {
      const data = await reviewService.listReviews(activeFilters);
      set({
        reviews: data.items,
        pagination: data.pagination,
        loading: false
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message || "Failed to fetch reviews.",
        loading: false
      });
    }
  },

  fetchReviewById: async (id) => {
    set({ loading: true, error: null });
    try {
      const review = await reviewService.getReview(id);
      set({ selectedReview: review, loading: false });
      return review;
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message || "Failed to fetch review.",
        loading: false
      });
      return null;
    }
  },

  createReview: async (payload) => {
    set({ loading: true, error: null });
    try {
      const created = await reviewService.createReview(payload);
      set((state) => ({
        reviews: [created, ...state.reviews],
        loading: false
      }));
      if (payload.booking_id) {
        set((state) => ({
          eligibilityMap: {
            ...state.eligibilityMap,
            [payload.booking_id]: {
              eligible: false,
              booking_id: payload.booking_id,
              reviewer_id: created.reviewer_id || "",
              already_reviewed: true,
              reason: "You have already submitted a review for this booking."
            }
          }
        }));
      }
      return created;
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message || "Failed to create review.",
        loading: false
      });
      return null;
    }
  },

  updateReview: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const updated = await reviewService.updateReview(id, payload);
      set((state) => ({
        reviews: state.reviews.map((r) => (r.id === id ? updated : r)),
        selectedReview: state.selectedReview?.id === id ? updated : state.selectedReview,
        loading: false
      }));
      return updated;
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message || "Failed to update review.",
        loading: false
      });
      return null;
    }
  },

  deleteReview: async (id) => {
    set({ loading: true, error: null });
    try {
      await reviewService.deleteReview(id);
      set((state) => ({
        reviews: state.reviews.filter((r) => r.id !== id),
        selectedReview: state.selectedReview?.id === id ? null : state.selectedReview,
        loading: false
      }));
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message || "Failed to delete review.",
        loading: false
      });
      return false;
    }
  },

  checkEligibility: async (bookingId, targetUserId) => {
    try {
      const eligibility = await reviewService.checkEligibility(bookingId, targetUserId);
      set((state) => ({
        eligibilityMap: {
          ...state.eligibilityMap,
          [bookingId]: eligibility
        }
      }));
      return eligibility;
    } catch {
      return null;
    }
  },

  fetchDashboardAnalytics: async () => {
    try {
      const data = await reviewService.getDashboardAnalytics();
      set({ dashboardAnalytics: data });
    } catch (err) {
      console.error("Dashboard analytics error:", err);
    }
  },

  fetchAdminAnalytics: async () => {
    try {
      const data = await reviewService.getAdminAnalytics();
      set({ adminAnalytics: data });
    } catch (err) {
      console.error("Admin analytics error:", err);
    }
  },

  fetchProfileAnalytics: async (userId) => {
    try {
      const data = await reviewService.getProfileAnalytics(userId);
      set((state) => ({
        profileAnalyticsMap: {
          ...state.profileAnalyticsMap,
          [userId]: data
        }
      }));
      return data;
    } catch (err) {
      console.error("Profile analytics error:", err);
      return null;
    }
  },

  fetchReports: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await reviewService.getReports(params);
      set({
        reports: res.items,
        reportsPagination: res.pagination,
        loading: false
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to fetch reports.",
        loading: false
      });
    }
  },

  fetchModerationStats: async () => {
    try {
      const stats = await reviewService.getModerationStats();
      set({ moderationStats: stats });
    } catch (err) {
      console.error("Moderation stats error:", err);
    }
  },

  fetchModerationHistory: async (reviewId) => {
    try {
      const res = await reviewService.getModerationHistory({ review_id: reviewId });
      set({ moderationHistory: res.items });
    } catch (err) {
      console.error("Moderation history error:", err);
    }
  },

  reportReview: async (reviewId, payload) => {
    try {
      const report = await reviewService.reportReview(reviewId, payload);
      set((state) => ({
        reports: [report, ...state.reports]
      }));
      return report;
    } catch (err) {
      console.error("Report review error:", err);
      return null;
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: newFilters.page ?? 1 }
    }));
  },

  resetFilters: () => {
    set({ filters: initialFilters });
  },

  setSelectedReview: (review) => {
    set({ selectedReview: review });
  }
}));
