import { api } from "./api";

export interface PaymentOrderRequest {
  booking_id: string;
}

export interface PaymentOrderResponse {
  booking_id: string;
  amount: number;
  currency: string;
  razorpay_order_id: string;
}

export interface PaymentVerifyRequest {
  booking_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const paymentService = {
  /**
   * Create a simulated Razorpay payment order for an accepted booking.
   * Returns a mock order ID and amount to pass to the Razorpay SDK checkout.
   */
  createOrder: async (
    data: PaymentOrderRequest
  ): Promise<PaymentOrderResponse> => {
    const response = await api.post<any>("/payments/create-order", data);
    return response.data.data;
  },

  /**
   * Verify a completed simulated payment. Transitions booking to 'confirmed'
   * and creates an escrow Transaction record.
   */
  verifyPayment: async (data: PaymentVerifyRequest): Promise<void> => {
    await api.post<any>("/payments/verify", data);
  },
};
