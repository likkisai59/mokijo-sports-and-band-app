import bandApi from "@/lib/bandApi";

/**
 * Service for BandConnect Admin specific operations.
 * Currently proxies shared APIs or mocks missing backend endpoints 
 * since Sprint 9 is purely a frontend recovery phase.
 */
export const bandAdminService = {
  getOverviewStats: async () => {
    try {
      const res = await bandApi.get("/reviews/admin/analytics");
      return res.data;
    } catch (error) {
      return {
        platform_average_rating: 0,
        total_reviews: 0,
        growth_percentage: 0,
        activity_breakdown: [],
        role_comparison: [],
        top_rated_artists: []
      };
    }
  },

  getPendingVerifications: async () => {
    try {
      const artistsRes = await bandApi.get("/admin/artists?verification_status=pending");
      const venuesRes = await bandApi.get("/admin/venues?verification_status=pending");
      
      const artists = (artistsRes.data?.items || []).map(a => ({
        id: a.id,
        name: a.display_name || a.username,
        type: "Band",
        email: "Artist",
        time: a.created_at || "Recent"
      }));

      const venues = (venuesRes.data?.items || []).map(v => ({
        id: v.id,
        name: v.name,
        type: "Venue",
        email: "Venue",
        time: v.created_at || "Recent"
      }));

      return [...artists, ...venues];
    } catch (error) {
      return [];
    }
  },

  approveProfile: async (id, type) => {
    const route = type === "Band" ? "artists" : "venues";
    const res = await bandApi.put(`/admin/${route}/${id}/verify`, {
      verification_status: "approved",
      verification_notes: "Approved by Admin"
    });
    return { success: true, data: res.data };
  },

  rejectProfile: async (id, type) => {
    const route = type === "Band" ? "artists" : "venues";
    const res = await bandApi.put(`/admin/${route}/${id}/verify`, {
      verification_status: "rejected",
      verification_notes: "Rejected by Admin"
    });
    return { success: true, data: res.data };
  },
};
