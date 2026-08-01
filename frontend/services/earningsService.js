import { api } from "./api";
import { isPreviewActive } from "@/utils/dev-mode";
import { mockEarningsSummary } from "@/utils/preview-fixtures";

export const earningsService = {
  getEarningsSummary: async () => {
    if (isPreviewActive()) return Promise.resolve(mockEarningsSummary);
    const response = await api.get("/earnings/artist");
    return response.data.data;
  },

  getVenueEarningsSummary: async () => {
    if (isPreviewActive()) return Promise.resolve(mockEarningsSummary);
    const response = await api.get("/earnings/venue");
    return response.data.data;
  }
};
