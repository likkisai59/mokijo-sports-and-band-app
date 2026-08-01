import { api } from "./api";
import { isPreviewActive, toastMutationBlocked } from "@/utils/dev-mode";
import { mockArtistProfile, mockArtistDashboard, mockArtistAnalytics } from "@/utils/preview-fixtures";

export const artistService = {
  getDashboardStats: async () => {
    if (isPreviewActive()) return Promise.resolve(mockArtistDashboard);
    const response = await api.get("/artists/me/dashboard");
    return response.data.data;
  },

  getProfile: async () => {
    if (isPreviewActive()) return Promise.resolve(mockArtistProfile);
    const response = await api.get("/artists/me");
    return response.data.data;
  },

  updateProfile: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put("/artists/me", data);
    return response.data.data;
  },

  getAvailability: async () => {
    if (isPreviewActive()) {
      return Promise.resolve({
        weekly_schedule: mockArtistProfile.availability.weekly_schedule,
        break_time: mockArtistProfile.availability.break_time,
        blocked_dates: mockArtistProfile.availability.blocked_dates,
        holidays: mockArtistProfile.availability.holidays
      });
    }
    const response = await api.get("/artists/me/availability");
    return response.data.data;
  },

  updateAvailability: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put("/artists/me/availability", data);
    return response.data.data;
  },

  checkConflict: async (date, startTime, endTime) => {
    if (isPreviewActive()) return Promise.resolve({ has_conflict: false, reason: null });
    const response = await api.post("/artists/me/availability/check-conflict", {
      date,
      start_time: startTime,
      end_time: endTime
    });
    return response.data.data;
  },

  getMedia: async () => {
    if (isPreviewActive()) {
      return Promise.resolve({
        gallery: mockArtistProfile.gallery,
        videos: mockArtistProfile.videos,
        youtube_links: mockArtistProfile.youtube_links,
        instagram_reels: mockArtistProfile.instagram_reels
      });
    }
    const response = await api.get("/artists/me/media");
    return response.data.data;
  },

  updateMedia: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put("/artists/me/media", data);
    return response.data.data;
  },

  getPricing: async () => {
    if (isPreviewActive()) {
      return Promise.resolve({
        base_rate: mockArtistProfile.base_rate,
        currency: mockArtistProfile.currency,
        travel_charges: mockArtistProfile.travel_charges,
        min_booking_hours: mockArtistProfile.min_booking_hours,
        max_booking_hours: mockArtistProfile.max_booking_hours,
        weekend_surcharge: 0,
        holiday_surcharge: 0,
        packages: [],
        special_offers: []
      });
    }
    const response = await api.get("/artists/me/pricing");
    return response.data.data;
  },

  updatePricing: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put("/artists/me/pricing", data);
    return response.data.data;
  },

  getAnalytics: async () => {
    if (isPreviewActive()) return Promise.resolve(mockArtistAnalytics);
    const response = await api.get("/artists/me/analytics");
    return response.data.data;
  },

  getPublicArtists: async (params) => {
    if (isPreviewActive()) {
      return Promise.resolve({ artists: [mockArtistProfile], total: 1 });
    }
    const response = await api.get("/artists", { params });
    return response.data.data;
  },

  getPublicArtistDetail: async (id) => {
    if (isPreviewActive()) return Promise.resolve(mockArtistProfile);
    const response = await api.get(`/artists/${id}`);
    return response.data.data;
  }
};
