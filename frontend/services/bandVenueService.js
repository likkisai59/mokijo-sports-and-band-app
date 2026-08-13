import bandApi from "@/lib/bandApi";
import { isPreviewActive, toastMutationBlocked } from "@/utils/dev-mode";

export const bandVenueService = {
  getDashboardStats: async () => {
    if (isPreviewActive()) return Promise.resolve({ total_bookings: 0, active_bookings: 0 });
    const response = await bandApi.get("/venues/me/dashboard");
    return response.data;
  },

  getProfile: async () => {
    if (isPreviewActive()) return Promise.resolve({});
    const response = await bandApi.get("/venues/me");
    return response.data;
  },

  updateProfile: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await bandApi.put("/venues/me", data);
    return response.data;
  },

  getMedia: async () => {
    if (isPreviewActive()) return Promise.resolve({ gallery: [] });
    const response = await bandApi.get("/venues/me/media");
    return response.data;
  },

  updateMedia: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await bandApi.put("/venues/me/media", data);
    return response.data;
  },

  getAvailability: async () => {
    if (isPreviewActive()) return Promise.resolve({});
    const response = await bandApi.get("/venues/me/availability");
    return response.data;
  },

  updateAvailability: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await bandApi.put("/venues/me/availability", data);
    return response.data;
  },

  getFacilities: async () => {
    if (isPreviewActive()) return Promise.resolve({ facilities: [] });
    const response = await bandApi.get("/venues/me/facilities");
    return response.data;
  },

  updateFacilities: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await bandApi.put("/venues/me/facilities", data);
    return response.data;
  },

  getPricing: async () => {
    if (isPreviewActive()) return Promise.resolve({});
    const response = await bandApi.get("/venues/me/pricing");
    return response.data;
  },

  updatePricing: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await bandApi.put("/venues/me/pricing", data);
    return response.data;
  },

  getAnalytics: async () => {
    if (isPreviewActive()) return Promise.resolve({});
    const response = await bandApi.get("/venues/me/analytics");
    return response.data;
  },

  updateVenueSettings: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await bandApi.put("/venues/me/settings", data);
    return response.data;
  },

  getPublicVenueDetail: async (id) => {
    if (isPreviewActive()) return Promise.resolve({});
    const response = await bandApi.get(`/venues/${id}`);
    return response.data;
  },

  getPublicVenues: async (params) => {
    if (isPreviewActive()) return Promise.resolve({ venues: [], total: 0 });
    const response = await bandApi.get("/venues", { params });
    return response.data;
  },

  // Favorites using live backend APIs
  addFavoriteVenue: async (id) => {
    const response = await bandApi.post(`/favorites/venues/${id}`);
    return response.data;
  },

  removeFavoriteVenue: async (id) => {
    const response = await bandApi.delete(`/favorites/venues/${id}`);
    return response.data;
  },

  isFavoriteVenue: async (id) => {
    try {
      const response = await bandApi.get(`/favorites/venues/check/${id}`);
      return response.data.is_favorite;
    } catch (e) {
      return false;
    }
  },

  getFavoriteVenues: async () => {
    const response = await bandApi.get("/favorites/venues");
    return response.data;
  }
};
