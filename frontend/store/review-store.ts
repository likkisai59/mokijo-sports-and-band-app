import { create } from "zustand";
import {
  Review,
  CreateReviewPayload,
  UpdateReviewPayload,
  ReviewFiltersPayload,
  ReviewEligibility,
  DashboardReviewAnalytics,
  AdminReviewAnalytics,
  ProfileReviewAnalytics,
  ReviewReport,
  ReportReviewPayload,
  ModerationDashboardStats,
  ReviewModerationHistory
} from "@/types/review";
import { reviewService } from "@/services/reviewService";

interface ReviewStoreState {
  reviews: Review[];
  selectedReview: Review | null;
  loading: boolean;
  error: string | null;
  filters: ReviewFiltersPayload;
  eligibilityMap: Record<string, ReviewEligibility>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };

  // Analytics state (Phase 4)
  dashboardAnalytics: DashboardReviewAnalytics | null;
  adminAnalytics: AdminReviewAnalytics | null;
  profileAnalyticsMap: Record<string, ProfileReviewAnalytics>;

  // Moderation state (Phase 5)
  reports: ReviewReport[];
  reportsPagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  moderationStats: ModerationDashboardStats | null;
  moderationHistory: ReviewModerationHistory[];

  // Actions
  fetchReviews: (customFilters?: ReviewFiltersPayload) => Promise<void>;
  fetchReviewById: (id: string) => Promise<Review | null>;
  createReview: (payload: CreateReviewPayload) => Promise<Review | null>;
  updateReview: (id: string, payload: UpdateReviewPayload) => Promise<Review | null>;
  deleteReview: (id: string) => Promise<boolean>;
  checkEligibility: (bookingId: string, targetUserId?: string) => Promise<ReviewEligibility | null>;
  fetchDashboardAnalytics: () => Promise<void>;
  fetchAdminAnalytics: () => Promise<void>;
  fetchProfileAnalytics: (userId: string) => Promise<ProfileReviewAnalytics | null>;
  fetchReports: (params?: { status?: string; reason?: string; page?: number; limit?: number }) => Promise<void>;
  fetchModerationStats: () => Promise<void>;
  fetchModerationHistory: (reviewId?: string) => Promise<void>;
  reportReview: (reviewId: string, payload: ReportReviewPayload) => Promise<ReviewReport | null>;
  setFilters: (filters: Partial<ReviewFiltersPayload>) => void;
  resetFilters: () => void;
  setSelectedReview: (review: Review | null) => void;
}

const initialFilters: ReviewFiltersPayload = {
  page: 1,
  limit: 20,
  sort_by: "created_at",
  sort_order: "desc"
};

export const useReviewStore = create<ReviewStoreState>((set, get) => ({
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

  fetchReviews: async (customFilters?: ReviewFiltersPayload) => {
    const activeFilters = { ...get().filters, ...customFilters };
    set({ loading: true, error: null, filters: activeFilters });
    try {
      const data = await reviewService.listReviews(activeFilters);
      set({
        reviews: data.items,
        pagination: data.pagination,
        loading: false
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || err.message || "Failed to fetch reviews.",
        loading: false
      });
    }
  },

  fetchReviewById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const review = await reviewService.getReview(id);
      set({ selectedReview: review, loading: false });
      return review;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || err.message || "Failed to fetch review.",
        loading: false
      });
      return null;
    }
  },

  createReview: async (payload: CreateReviewPayload) => {
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
            [payload.booking_id!]: {
              eligible: false,
              booking_id: payload.booking_id!,
              reviewer_id: created.reviewer_id || "",
              already_reviewed: true,
              reason: "You have already submitted a review for this booking."
            }
          }
        }));
      }
      return created;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || err.message || "Failed to create review.",
        loading: false
      });
      return null;
    }
  },

  updateReview: async (id: string, payload: UpdateReviewPayload) => {
    set({ loading: true, error: null });
    try {
      const updated = await reviewService.updateReview(id, payload);
      set((state) => ({
        reviews: state.reviews.map((r) => (r.id === id ? updated : r)),
        selectedReview: state.selectedReview?.id === id ? updated : state.selectedReview,
        loading: false
      }));
      return updated;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || err.message || "Failed to update review.",
        loading: false
      });
      return null;
    }
  },

  deleteReview: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await reviewService.deleteReview(id);
      set((state) => ({
        reviews: state.reviews.filter((r) => r.id !== id),
        selectedReview: state.selectedReview?.id === id ? null : state.selectedReview,
        loading: false
      }));
      return true;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || err.message || "Failed to delete review.",
        loading: false
      });
      return false;
    }
  },

  checkEligibility: async (bookingId: string, targetUserId?: string) => {
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
    } catch (err: any) {
      console.error("Dashboard analytics error:", err);
    }
  },

  fetchAdminAnalytics: async () => {
    try {
      const data = await reviewService.getAdminAnalytics();
      set({ adminAnalytics: data });
    } catch (err: any) {
      console.error("Admin analytics error:", err);
    }
  },

  fetchProfileAnalytics: async (userId: string) => {
    try {
      const data = await reviewService.getProfileAnalytics(userId);
      set((state) => ({
        profileAnalyticsMap: {
          ...state.profileAnalyticsMap,
          [userId]: data
        }
      }));
      return data;
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
      console.error("Moderation stats error:", err);
    }
  },

  fetchModerationHistory: async (reviewId) => {
    try {
      const res = await reviewService.getModerationHistory({ review_id: reviewId });
      set({ moderationHistory: res.items });
    } catch (err: any) {
      console.error("Moderation history error:", err);
    }
  },

  reportReview: async (reviewId: string, payload: ReportReviewPayload) => {
    try {
      const report = await reviewService.reportReview(reviewId, payload);
      set((state) => ({
        reports: [report, ...state.reports]
      }));
      return report;
    } catch (err: any) {
      console.error("Report review error:", err);
      return null;
    }
  },

  setFilters: (newFilters: Partial<ReviewFiltersPayload>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: newFilters.page ?? 1 }
    }));
  },

  resetFilters: () => {
    set({ filters: initialFilters });
  },

  setSelectedReview: (review: Review | null) => {
    set({ selectedReview: review });
  }
}));
