"use client";
import { API_BASE_URL } from "@/lib/api";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, CreditCard, CheckCircle2 } from "lucide-react";

function loadRazorpayCheckout() {
    if (typeof window === "undefined") return Promise.resolve();
    if (window.Razorpay) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const existingScript = document.querySelector("script[src='https://checkout.razorpay.com/v1/checkout.js']");
        if (existingScript) {
            existingScript.addEventListener("load", () => resolve(), { once: true });
            existingScript.addEventListener("error", () => reject(new Error("Could not load Razorpay Checkout.")), {
                once: true,
            });
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

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const bookingId = searchParams.get("booking_id");

    const gameId = searchParams.get("game_id");

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes default
    const [expired, setExpired] = useState(false);
    const [paying, setPaying] = useState(false);
    const [paid, setPaid] = useState(false);
    const [dashboardUrl, setDashboardUrl] = useState("/user-dashboard");
    const [myTrainingUrl, setMyTrainingUrl] = useState("/bookings");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const isMember = localStorage.getItem("isMember") === "true";
            const role = (localStorage.getItem("userRole") || "").toLowerCase();
            if (isMember || role === "team_member" || role === "club_admin") {
                setDashboardUrl("/dashboard/my-trainings");
                setMyTrainingUrl("/dashboard/my-trainings");
            } else {
                setDashboardUrl("/user-dashboard");
                setMyTrainingUrl("/user-dashboard");
            }
        }
    }, []);

    useEffect(() => {
        if (!bookingId && !gameId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                if (bookingId) {
                    const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setBooking(data);
                        if (data.status === "confirmed") {
                            setPaid(true);
                        }
                        if (data.slots && data.slots.length > 0 && data.slots[0].held_until) {
                            const heldUntil = new Date(data.slots[0].held_until);
                            const diff = Math.floor((heldUntil.getTime() - new Date().getTime()) / 1000);
                            if (diff <= 0) {
                                setExpired(true);
                                setTimeLeft(0);
                            } else {
                                setTimeLeft(diff);
                            }
                        }
                    } else {
                        setError("Failed to load booking details.");
                    }
                } else if (gameId) {
                    const res = await fetch(`${API_BASE_URL}/games/${gameId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setBooking({
                            id: data.id,
                            amount_paid: Math.round(data.price_per_player * 100),
                            status: data.status,
                            court: { name: `Match Slot (${data.sport.toUpperCase()})` },
                            slots: [{ start_time: data.slot_start, sport: data.sport }],
                        });
                        if (data.status === "full" || data.status === "completed") {
                            setError("Lobby registration is closed.");
                        }
                    } else {
                        setError("Failed to load game details.");
                    }
                }
            } catch (err) {
                console.error(err);
                setError("Cannot connect to server.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [bookingId, gameId]);

    // Countdown Timer logic
    useEffect(() => {
        if (loading || paid || expired || timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setExpired(true);
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [loading, paid, expired, timeLeft]);

    const handlePayment = async () => {
        if (expired || paid) return;
        setPaying(true);
        setError(null);

        try {
            if (bookingId) {
                const userId = localStorage.getItem("userId");
                if (!userId) {
                    setError("Please sign in to complete payment.");
                    setPaying(false);
                    router.push("/login-user");
                    return;
                }

                await loadRazorpayCheckout();

                const orderRes = await fetch(`${API_BASE_URL}/bookings/razorpay/order`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        booking_id: Number(bookingId),
                        user_id: Number(userId),
                    }),
                });

                if (!orderRes.ok) {
                    const errorData = await orderRes.json().catch(() => ({}));
                    const detail = errorData.detail;
                    const message = Array.isArray(detail)
                        ? detail.map((d) => d.msg || d).join(", ")
                        : detail || "Failed to create Razorpay order.";
                    throw new Error(message);
                }

                const order = await orderRes.json();
                if (!order?.razorpay_order_id || !order?.key_id) {
                    throw new Error("Razorpay is not configured correctly. Please try again later.");
                }

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
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    booking_id: Number(bookingId),
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                }),
                            });

                            if (!verifyRes.ok) {
                                const errorData = await verifyRes.json().catch(() => ({}));
                                setError(errorData.detail || "Payment verification failed or slots expired.");
                                setPaying(false);
                                return;
                            }

                            const confirmed = await verifyRes.json();
                            setBooking(confirmed);
                            setPaid(true);
                        } catch (verifyErr) {
                            console.error(verifyErr);
                            setError("Payment completed but verification failed. Contact support with your payment ID.");
                        } finally {
                            setPaying(false);
                        }
                    },
                    modal: {
                        ondismiss: () => setPaying(false),
                    },
                });

                checkout.on("payment.failed", (response) => {
                    setError(response?.error?.description || "Payment failed. Please try again.");
                    setPaying(false);
                });

                checkout.open();
                return;
            }

            if (gameId) {
                const res = await fetch(`${API_BASE_URL}/webhooks/payments/game-join`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        event: "payment.captured",
                        payment_id: "pay_game_" + Math.random().toString(36).substring(2, 9).toUpperCase(),
                        game_id: gameId,
                        user_id: Number(localStorage.getItem("userId") || 2),
                    }),
                });

                if (res.ok) {
                    setPaid(true);
                } else {
                    setError("Payment webhook routing failed.");
                }
            }
        } catch (err) {
            console.error(err);
            setError(err?.message || "Connection issue. Please verify and try again.");
        } finally {
            if (!bookingId) setPaying(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p>Loading checkout session...</p>
            </div>
        );
    }

    if (error && !booking) {
        return (
            <div style={styles.errorWrapper}>
                <div style={styles.errorContainer}>{error}</div>
                <Link href="/band/venues" style={styles.backLink}>
                    Return to Arenas
                </Link>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <Link href="/band/venues" style={styles.backBtn}>
                    <ArrowLeft size={16} />
                    <span>Cancel Checkout</span>
                </Link>
                <div style={styles.headerBrand}>
                    <span style={styles.logo}>Secure Checkout</span>
                </div>
            </header>

            <main style={styles.main}>
                {paid ? (
                    /* Success screen */
                    <div style={styles.successCard}>
                        <CheckCircle2 size={56} style={{ color: "#c6ff3d", marginBottom: "16px" }} />
                        <h1 style={styles.successTitle}>Booking Confirmed!</h1>
                        <p style={styles.successSubtitle}>
                            Your slots are successfully reserved. Get ready for your game!
                        </p>

                        <div style={styles.bookingReceipt}>
                            <div style={styles.receiptRow}>
                                <span style={styles.receiptLabel}>Booking ID</span>
                                <span style={styles.receiptVal}>#MK-{booking?.id}</span>
                            </div>
                            <div style={styles.receiptRow}>
                                <span style={styles.receiptLabel}>Amount Paid</span>
                                <span style={{ ...styles.receiptVal, color: "#c6ff3d" }}>₹{booking?.amount_paid}</span>
                            </div>
                            <div style={styles.receiptRow}>
                                <span style={styles.receiptLabel}>Payment Reference</span>
                                <span style={styles.receiptVal}>{booking?.payment_id || "N/A"}</span>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
                            <Link href={myTrainingUrl} style={styles.primaryBtn}>
                                View My Training
                            </Link>
                            <Link href={dashboardUrl} style={styles.secondaryBtn}>
                                Go to Dashboard
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* Standard Checkout Flow */
                    <div style={styles.checkoutLayout}>
                        {/* Left Details */}
                        <div style={styles.leftCol}>
                            {/* Alert countdown timer */}
                            <div
                                style={{
                                    ...styles.timerBanner,
                                    backgroundColor: expired ? "rgba(239, 68, 68, 0.1)" : "rgba(234, 179, 8, 0.08)",
                                    borderColor: expired ? "rgba(239, 68, 68, 0.2)" : "rgba(234, 179, 8, 0.2)",
                                }}
                            >
                                <Clock size={20} style={{ color: expired ? "#f87171" : "#facc15" }} />
                                <div style={styles.timerContent}>
                                    {expired ? (
                                        <span style={{ color: "#f87171", fontWeight: "700" }}>
                                            HOLD EXPIRED: Please release and select new slots.
                                        </span>
                                    ) : (
                                        <span>
                                            We are holding your slots for:{" "}
                                            <strong
                                                style={{ color: "#facc15", fontFamily: "monospace", fontSize: "16px" }}
                                            >
                                                {formatTime(timeLeft)}
                                            </strong>
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Booking breakdown */}
                            <section style={styles.section}>
                                <h2 style={styles.sectionTitle}>Review Selected Slots</h2>
                                <div style={styles.slotsList}>
                                    {booking?.slots &&
                                        booking.slots.map((slot) => {
                                            const date = new Date(slot.start_time).toLocaleDateString("en-US", {
                                                weekday: "short",
                                                month: "short",
                                                day: "numeric",
                                            });
                                            const startTime = new Date(slot.start_time).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            });
                                            const endTime = new Date(slot.end_time).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            });

                                            return (
                                                <div key={slot.id} style={styles.slotRow}>
                                                    <div style={styles.slotDetails}>
                                                        <span style={styles.slotSport}>{slot.sport.toUpperCase()}</span>
                                                        <span style={styles.slotTime}>
                                                            {date} | {startTime} - {endTime}
                                                        </span>
                                                    </div>
                                                    <span style={styles.slotCost}>₹{slot.current_price}</span>
                                                </div>
                                            );
                                        })}
                                </div>
                            </section>

                            {/* Payment options */}
                            <section style={styles.section}>
                                <h2 style={styles.sectionTitle}>Payment Method</h2>
                                <div style={styles.paymentCard}>
                                    <CreditCard size={20} style={{ color: "#d9ff6e" }} />
                                    <div style={{ flexGrow: 1 }}>
                                        <h3 style={{ fontSize: "14px", fontWeight: "700" }}>Razorpay</h3>
                                        <p
                                            style={{
                                                fontSize: "12px",
                                                color: "rgba(148, 163, 184, 0.5)",
                                                marginTop: "4px",
                                            }}
                                        >
                                            Pay securely with UPI, cards, wallets, or netbanking.
                                        </p>
                                    </div>
                                    <CheckCircle2 size={20} style={{ color: "#c6ff3d" }} />
                                </div>
                            </section>
                        </div>

                        {/* Right sticky payment drawer */}
                        <div style={styles.rightCol}>
                            <div style={styles.stickyPayCard}>
                                <h3 style={styles.summaryTitle}>Checkout Summary</h3>

                                {error && (
                                    <div style={{ ...styles.errorContainer, marginBottom: "16px", fontSize: "12px" }}>
                                        {error}
                                    </div>
                                )}

                                <div style={styles.paymentDetails}>
                                    <div style={styles.payRow}>
                                        <span>Subtotal</span>
                                        <span>₹{booking?.amount_paid}</span>
                                    </div>
                                    <div style={styles.payRow}>
                                        <span>Convenience Fee</span>
                                        <span>₹0</span>
                                    </div>
                                </div>

                                <div style={styles.totalRow}>
                                    <span>Total Payable</span>
                                    <span>₹{booking?.amount_paid}</span>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    disabled={expired || paying}
                                    style={{
                                        ...styles.payBtn,
                                        opacity: expired || paying ? 0.6 : 1,
                                        cursor: expired || paying ? "not-allowed" : "pointer",
                                    }}
                                >
                                    {paying ? "Opening Razorpay..." : `Book Now · Pay ₹${booking?.amount_paid}`}
                                </button>

                                {expired && (
                                    <Link href={`/venues`} style={styles.rebookBtn}>
                                        Select New Slots
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={null}>
            <CheckoutContent />
        </Suspense>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        backgroundColor: "#08080f",
        color: "#f4f4f5",
        fontFamily: "'Outfit', sans-serif",
        paddingBottom: "80px",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 40px",
        background: "rgba(20, 20, 31, 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        position: "sticky",
        top: 0,
        zIndex: 100,
    },
    backBtn: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        color: "#f87171",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: "600",
    },
    headerBrand: {
        display: "flex",
        alignItems: "center",
    },
    logo: {
        fontSize: "18px",
        fontWeight: "800",
        color: "#ffffff",
    },
    main: {
        maxWidth: "1080px",
        margin: "0 auto",
        padding: "40px",
    },
    loadingContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        color: "rgba(148, 163, 184, 0.6)",
    },
    spinner: {
        width: "40px",
        height: "40px",
        border: "4px solid rgba(255,255,255,0.1)",
        borderTopColor: "#c6ff3d",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        marginBottom: "16px",
    },
    errorWrapper: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        gap: "20px",
    },
    errorContainer: {
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.25)",
        color: "#fca5a5",
        padding: "16px 24px",
        borderRadius: "10px",
        textAlign: "center",
    },
    backLink: {
        color: "#d9ff6e",
        fontWeight: "600",
        textDecoration: "none",
    },
    successCard: {
        background: "rgba(20, 20, 31, 0.9)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        padding: "40px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
        maxWidth: "600px",
        margin: "40px auto 0 auto",
    },
    successTitle: {
        fontSize: "28px",
        fontWeight: "800",
        color: "#ffffff",
        marginBottom: "8px",
    },
    successSubtitle: {
        fontSize: "14px",
        color: "rgba(148, 163, 184, 0.6)",
        marginBottom: "28px",
        lineHeight: "1.5",
    },
    bookingReceipt: {
        width: "100%",
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        marginBottom: "24px",
    },
    receiptRow: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "13px",
    },
    receiptLabel: {
        color: "rgba(148, 163, 184, 0.5)",
    },
    receiptVal: {
        fontWeight: "600",
        color: "#ffffff",
    },
    primaryBtn: {
        background: "linear-gradient(135deg, #c6ff3d, #d9ff6e)",
        color: "#08080f",
        border: "none",
        padding: "12px 24px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "800",
        fontStyle: "italic",
        textTransform: "uppercase",
        textDecoration: "none",
        transform: "skewX(-6deg)",
        boxShadow: "0 4px 12px rgba(198, 255, 61, 0.2)",
    },
    secondaryBtn: {
        background: "transparent",
        color: "#d9ff6e",
        border: "1.5px solid rgba(217, 255, 110, 0.3)",
        padding: "11px 24px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "800",
        fontStyle: "italic",
        textTransform: "uppercase",
        textDecoration: "none",
        transform: "skewX(-6deg)",
    },
    checkoutLayout: {
        display: "grid",
        gridTemplateColumns: "1.2fr 0.8fr",
        gap: "40px",
    },
    leftCol: {
        display: "flex",
        flexDirection: "column",
        gap: "30px",
    },
    rightCol: {
        display: "flex",
        flexDirection: "column",
    },
    timerBanner: {
        border: "1px solid",
        borderRadius: "12px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    timerContent: {
        fontSize: "14px",
        fontWeight: "600",
    },
    section: {
        display: "flex",
        flexDirection: "column",
    },
    sectionTitle: {
        fontSize: "16px",
        fontWeight: "700",
        color: "#f4f4f5",
        marginBottom: "16px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderLeft: "3px solid #c6ff3d",
        paddingLeft: "8px",
    },
    slotsList: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    slotRow: {
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.04)",
        borderRadius: "10px",
        padding: "16px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    slotDetails: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    slotSport: {
        fontSize: "11px",
        fontWeight: "700",
        color: "#d9ff6e",
        letterSpacing: "0.05em",
    },
    slotTime: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#ffffff",
    },
    slotCost: {
        fontSize: "15px",
        fontWeight: "700",
        color: "#c6ff3d",
    },
    paymentCard: {
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(217, 255, 110, 0.15)",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
    },
    stickyPayCard: {
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "16px",
        padding: "28px",
        position: "sticky",
        top: "100px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    },
    summaryTitle: {
        fontSize: "15px",
        fontWeight: "700",
        textTransform: "uppercase",
        color: "rgba(244, 244, 245, 0.6)",
        marginBottom: "20px",
        letterSpacing: "0.05em",
    },
    paymentDetails: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        marginBottom: "20px",
        paddingBottom: "20px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    },
    payRow: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "14px",
    },
    totalRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "18px",
        fontWeight: "800",
        color: "#c6ff3d",
        marginBottom: "24px",
    },
    payBtn: {
        background: "linear-gradient(135deg, #c6ff3d, #d9ff6e)",
        color: "#08080f",
        border: "none",
        padding: "14px",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "800",
        fontStyle: "italic",
        textTransform: "uppercase",
        width: "100%",
        transition: "all 0.25s ease",
        transform: "skewX(-6deg)",
        boxShadow: "0 6px 20px rgba(198, 255, 61, 0.25)",
    },
    rebookBtn: {
        display: "block",
        textAlign: "center",
        marginTop: "12px",
        color: "#d9ff6e",
        fontSize: "13px",
        fontWeight: "700",
        textDecoration: "none",
    },
};
