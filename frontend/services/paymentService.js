import { api } from "./api";

export const paymentService = {
  /**
   * Create a simulated Razorpay payment order for an accepted booking.
   * Returns a mock order ID and amount to pass to the Razorpay SDK checkout.
   */
  createOrder: async (data) => {
    const response = await api.post("/payments/create-order", data);
    return response.data.data;
  },

  /**
   * Verify a completed simulated payment. Transitions booking to 'confirmed'
   * and creates an escrow Transaction record.
   */
  verifyPayment: async (data) => {
    await api.post("/payments/verify", data);
  },
};
