import { api } from "./api";
import { VenueProfileUpdateFormData } from "@/utils/validation";
import { VenueResponseData, VenueDashboardData, VenueMediaData, VenueAvailabilityData, VenueConflictCheckRequest, VenueConflictCheckResponse, VenueFacilitiesData, VenuePricingData, VenueAnalyticsData, VenueDocumentsResubmitData, VenueSettingsData } from "@/types/venue";
import { isPreviewActive, toastMutationBlocked } from "@/utils/dev-mode";
import { mockVenueProfile, mockVenueDashboard, mockVenueAnalytics } from "@/utils/preview-fixtures";

export const venueService = {
  getDashboardStats: async (): Promise<VenueDashboardData> => {
    if (isPreviewActive()) return Promise.resolve(mockVenueDashboard);
    const response = await api.get<any>("/venues/me/dashboard");
    return response.data.data;
  },

  getProfile: async (): Promise<VenueResponseData> => {
    if (isPreviewActive()) return Promise.resolve(mockVenueProfile);
    const response = await api.get<any>("/venues/me");
    return response.data.data;
  },

  updateProfile: async (data: VenueProfileUpdateFormData): Promise<VenueResponseData> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put<any>("/venues/me", data);
    return response.data.data;
  },

  getMedia: async (): Promise<VenueMediaData> => {
    if (isPreviewActive()) {
      return Promise.resolve({
        cover_image: null,
        gallery: [],
        videos: [],
        youtube_links: ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
        virtual_tour: null
      });
    }
    const response = await api.get<any>("/venues/me/media");
    return response.data.data;
  },

  updateMedia: async (data: VenueMediaData): Promise<VenueMediaData> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put<any>("/venues/me/media", data);
    return response.data.data;
  },

  getAvailability: async (): Promise<VenueAvailabilityData> => {
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
    const response = await api.get<any>("/venues/me/availability");
    return response.data.data;
  },

  updateAvailability: async (data: Omit<VenueAvailabilityData, "bookings">): Promise<VenueAvailabilityData> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put<any>("/venues/me/availability", data);
    return response.data.data;
  },

  checkConflict: async (data: VenueConflictCheckRequest): Promise<VenueConflictCheckResponse> => {
    if (isPreviewActive()) return Promise.resolve({ conflict: false, reason: null });
    const response = await api.post<any>("/venues/me/availability/check-conflict", data);
    return response.data.data;
  },

  getFacilities: async (): Promise<VenueFacilitiesData> => {
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
    const response = await api.get<any>("/venues/me/facilities");
    return response.data.data;
  },

  updateFacilities: async (data: VenueFacilitiesData): Promise<VenueFacilitiesData> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put<any>("/venues/me/facilities", data);
    return response.data.data;
  },

  getPricing: async (): Promise<VenuePricingData> => {
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
    const response = await api.get<any>("/venues/me/pricing");
    return response.data.data;
  },

  updatePricing: async (data: VenuePricingData): Promise<VenuePricingData> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put<any>("/venues/me/pricing", data);
    return response.data.data;
  },

  getAnalytics: async (): Promise<VenueAnalyticsData> => {
    if (isPreviewActive()) return Promise.resolve(mockVenueAnalytics);
    const response = await api.get<any>("/venues/me/analytics");
    return response.data.data;
  },

  resubmitVerificationDocuments: async (data: VenueDocumentsResubmitData): Promise<VenueResponseData> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put<any>("/venues/me/verification/resubmit", data);
    return response.data.data;
  },

  updateVenueSettings: async (data: VenueSettingsData): Promise<VenueResponseData> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put<any>("/venues/me/settings", data);
    return response.data.data;
  },

  getPublicVenueDetail: async (id: string): Promise<VenueResponseData> => {
    if (isPreviewActive()) return Promise.resolve(mockVenueProfile);
    const response = await api.get<any>(`/venues/${id}`);
    return response.data.data;
  },

  getPublicVenues: async (params?: Record<string, unknown>): Promise<{ venues: VenueResponseData[]; total: number }> => {
    if (isPreviewActive()) return Promise.resolve({ venues: [mockVenueProfile], total: 1 });
    const response = await api.get<any>("/venues", { params });
    const d = response.data.data;
    // Backend returns PaginatedVenueList { items: [...], total: N }
    return { venues: d.items ?? d.venues ?? [], total: d.total ?? 0 };
  }
};
