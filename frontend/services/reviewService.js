import { api } from "./api";
import { isPreviewActive, toastMutationBlocked } from "@/utils/dev-mode";
import { mockReviewsResponse } from "@/utils/preview-fixtures";

export const reviewService = {
  createReview: async (payload) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.post("/reviews", payload);
    return response.data.data;
  },

  updateReview: async (id, payload) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put(`/reviews/${id}`, payload);
    return response.data.data;
  },

  deleteReview: async (id) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.delete(`/reviews/${id}`);
    return response.data.data;
  },

  getReview: async (id) => {
    if (isPreviewActive()) {
      return Promise.resolve({
        id,
        rating: 5,
        review_title: "Excellent Gigs",
        review_text: "Wonderful experience",
        comment: "Wonderful experience",
        is_public: true,
        images: [],
        videos: [],
        created_at: new Date().toISOString()
      });
    }
    const response = await api.get(`/reviews/${id}`);
    return response.data.data;
  },

  listReviews: async (params) => {
    if (isPreviewActive()) {
      const items = (mockReviewsResponse.reviews || []).map((r) => ({
        id: r.id,
        rating: r.rating,
        review_text: r.comment,
        comment: r.comment,
        is_public: true,
        reply_comment: r.reply_comment,
        reply_at: r.reply_at,
        images: r.images || [],
        videos: r.videos || [],
        client: r.client,
        created_at: r.created_at
      }));
      return Promise.resolve({
        items,
        pagination: { total: items.length, page: 1, limit: 20, pages: 1 }
      });
    }
    const response = await api.get("/reviews", { params });
    return response.data.data;
  },

  getBookingReviews: async (bookingId) => {
    if (isPreviewActive()) return Promise.resolve([]);
    const response = await api.get(`/reviews/booking/${bookingId}`);
    return response.data.data;
  },

  getArtistReviews: async (params) => {
    if (isPreviewActive()) return Promise.resolve(mockReviewsResponse);
    const response = await api.get("/reviews/artist", { params });
    return response.data.data;
  },

  replyToReview: async (reviewId, replyComment) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put(`/reviews/${reviewId}/reply`, {
      reply_comment: replyComment
    });
    return response.data.data;
  },

  getVenueReviews: async (params) => {
    if (isPreviewActive()) return Promise.resolve(mockReviewsResponse);
    const response = await api.get("/reviews/venue", { params });
    return response.data.data;
  },

  replyToVenueReview: async (reviewId, replyComment) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put(`/reviews/venue/${reviewId}/reply`, {
      reply_comment: replyComment
    });
    return response.data.data;
  },

  getPublicVenueReviews: async (venueId, params) => {
    if (isPreviewActive()) return Promise.resolve(mockReviewsResponse);
    const response = await api.get(`/reviews/public/venue/${venueId}`, { params });
    return response.data.data;
  },

  checkEligibility: async (bookingId, targetUserId) => {
    if (isPreviewActive()) {
      return Promise.resolve({
        eligible: true,
        booking_id: bookingId,
        reviewer_id: "preview-user",
        already_reviewed: false
      });
    }
    const response = await api.get(`/reviews/eligibility/${bookingId}`, {
      params: { target_user_id: targetUserId }
    });
    return response.data.data;
  },

  getMyReviews: async (params) => {
    if (isPreviewActive()) {
      return Promise.resolve({
        items: [],
        pagination: { total: 0, page: 1, limit: 20, pages: 0 }
      });
    }
    const response = await api.get("/reviews/me", { params });
    return response.data.data;
  },

  getUserReviews: async (userId, params) => {
    if (isPreviewActive()) {
      return Promise.resolve({
        items: [],
        pagination: { total: 0, page: 1, limit: 20, pages: 0 }
      });
    }
    const response = await api.get(`/reviews/user/${userId}`, { params });
    return response.data.data;
  },

  // ─── ANALYTICS APIS (PHASE 4) ─────────────────────────────────────────────

  getSummary: async () => {
    if (isPreviewActive()) {
      return Promise.resolve({
        average_rating: 4.8,
        total_reviews: 42,
        rating_distribution: { 5: 35, 4: 5, 3: 2, 2: 0, 1: 0 }
      });
    }
    const response = await api.get("/reviews/summary");
    return response.data.data;
  },

  getStatistics: async (targetId) => {
    if (isPreviewActive()) {
      return Promise.resolve({
        average_rating: 4.9,
        total_reviews: 50,
        rating_distribution: { 5: 45, 4: 5 },
        five_star_ratio: 90.0,
        category_scores: { punctuality: 4.9, acoustics: 4.8, communication: 5.0, professionalism: 4.9 }
      });
    }
    const response = await api.get("/reviews/statistics", { params: { target_id: targetId } });
    return response.data.data;
  },

  getProfileAnalytics: async (userId) => {
    if (isPreviewActive()) {
      return Promise.resolve({
        average_rating: 4.9,
        total_reviews: 28,
        rating_distribution: { 5: 25, 4: 3, 3: 0, 2: 0, 1: 0 },
        five_star_ratio: 89.3,
        public_reviews_count: 28,
        private_reviews_count: 0,
        recent_reviews: [],
        trend: [
          { period: "Jan 2026", average_rating: 4.8, count: 4 },
          { period: "Feb 2026", average_rating: 4.9, count: 6 },
          { period: "Mar 2026", average_rating: 5.0, count: 5 }
        ]
      });
    }
    const response = await api.get(`/reviews/profile/${userId}`);
    return response.data.data;
  },

  getDashboardAnalytics: async () => {
    if (isPreviewActive()) {
      return Promise.resolve({
        average_rating: 4.9,
        total_reviews: 34,
        five_star_count: 30,
        five_star_ratio: 88.2,
        growth_percentage: 15.4,
        pending_reviews_count: 2,
        recent_reviews: [],
        latest_ratings: []
      });
    }
    const response = await api.get("/reviews/dashboard");
    return response.data.data;
  },

  getAdminAnalytics: async () => {
    if (isPreviewActive()) {
      return Promise.resolve({
        platform_average_rating: 4.85,
        total_reviews: 148,
        reviews_today: 4,
        reviews_this_week: 18,
        reviews_this_month: 62,
        growth_percentage: 12.5,
        top_rated_artists: [],
        top_rated_venues: [],
        lowest_rated_accounts: [],
        most_active_reviewers: [],
        activity_breakdown: [],
        role_comparison: []
      });
    }
    const response = await api.get("/reviews/admin");
    return response.data.data;
  },

  getMarketplaceAnalytics: async () => {
    if (isPreviewActive()) {
      return Promise.resolve({
        highest_rated_artists: [],
        highest_rated_venues: [],
        most_reviewed_artists: [],
        most_reviewed_venues: [],
        trending_artists: [],
        trending_venues: []
      });
    }
    const response = await api.get("/reviews/marketplace");
    return response.data.data;
  },

  getTopRated: async (limit = 5) => {
    if (isPreviewActive()) return Promise.resolve({ artists: [], venues: [] });
    const response = await api.get("/reviews/top-rated", { params: { limit } });
    return response.data.data;
  },

  getMostReviewed: async (limit = 5) => {
    if (isPreviewActive()) return Promise.resolve({ artists: [], venues: [] });
    const response = await api.get("/reviews/most-reviewed", { params: { limit } });
    return response.data.data;
  },

  getRecent: async (limit = 10) => {
    if (isPreviewActive()) return Promise.resolve([]);
    const response = await api.get("/reviews/recent", { params: { limit } });
    return response.data.data;
  },

  // ─── MODERATION APIS (PHASE 5) ─────────────────────────────────────────────

  reportReview: async (reviewId, payload) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.post(`/reviews/${reviewId}/report`, payload);
    return response.data.data;
  },

  getReports: async (params) => {
    if (isPreviewActive()) {
      return Promise.resolve({
        items: [],
        pagination: { total: 0, page: 1, limit: 20, pages: 0 }
      });
    }
    const response = await api.get("/reviews/reports", { params });
    return response.data.data;
  },

  getReportDetail: async (reportId) => {
    if (isPreviewActive()) {
      return Promise.resolve({
        id: reportId,
        review_id: "preview-review-id",
        reported_by: "preview-user-id",
        reason: "Harassment",
        description: "Inappropriate review text",
        status: "pending",
        created_at: new Date().toISOString()
      });
    }
    const response = await api.get(`/reviews/reports/${reportId}`);
    return response.data.data;
  },

  updateReport: async (reportId, payload) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.patch(`/reviews/reports/${reportId}`, payload);
    return response.data.data;
  },

  hideReview: async (reviewId, notes) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.post(`/reviews/${reviewId}/hide`, { action: "hide", moderator_notes: notes });
    return response.data.data;
  },

  restoreReview: async (reviewId, notes) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.post(`/reviews/${reviewId}/restore`, { action: "restore", moderator_notes: notes });
    return response.data.data;
  },

  removeReview: async (reviewId, notes) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.post(`/reviews/${reviewId}/remove`, { action: "remove", moderator_notes: notes });
    return response.data.data;
  },

  archiveReview: async (reviewId, notes) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.post(`/reviews/${reviewId}/archive`, { action: "archive", moderator_notes: notes });
    return response.data.data;
  },

  getModerationHistory: async (params) => {
    if (isPreviewActive()) return Promise.resolve({ items: [], total: 0 });
    const response = await api.get("/reviews/moderation/history", { params });
    return response.data.data;
  },

  getModerationStats: async () => {
    if (isPreviewActive()) {
      return Promise.resolve({
        pending_reports_count: 3,
        under_review_count: 1,
        hidden_reviews_count: 5,
        flagged_reviews_count: 2,
        total_moderated_count: 14
      });
    }
    const response = await api.get("/reviews/moderation/dashboard");
    return response.data.data;
  }
};
