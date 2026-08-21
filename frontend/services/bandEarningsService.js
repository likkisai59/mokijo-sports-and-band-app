import { api } from "./api";
import { isPreviewActive } from "@/utils/dev-mode";
import { mockEarningsSummary } from "@/utils/preview-fixtures";

export const bandEarningsService = {
  getEarningsSummary: async () => {
    if (isPreviewActive()) return Promise.resolve(mockEarningsSummary);
    const response = await api.get("/band/earnings/summary");
    return response.data?.data || response.data;
  },

  getVenueEarningsSummary: async () => {
    if (isPreviewActive()) return Promise.resolve(mockEarningsSummary);
    const response = await api.get("/band/earnings/summary");
    return response.data?.data || response.data;
  },

  requestWithdrawal: async (amount, description) => {
    if (isPreviewActive()) return Promise.resolve({});
    const response = await api.post("/band/earnings/withdraw", null, {
      params: { amount, description }
    });
    return response.data?.data || response.data;
  }
};
