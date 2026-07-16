"use client";
import { API_BASE_URL } from "@/lib/api";

import { useEffect, useState, Suspense, use } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, CreditCard, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";

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
                const res = await fetch(`${API_BASE_URL}/bookings/confirm`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        booking_id: Number(bookingId),
                        payment_id: "pay_mock_" + Math.random().toString(36).substring(2, 9).toUpperCase(),
                    }),
                });

                if (res.ok) {
                    setPaid(true);
                } else {
                    const errorData = await res.json().catch(() => ({}));
                    setError(errorData.detail || "Payment verification failed or slots expired.");
                }
            } else if (gameId) {
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
            setError("Connection issue. Please verify and try again.");
        } finally {
            setPaying(false);
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
                <Link href="/venues" style={styles.backLink}>
                    Return to Arenas
                </Link>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <Link href="/venues" style={styles.backBtn}>
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
                        <CheckCircle2 size={56} style={{ color: "#bffe00", marginBottom: "16px" }} />
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
                                <span style={{ ...styles.receiptVal, color: "#bffe00" }}>₹{booking?.amount_paid}</span>
                            </div>
                            <div style={styles.receiptRow}>
                                <span style={styles.receiptLabel}>Payment Reference</span>
                                <span style={styles.receiptVal}>{booking?.payment_id || "N/A"}</span>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
                            <Link href="/bookings" style={styles.primaryBtn}>
                                View My Bookings
                            </Link>
                            <Link href="/user-dashboard" style={styles.secondaryBtn}>
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
                                    <CreditCard size={20} style={{ color: "#00f0ff" }} />
                                    <div style={{ flexGrow: 1 }}>
                                        <h3 style={{ fontSize: "14px", fontWeight: "700" }}>Mock Payment Gateway</h3>
                                        <p
                                            style={{
                                                fontSize: "12px",
                                                color: "rgba(148, 163, 184, 0.5)",
                                                marginTop: "4px",
                                            }}
                                        >
                                            Simulate successful checkout completion in one click.
                                        </p>
                                    </div>
                                    <CheckCircle2 size={20} style={{ color: "#bffe00" }} />
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
                                    {paying ? "Processing..." : `Pay ₹${booking?.amount_paid} Now`}
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
        color: "#f1f5f9",
        fontFamily: "'Outfit', sans-serif",
        paddingBottom: "80px",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 40px",
        background: "rgba(15, 15, 26, 0.8)",
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
        borderTopColor: "#bffe00",
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
        color: "#00f0ff",
        fontWeight: "600",
        textDecoration: "none",
    },
    successCard: {
        background: "rgba(15, 15, 26, 0.9)",
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
        background: "linear-gradient(135deg, #bffe00, #00f0ff)",
        color: "#050508",
        border: "none",
        padding: "12px 24px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "800",
        fontStyle: "italic",
        textTransform: "uppercase",
        textDecoration: "none",
        transform: "skewX(-6deg)",
        boxShadow: "0 4px 12px rgba(191, 254, 0, 0.2)",
    },
    secondaryBtn: {
        background: "transparent",
        color: "#00f0ff",
        border: "1.5px solid rgba(0, 240, 255, 0.3)",
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
        color: "#f1f5f9",
        marginBottom: "16px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderLeft: "3px solid #bffe00",
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
        color: "#00f0ff",
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
        color: "#bffe00",
    },
    paymentCard: {
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(0, 240, 255, 0.15)",
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
        color: "rgba(241, 245, 249, 0.6)",
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
        color: "#bffe00",
        marginBottom: "24px",
    },
    payBtn: {
        background: "linear-gradient(135deg, #bffe00, #00f0ff)",
        color: "#050508",
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
        boxShadow: "0 6px 20px rgba(191, 254, 0, 0.25)",
    },
    rebookBtn: {
        display: "block",
        textAlign: "center",
        marginTop: "12px",
        color: "#00f0ff",
        fontSize: "13px",
        fontWeight: "700",
        textDecoration: "none",
    },
};
