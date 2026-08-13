import bandApi from "@/lib/bandApi";
import { isPreviewActive, toastMutationBlocked } from "@/utils/dev-mode";
import { mockArtistProfile, mockArtistDashboard, mockArtistAnalytics } from "@/utils/preview-fixtures";

export const bandArtistService = {
  getDashboardStats: async () => {
    if (isPreviewActive()) return Promise.resolve(mockArtistDashboard);
    const response = await bandApi.get("/artists/me/dashboard");
    return response.data;
  },

  getProfile: async () => {
    if (isPreviewActive()) return Promise.resolve(mockArtistProfile);
    const response = await bandApi.get("/artists/me");
    return response.data;
  },

  updateProfile: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await bandApi.put("/artists/me", data);
    return response.data;
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
    const response = await bandApi.get("/artists/me/availability");
    return response.data;
  },

  updateAvailability: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await bandApi.put("/artists/me/availability", data);
    return response.data;
  },

  checkConflict: async (date, startTime, endTime) => {
    if (isPreviewActive()) return Promise.resolve({ has_conflict: false, reason: null });
    const response = await bandApi.post("/artists/me/availability/check-conflict", {
      date,
      start_time: startTime,
      end_time: endTime
    });
    return response.data;
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
    const response = await bandApi.get("/artists/me/media");
    return response.data;
  },

  updateMedia: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await bandApi.put("/artists/me/media", data);
    return response.data;
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
    const response = await bandApi.get("/artists/me/pricing");
    return response.data;
  },

  updatePricing: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await bandApi.put("/artists/me/pricing", data);
    return response.data;
  },

  getAnalytics: async () => {
    if (isPreviewActive()) return Promise.resolve(mockArtistAnalytics);
    const response = await bandApi.get("/artists/me/analytics");
    return response.data;
  },

  getPublicArtists: async (params) => {
    if (isPreviewActive()) {
      return Promise.resolve({ artists: [mockArtistProfile], total: 1 });
    }
    const response = await bandApi.get("/artists", { params });
    return response.data;
  },

  getPublicArtistDetail: async (id) => {
    if (isPreviewActive()) return Promise.resolve(mockArtistProfile);
    const response = await bandApi.get(`/artists/${id}`);
    return response.data;
  },

  // Favorites using live backend APIs
  addFavoriteArtist: async (id) => {
    const response = await bandApi.post(`/favorites/artists/${id}`);
    return response.data;
  },

  removeFavoriteArtist: async (id) => {
    const response = await bandApi.delete(`/favorites/artists/${id}`);
    return response.data;
  },

  isFavoriteArtist: async (id) => {
    try {
      const response = await bandApi.get(`/favorites/artists/check/${id}`);
      return response.data.is_favorite;
    } catch (e) {
      return false;
    }
  },

  getFavoriteArtists: async () => {
    const response = await bandApi.get("/favorites/artists");
    return response.data;
  }
};
