import { api } from "./api";
import { isPreviewActive, toastMutationBlocked } from "@/utils/dev-mode";
import { mockBookingsList, mockBookingDetail } from "@/utils/preview-fixtures";

export const bookingService = {
  getArtistBookings: async (params) => {
    if (isPreviewActive()) return Promise.resolve(mockBookingsList);
    const response = await api.get("/bookings/artist", { params });
    return response.data.data;
  },

  getClientBookings: async (params) => {
    if (isPreviewActive()) return Promise.resolve(mockBookingsList);
    const response = await api.get("/bookings/client", { params });
    return response.data.data;
  },

  createBooking: async (data) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.post("/bookings", data);
    return response.data.data;
  },

  getBookingDetails: async (bookingId) => {
    if (isPreviewActive()) return Promise.resolve(mockBookingDetail);
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data.data;
  },

  acceptBooking: async (bookingId) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put(`/bookings/${bookingId}/accept`);
    return response.data.data;
  },

  rejectBooking: async (bookingId) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put(`/bookings/${bookingId}/reject`);
    return response.data.data;
  },

  counterOffer: async (bookingId, counterPrice, message) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put(`/bookings/${bookingId}/counter`, {
      counter_price: counterPrice,
      message
    });
    return response.data.data;
  },

  cancelBooking: async (bookingId, reason) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put(`/bookings/${bookingId}/cancel`, { reason });
    return response.data.data;
  },

  getVenueBookings: async (params) => {
    if (isPreviewActive()) return Promise.resolve(mockBookingsList);
    const response = await api.get("/bookings/venue", { params });
    return response.data.data;
  },

  getVenueBookingDetails: async (bookingId) => {
    if (isPreviewActive()) return Promise.resolve(mockBookingDetail);
    const response = await api.get(`/bookings/venue/${bookingId}`);
    return response.data.data;
  },

  acceptVenueBooking: async (bookingId) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put(`/bookings/venue/${bookingId}/accept`);
    return response.data.data;
  },

  rejectVenueBooking: async (bookingId) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put(`/bookings/venue/${bookingId}/reject`);
    return response.data.data;
  },

  completeVenueBooking: async (bookingId) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put(`/bookings/venue/${bookingId}/complete`);
    return response.data.data;
  },

  cancelVenueBooking: async (bookingId, reason) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put(`/bookings/venue/${bookingId}/cancel`, { reason });
    return response.data.data;
  },

  addBookingNote: async (bookingId, content) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.post(`/bookings/${bookingId}/notes`, { content });
    return response.data.data;
  },

  adminGetBookings: async (params) => {
    if (isPreviewActive()) return Promise.resolve(mockBookingsList);
    const response = await api.get("/admin/bookings", { params });
    return response.data.data;
  },

  adminResolveDispute: async (bookingId, status, message) => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put(`/admin/bookings/${bookingId}/dispute`, {
      status,
      message
    });
    return response.data.data;
  },
};
