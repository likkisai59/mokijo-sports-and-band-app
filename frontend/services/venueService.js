import { api } from "./api";
import { isPreviewActive, toastMutationBlocked } from "@/utils/dev-mode";
import { mockVenueProfile, mockVenueDashboard, mockVenueAnalytics } from "@/utils/preview-fixtures";

export const venueService = {
  getDashboardStats: async () => {
    if (isPreviewActive()) return Promise.resolve(mockVenueDashboard);
    const response = await api.get("/venues/me/dashboard");
    return response.data.data;
  },

  getProfile: async () => {
    if (isPreviewActive()) return Promise.resolve(mockVenueProfile);
    const response = await api.get("/venues/me");
    return response.data.data;
  },

  updateProfile: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put("/venues/me", data);
    return response.data.data;
  },

  getMedia: async () => {
    if (isPreviewActive()) {
      return Promise.resolve({
        cover_image: null,
        gallery: [],
        videos: [],
        youtube_links: ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
        virtual_tour: null
      });
    }
    const response = await api.get("/venues/me/media");
    return response.data.data;
  },

  updateMedia: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put("/venues/me/media", data);
    return response.data.data;
  },

  getAvailability: async () => {
    if (isPreviewActive()) {
      return Promise.resolve({
        weekly_schedule: {
          Monday: { available: true, start: "08:00", end: "23:00" },
          Tuesday: { available: true, start: "08:00", end: "23:00" },
          Wednesday: { available: true, start: "08:00", end: "23:00" },
          Thursday: { available: true, start: "08:00", end: "23:00" },
          Friday: { available: true, start: "08:00", end: "23:59" },
          Saturday: { available: true, start: "08:00", end: "23:59" },
          Sunday: { available: true, start: "09:00", end: "22:00" }
        },
        blocked_dates: ["2026-08-10"],
        maintenance_days: ["2026-07-29"],
        public_holidays: [],
        booking_buffer_time: 2,
        bookings: []
      });
    }
    const response = await api.get("/venues/me/availability");
    return response.data.data;
  },

  updateAvailability: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put("/venues/me/availability", data);
    return response.data.data;
  },

  checkConflict: async (data) => {
    if (isPreviewActive()) return Promise.resolve({ conflict: false, reason: null });
    const response = await api.post("/venues/me/availability/check-conflict", data);
    return response.data.data;
  },

  getFacilities: async () => {
    if (isPreviewActive()) {
      return Promise.resolve({
        facilities: [
          "ac",
          "parking",
          "stage",
          "sound_system",
          "changing_rooms",
          "power_backup"
        ],
        details: {}
      });
    }
    const response = await api.get("/venues/me/facilities");
    return response.data.data;
  },

  updateFacilities: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put("/venues/me/facilities", data);
    return response.data.data;
  },

  getPricing: async () => {
    if (isPreviewActive()) {
      return Promise.resolve({
        base_price: 75000,
        hourly_price: 5000,
        half_day_price: 35000,
        full_day_price: 75000,
        weekend_price: 85000,
        holiday_price: 95000,
        security_deposit: 15000,
        cleaning_charges: 3000,
        cancellation_charges: 5000,
        discounts: [],
        tax_percentage: 18,
        currency: "INR"
      });
    }
    const response = await api.get("/venues/me/pricing");
    return response.data.data;
  },

  updatePricing: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put("/venues/me/pricing", data);
    return response.data.data;
  },

  getAnalytics: async () => {
    if (isPreviewActive()) return Promise.resolve(mockVenueAnalytics);
    const response = await api.get("/venues/me/analytics");
    return response.data.data;
  },

  resubmitVerificationDocuments: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put("/venues/me/verification/resubmit", data);
    return response.data.data;
  },

  updateVenueSettings: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put("/venues/me/settings", data);
    return response.data.data;
  },

  getPublicVenueDetail: async (id) => {
    if (isPreviewActive()) return Promise.resolve(mockVenueProfile);
    const response = await api.get(`/venues/${id}`);
    return response.data.data;
  },

  getPublicVenues: async (params) => {
    if (isPreviewActive()) return Promise.resolve({ venues: [mockVenueProfile], total: 1 });
    const response = await api.get("/venues", { params });
    const d = response.data.data;
    return { venues: d.items ?? d.venues ?? [], total: d.total ?? 0 };
  }
};
