import { api } from "./api";
import { ArtistProfileUpdateFormData } from "@/utils/validation";
import { ArtistProfile, ArtistDashboardData, AvailabilityData, MediaGalleryData, PricingData } from "@/types/artist";
import { ArtistAnalytics } from "@/types/analytics";
import { isPreviewActive, toastMutationBlocked } from "@/utils/dev-mode";
import { mockArtistProfile, mockArtistDashboard, mockArtistAnalytics } from "@/utils/preview-fixtures";

export const artistService = {
  getDashboardStats: async (): Promise<ArtistDashboardData> => {
    if (isPreviewActive()) return Promise.resolve(mockArtistDashboard);
    const response = await api.get<any>("/artists/me/dashboard");
    return response.data.data;
  },

  getProfile: async (): Promise<ArtistProfile> => {
    if (isPreviewActive()) return Promise.resolve(mockArtistProfile);
    const response = await api.get<any>("/artists/me");
    return response.data.data;
  },

  updateProfile: async (data: ArtistProfileUpdateFormData): Promise<ArtistProfile> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put<any>("/artists/me", data);
    return response.data.data;
  },

  getAvailability: async (): Promise<AvailabilityData> => {
    if (isPreviewActive()) {
      return Promise.resolve({
        weekly_schedule: mockArtistProfile.availability.weekly_schedule,
        break_time: mockArtistProfile.availability.break_time,
        blocked_dates: mockArtistProfile.availability.blocked_dates,
        holidays: mockArtistProfile.availability.holidays
      });
    }
    const response = await api.get<any>("/artists/me/availability");
    return response.data.data;
  },

  updateAvailability: async (data: AvailabilityData): Promise<AvailabilityData> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put<any>("/artists/me/availability", data);
    return response.data.data;
  },

  checkConflict: async (date: string, startTime: string, endTime: string): Promise<{ has_conflict: boolean; reason: string | null }> => {
    if (isPreviewActive()) return Promise.resolve({ has_conflict: false, reason: null });
    const response = await api.post<any>("/artists/me/availability/check-conflict", {
      date,
      start_time: startTime,
      end_time: endTime
    });
    return response.data.data;
  },

  getMedia: async (): Promise<MediaGalleryData> => {
    if (isPreviewActive()) {
      return Promise.resolve({
        gallery: mockArtistProfile.gallery,
        videos: mockArtistProfile.videos,
        youtube_links: mockArtistProfile.youtube_links,
        instagram_reels: mockArtistProfile.instagram_reels
      });
    }
    const response = await api.get<any>("/artists/me/media");
    return response.data.data;
  },

  updateMedia: async (data: MediaGalleryData): Promise<MediaGalleryData> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put<any>("/artists/me/media", data);
    return response.data.data;
  },

  getPricing: async (): Promise<PricingData> => {
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
    const response = await api.get<any>("/artists/me/pricing");
    return response.data.data;
  },

  updatePricing: async (data: PricingData): Promise<PricingData> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put<any>("/artists/me/pricing", data);
    return response.data.data;
  },

  getAnalytics: async (): Promise<ArtistAnalytics> => {
    if (isPreviewActive()) return Promise.resolve(mockArtistAnalytics);
    const response = await api.get<any>("/artists/me/analytics");
    return response.data.data;
  },

  getPublicArtists: async (params?: Record<string, unknown>): Promise<{ artists: ArtistProfile[]; total: number }> => {
    if (isPreviewActive()) {
      return Promise.resolve({ artists: [mockArtistProfile], total: 1 });
    }
    const response = await api.get<any>("/artists", { params });
    // Handle both { artists: [...] } and directly returning paginated data
    return response.data.data;
  },

  getPublicArtistDetail: async (id: string): Promise<ArtistProfile> => {
    if (isPreviewActive()) return Promise.resolve(mockArtistProfile);
    const response = await api.get<any>(`/artists/${id}`);
    return response.data.data;
  }
};
