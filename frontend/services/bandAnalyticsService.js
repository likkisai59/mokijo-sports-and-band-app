import { API_BASE_URL } from "@/lib/bandApi";
import { isPreviewActive } from "@/utils/preview-fixtures";
import { mockArtistAnalytics } from "@/utils/preview-fixtures";

const getAuthToken = () => {
    if (typeof window !== "undefined") {
        return localStorage.getItem("bandAccessToken");
    }
    return null;
};

const getHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const bandAnalyticsService = {
  getArtistAnalytics: async () => {
    if (isPreviewActive()) return Promise.resolve(mockArtistAnalytics);
    const response = await fetch(`${API_BASE_URL}/band/artists/me/analytics`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch artist analytics");
    const json = await response.json();
    return json;
  },

  getVenueAnalytics: async () => {
    if (isPreviewActive()) return Promise.resolve(mockArtistAnalytics); // fallback to artist mock for venue if none
    const response = await fetch(`${API_BASE_URL}/band/venues/me/analytics`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch venue analytics");
    const json = await response.json();
    return json;
  }
};
