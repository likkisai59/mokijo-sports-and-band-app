import { api } from "./api";
import { EarningsSummary } from "@/types/earnings";
import { isPreviewActive } from "@/utils/dev-mode";
import { mockEarningsSummary } from "@/utils/preview-fixtures";

export const earningsService = {
  getEarningsSummary: async (): Promise<EarningsSummary> => {
    if (isPreviewActive()) return Promise.resolve(mockEarningsSummary);
    const response = await api.get<any>("/earnings/artist");
    return response.data.data;
  },

  getVenueEarningsSummary: async (): Promise<EarningsSummary> => {
    if (isPreviewActive()) return Promise.resolve(mockEarningsSummary);
    const response = await api.get<any>("/earnings/venue");
    return response.data.data;
  }
};
