import { API_BASE_URL } from "@/lib/bandApi";
import { loadRazorpayCheckout } from "@/lib/venueRazorpay";

const getAuthToken = () => {
    if (typeof window !== "undefined") {
        return localStorage.getItem("bandAccessToken");
    }
    return null;
};

function formatDetail(detail, fallback) {
    if (Array.isArray(detail)) {
        return detail.map((d) => d.msg || d).join(", ");
    }
    return detail || fallback;
}

export const bandPaymentService = {
  async processCheckout({ bookingId, onSuccess, onError, onDismiss }) {
    await loadRazorpayCheckout();
    if (!window.Razorpay) {
      throw new Error("Razorpay Checkout failed to load.");
    }

    const token = getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    try {
      // 1. Create Payment Order
      const orderRes = await fetch(`${API_BASE_URL}/band/payments/order`, {
        method: "POST",
        headers,
        body: JSON.stringify({ booking_id: Number(bookingId) })
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json().catch(() => ({}));
        throw new Error(formatDetail(errorData.detail, "Failed to create Razorpay order."));
      }

      const order = await orderRes.json();
      if (!order?.razorpay_order_id) {
        throw new Error("Invalid Razorpay order received from server.");
      }

      // 2. Fetch Razorpay Key
      const keyRes = await fetch(`${API_BASE_URL}/bookings/razorpay/key`, { headers });
      if (!keyRes.ok) {
        throw new Error("Failed to fetch Razorpay key.");
      }
      const keyData = await keyRes.json();

      // 3. Initialize Razorpay Modal
      const options = {
        key: keyData.key_id,
        amount: order.amount * 100,
        currency: "INR",
        name: "BandConnect Escrow",
        description: `Booking #${bookingId}`,
        order_id: order.razorpay_order_id,
        handler: async function (response) {
          try {
            // 4. Verify Payment
            const verifyRes = await fetch(`${API_BASE_URL}/band/payments/verify`, {
              method: "POST",
              headers,
              body: JSON.stringify({
                booking_id: Number(bookingId),
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              const err = await verifyRes.json().catch(() => ({}));
              if (onError) onError(new Error(formatDetail(err.detail, "Payment verification failed.")));
              return;
            }

            if (onSuccess) onSuccess();
          } catch (err) {
            if (onError) onError(err);
          }
        },
        modal: {
          ondismiss: function () {
            if (onDismiss) onDismiss();
          },
        },
        theme: {
          color: "#4f46e5", // Indigo theme
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        if (onError) onError(new Error(response.error.description || "Payment failed."));
      });
      rzp.open();
    } catch (error) {
      if (onError) onError(error);
      throw error;
    }
  }
};
