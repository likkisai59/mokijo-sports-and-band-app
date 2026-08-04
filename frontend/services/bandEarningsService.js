import { API_BASE_URL } from "@/lib/bandApi";
import { isPreviewActive } from "@/utils/preview-fixtures";
import { mockEarningsSummary } from "@/utils/preview-fixtures";

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

export const bandEarningsService = {
  getEarningsSummary: async () => {
    if (isPreviewActive()) return Promise.resolve(mockEarningsSummary);
    const response = await fetch(`${API_BASE_URL}/band/earnings/artist`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch artist earnings");
    const json = await response.json();
    return json;
  },

  getVenueEarningsSummary: async () => {
    if (isPreviewActive()) return Promise.resolve(mockEarningsSummary);
    const response = await fetch(`${API_BASE_URL}/band/earnings/venue`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch venue earnings");
    const json = await response.json();
    return json;
  }
};
