import { api } from "./api";
import { isPreviewActive, toastMutationBlocked } from "@/utils/dev-mode";
import { mockBookingsList, mockBookingDetail } from "@/utils/preview-fixtures";

export const bookingService = {
  getMyBookings: async (params) => {
    if (isPreviewActive()) return Promise.resolve(mockBookingsList);
    const response = await api.get("/band/bookings/my", { params });
    const payload = response.data?.data || response.data;
    return payload?.items || payload?.bookings || (Array.isArray(payload) ? payload : []);
  },

  getArtistBookings: async (params) => {
    if (isPreviewActive()) return Promise.resolve(mockBookingsList);
    const response = await api.get("/band/bookings/artist", { params });
    const payload = response.data?.data || response.data;
    return payload?.items || payload?.bookings || (Array.isArray(payload) ? payload : []);
  },

  getClientBookings: async (params) => {
    if (isPreviewActive()) return Promise.resolve(mockBookingsList);
    const response = await api.get("/band/bookings/client", { params });
    const payload = response.data?.data || response.data;
    return payload?.items || payload?.bookings || (Array.isArray(payload) ? payload : []);
  },

  createBooking: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.post("/band/bookings", data);
    return response.data?.data || response.data;
  },

  getBookingDetails: async (bookingId) => {
    if (isPreviewActive()) return Promise.resolve(mockBookingDetail);
    const response = await api.get(`/band/bookings/${bookingId}`);
    return response.data?.data || response.data;
  },

  acceptBooking: async (bookingId) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.post(`/band/bookings/${bookingId}/accept`);
    return response.data?.data || response.data;
  },

  rejectBooking: async (bookingId) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.post(`/band/bookings/${bookingId}/decline`);
    return response.data?.data || response.data;
  },

  completeBooking: async (bookingId) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put(`/band/bookings/${bookingId}/complete`);
    return response.data?.data || response.data;
  },

  counterOffer: async (bookingId, counterPrice, message) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.post(`/band/bookings/${bookingId}/counter`, {
      proposed_price: counterPrice,
      note: message
    });
    return response.data?.data || response.data;
  },

  cancelBooking: async (bookingId, reason) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.post(`/band/bookings/${bookingId}/cancel`, null, { params: { reason } });
    return response.data?.data || response.data;
  },

  getVenueBookings: async (params) => {
    if (isPreviewActive()) return Promise.resolve(mockBookingsList);
    const response = await api.get("/band/bookings/venue", { params });
    const payload = response.data?.data || response.data;
    return payload?.items || payload?.bookings || (Array.isArray(payload) ? payload : []);
  },

  getVenueBookingDetails: async (bookingId) => {
    if (isPreviewActive()) return Promise.resolve(mockBookingDetail);
    const response = await api.get(`/band/bookings/${bookingId}`);
    return response.data?.data || response.data;
  },

  acceptVenueBooking: async (bookingId) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put(`/band/bookings/venue/${bookingId}/accept`);
    return response.data.data;
  },

  rejectVenueBooking: async (bookingId) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put(`/band/bookings/venue/${bookingId}/reject`);
    return response.data.data;
  },

  completeVenueBooking: async (bookingId) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put(`/band/bookings/venue/${bookingId}/complete`);
    return response.data.data;
  },

  cancelVenueBooking: async (bookingId, reason) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put(`/band/bookings/venue/${bookingId}/cancel`, { reason });
    return response.data.data;
  },

  addBookingNote: async (bookingId, content) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.post(`/band/bookings/${bookingId}/notes`, { content });
    return response.data.data;
  },

  adminGetBookings: async (params) => {
    if (isPreviewActive()) return Promise.resolve(mockBookingsList);
    const response = await api.get("/band/admin/bookings", { params });
    return response.data.data;
  },

  adminResolveDispute: async (bookingId, status, message) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put(`/band/admin/bookings/${bookingId}/dispute`, {
      status,
      message
    });
    return response.data.data;
  },
};
