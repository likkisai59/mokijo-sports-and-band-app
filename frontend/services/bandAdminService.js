import bandApi from "@/lib/bandApi";

/**
 * Service for BandConnect Admin specific operations.
 * Currently proxies shared APIs or mocks missing backend endpoints 
 * since Sprint 9 is purely a frontend recovery phase.
 */
export const bandAdminService = {
  getOverviewStats: async () => {
    try {
      // For now, reuse review analytics as a proxy or mock data
      const res = await bandApi.get("/reviews/admin/analytics");
      return res.data;
    } catch (error) {
      // Fallback mock data if the API is missing/fails
      return {
        platform_average_rating: 4.85,
        total_reviews: 148,
        growth_percentage: 12.5,
        activity_breakdown: [],
        role_comparison: [],
        top_rated_artists: []
      };
    }
  },

  getPendingVerifications: async () => {
    // Mocking since backend verification API isn't isolated yet
    return [
      { id: "1", name: "The Metal Core", type: "Band", email: "metal@core.in", time: "10 min ago" },
      { id: "2", name: "Royal Plaza Turf", type: "Venue", email: "plaza@royal.com", time: "1 hour ago" },
      { id: "3", name: "Jazz Elements Trio", type: "Band", email: "elements@jazz.org", time: "2 hours ago" },
    ];
  },

  approveProfile: async (id) => {
    return { success: true, id };
  },

  rejectProfile: async (id) => {
    return { success: true, id };
  },
};
