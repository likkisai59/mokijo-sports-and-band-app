import { API_BASE_URL } from "@/lib/api";

const CLUB_ADMIN_ROLES = [
    "admin",
    "club_admin",
    "club-admin",
    "clubadmin",
    "owner",
    "club_owner",
    "club-owner",
    "manager",
    "club_manager",
    "club-manager",
];

/**
 * Where to send the user after a successful venue Razorpay payment.
 * Club admin / club member stay in the club dashboard; everyone else stays in the user area.
 */
export function getPostVenueBookingPath() {
    if (typeof window === "undefined") return "/bookings";

    const isMember =
        localStorage.getItem("isMember") === "true" ||
        localStorage.getItem("userRole") === "team_member";
    const role = (localStorage.getItem("userRole") || "").toLowerCase().trim();
    const isClubAdmin = !isMember && CLUB_ADMIN_ROLES.includes(role);

    if (isMember || isClubAdmin) {
        return "/dashboard/bookings";
    }

    return "/user-dashboard";
}

export function loadRazorpayCheckout() {
    if (typeof window === "undefined") return Promise.resolve();
    if (window.Razorpay) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(
            "script[src='https://checkout.razorpay.com/v1/checkout.js']"
        );
        if (existingScript) {
            existingScript.addEventListener("load", () => resolve(), { once: true });
            existingScript.addEventListener(
                "error",
                () => reject(new Error("Could not load Razorpay Checkout.")),
                { once: true }
            );
            return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Could not load Razorpay Checkout."));
        document.body.appendChild(script);
    });
}

function formatDetail(detail, fallback) {
    if (Array.isArray(detail)) {
        return detail.map((d) => d.msg || d).join(", ");
    }
    return detail || fallback;
}

/**
 * Create a Razorpay order for a held venue booking and open the payment modal immediately.
 */
export async function openVenueBookingRazorpay({
    bookingId,
    userId,
    onSuccess,
    onError,
    onDismiss,
}) {
    await loadRazorpayCheckout();
    if (!window.Razorpay) {
        throw new Error("Razorpay Checkout failed to load.");
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const orderRes = await fetch(`${API_BASE_URL}/bookings/razorpay/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
            booking_id: Number(bookingId),
            user_id: Number(userId),
        }),
    });

    if (!orderRes.ok) {
        const errorData = await orderRes.json().catch(() => ({}));
        throw new Error(formatDetail(errorData.detail, "Failed to create Razorpay order."));
    }

    const order = await orderRes.json();
    if (!order?.razorpay_order_id || !order?.key_id) {
        throw new Error("Razorpay is not configured correctly. Please try again later.");
    }

    return new Promise((resolve, reject) => {
        const checkout = new window.Razorpay({
            key: order.key_id,
            amount: order.amount,
            currency: order.currency,
            name: order.name || "Mukijo Venues",
            description: order.description || `Venue booking #${bookingId}`,
            order_id: order.razorpay_order_id,
            prefill: {
                name: order.prefill_name || "",
                email: order.prefill_email || "",
                contact: order.prefill_contact || "",
            },
            theme: { color: "#c6ff3d" },
            handler: async (response) => {
                try {
                    const verifyRes = await fetch(`${API_BASE_URL}/bookings/razorpay/verify`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", ...authHeaders },
                        body: JSON.stringify({
                            booking_id: Number(bookingId),
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        }),
                    });

                    if (!verifyRes.ok) {
                        const errorData = await verifyRes.json().catch(() => ({}));
                        const message = formatDetail(
                            errorData.detail,
                            "Payment verification failed or slots expired."
                        );
                        onError?.(message);
                        reject(new Error(message));
                        return;
                    }

                    const confirmed = await verifyRes.json();
                    onSuccess?.(confirmed);
                    resolve(confirmed);
                } catch (verifyErr) {
                    console.error(verifyErr);
                    const message =
                        "Payment completed but verification failed. Contact support with your payment ID.";
                    onError?.(message);
                    reject(new Error(message));
                }
            },
            modal: {
                ondismiss: () => {
                    onDismiss?.();
                    reject(new Error("Payment cancelled."));
                },
            },
        });

        checkout.on("payment.failed", (response) => {
            const message = response?.error?.description || "Payment failed. Please try again.";
            onError?.(message);
            reject(new Error(message));
        });

        checkout.open();
    });
}
