import { api } from "./api";
import { BookingRequestDetail, BookingsListResponse } from "@/types/booking";
import { isPreviewActive, toastMutationBlocked } from "@/utils/dev-mode";
import { mockBookingsList, mockBookingDetail } from "@/utils/preview-fixtures";

export const bookingService = {
  getArtistBookings: async (params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<BookingsListResponse> => {
    if (isPreviewActive()) return Promise.resolve(mockBookingsList);
    const response = await api.get<any>("/bookings/artist", { params });
    return response.data.data;
  },

  getClientBookings: async (params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<BookingsListResponse> => {
    if (isPreviewActive()) return Promise.resolve(mockBookingsList);
    const response = await api.get<any>("/bookings/client", { params });
    return response.data.data;
  },

  createBooking: async (data: Record<string, unknown>): Promise<BookingRequestDetail> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.post<any>("/bookings", data);
    return response.data.data;
  },

  getBookingDetails: async (bookingId: string): Promise<BookingRequestDetail> => {
    if (isPreviewActive()) return Promise.resolve(mockBookingDetail);
    const response = await api.get<any>(`/bookings/${bookingId}`);
    return response.data.data;
  },

  acceptBooking: async (bookingId: string): Promise<BookingRequestDetail> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put<any>(`/bookings/${bookingId}/accept`);
    return response.data.data;
  },

  rejectBooking: async (bookingId: string): Promise<BookingRequestDetail> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put<any>(`/bookings/${bookingId}/reject`);
    return response.data.data;
  },

  counterOffer: async (
    bookingId: string,
    counterPrice: number,
    message?: string
  ): Promise<BookingRequestDetail> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put<any>(`/bookings/${bookingId}/counter`, {
      counter_price: counterPrice,
      message
    });
    return response.data.data;
  },

  cancelBooking: async (bookingId: string, reason?: string): Promise<BookingRequestDetail> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put<any>(`/bookings/${bookingId}/cancel`, { reason });
    return response.data.data;
  },

  getVenueBookings: async (params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<BookingsListResponse> => {
    if (isPreviewActive()) return Promise.resolve(mockBookingsList);
    const response = await api.get<any>("/bookings/venue", { params });
    return response.data.data;
  },

  getVenueBookingDetails: async (bookingId: string): Promise<BookingRequestDetail> => {
    if (isPreviewActive()) return Promise.resolve(mockBookingDetail);
    const response = await api.get<any>(`/bookings/venue/${bookingId}`);
    return response.data.data;
  },

  acceptVenueBooking: async (bookingId: string): Promise<BookingRequestDetail> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put<any>(`/bookings/venue/${bookingId}/accept`);
    return response.data.data;
  },

  rejectVenueBooking: async (bookingId: string): Promise<BookingRequestDetail> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put<any>(`/bookings/venue/${bookingId}/reject`);
    return response.data.data;
  },

  completeVenueBooking: async (bookingId: string): Promise<BookingRequestDetail> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put<any>(`/bookings/venue/${bookingId}/complete`);
    return response.data.data;
  },

  cancelVenueBooking: async (bookingId: string, reason?: string): Promise<BookingRequestDetail> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put<any>(`/bookings/venue/${bookingId}/cancel`, { reason });
    return response.data.data;
  },

  addBookingNote: async (bookingId: string, content: string): Promise<any> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.post<any>(`/bookings/${bookingId}/notes`, { content });
    return response.data.data;
  },

  adminGetBookings: async (params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<BookingsListResponse> => {
    if (isPreviewActive()) return Promise.resolve(mockBookingsList);
    const response = await api.get<any>("/admin/bookings", { params });
    return response.data.data;
  },

  adminResolveDispute: async (
    bookingId: string,
    status: string,
    message?: string
  ): Promise<BookingRequestDetail> => {
    if (isPreviewActive()) return toastMutationBlocked();
    const response = await api.put<any>(`/admin/bookings/${bookingId}/dispute`, {
      status,
      message
    });
    return response.data.data;
  },
};
