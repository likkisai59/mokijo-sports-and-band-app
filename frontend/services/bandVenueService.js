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

  // Mocked Favorite methods for Sprint 10 until backend APIs are ready
  addFavoriteVenue: async (id) => {
    const key = `favorites_venues_${typeof window !== 'undefined' ? localStorage.getItem("bandconnect_user_id") || "guest" : "guest"}`;
    const favorites = JSON.parse(localStorage.getItem(key) || "[]");
    if (!favorites.includes(id)) {
      favorites.push(id);
      localStorage.setItem(key, JSON.stringify(favorites));
    }
    return Promise.resolve({ success: true });
  },

  removeFavoriteVenue: async (id) => {
    const key = `favorites_venues_${typeof window !== 'undefined' ? localStorage.getItem("bandconnect_user_id") || "guest" : "guest"}`;
    let favorites = JSON.parse(localStorage.getItem(key) || "[]");
    favorites = favorites.filter(favId => favId !== id);
    localStorage.setItem(key, JSON.stringify(favorites));
    return Promise.resolve({ success: true });
  },

  isFavoriteVenue: async (id) => {
    const key = `favorites_venues_${typeof window !== 'undefined' ? localStorage.getItem("bandconnect_user_id") || "guest" : "guest"}`;
    const favorites = JSON.parse(localStorage.getItem(key) || "[]");
    return Promise.resolve(favorites.includes(id));
  },

  getFavoriteVenues: async () => {
    const key = `favorites_venues_${typeof window !== 'undefined' ? localStorage.getItem("bandconnect_user_id") || "guest" : "guest"}`;
    const favorites = JSON.parse(localStorage.getItem(key) || "[]");
    if (favorites.length === 0) return Promise.resolve([]);
    if (isPreviewActive()) return Promise.resolve([]);
    
    try {
      const promises = favorites.map(id => bandApi.get(`/venues/${id}`).then(res => res.data).catch(() => null));
      const results = await Promise.all(promises);
      return results.filter(r => r !== null);
    } catch (e) {
      return Promise.resolve([]);
    }
  }
};
