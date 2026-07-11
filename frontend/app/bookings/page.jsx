"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Trophy, Clock, XCircle, AlertCircle, ShieldAlert, Loader2 } from "lucide-react";

export default function MyBookingsPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("upcoming");
    const [cancellingId, setCancellingId] = useState(null);

    const fetchBookings = async () => {
        const userId = localStorage.getItem("userId");
        if (!userId) {
            setError("Session expired. Please log in.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`http://127.0.0.1:8001/users/${userId}/bookings`);
            if (res.ok) {
                const data = await res.json();
                setBookings(data || []);
            } else {
                setError("Failed to load booking history.");
            }
        } catch (err) {
            console.error(err);
            setError("Connection error. Is backend server running?");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleCancel = async (bookingId) => {
        if (!confirm("Are you sure you want to cancel this slot reservation?")) return;
        setCancellingId(bookingId);

        try {
            const res = await fetch(`http://127.0.0.1:8001/bookings/${bookingId}/cancel`, {
                method: "POST",
            });

            if (res.ok) {
                // Refresh list
                await fetchBookings();
            } else {
                alert("Failed to cancel slot. Please contact support.");
            }
        } catch (err) {
            console.error(err);
            alert("Error cancelling slot.");
        } finally {
            setCancellingId(null);
        }
    };

    const now = new Date();

    const upcomingBookings = bookings.filter((b) => {
        if (b.status === "cancelled") return false;
        // Verify if first slot is in future
        if (b.slots && b.slots.length > 0) {
            const slotStart = new Date(b.slots[0].start_time);
            return slotStart >= now;
        }
        return false;
    });

    const pastBookings = bookings.filter((b) => {
        if (b.status === "cancelled") return true;
        if (b.slots && b.slots.length > 0) {
            const slotStart = new Date(b.slots[0].start_time);
            return slotStart < now;
        }
        return true;
    });

    const displayList = activeTab === "upcoming" ? upcomingBookings : pastBookings;

    return (
        <div style={styles.container}>
            {/* Top Bar */}
            <header style={styles.header}>
                <Link href="/user-dashboard" style={styles.backBtn}>
                    <ArrowLeft size={16} />
                    <span>Back to Dashboard</span>
                </Link>
                <div style={styles.headerBrand}>
                    <span style={styles.logo}>My Game Bookings</span>
                </div>
            </header>

            <main style={styles.main}>
                {/* Tabs */}
                <div style={styles.tabsContainer}>
                    <button
                        onClick={() => setActiveTab("upcoming")}
                        style={{
                            ...styles.tab,
                            borderBottomColor: activeTab === "upcoming" ? "#bffe00" : "transparent",
                            color: activeTab === "upcoming" ? "#bffe00" : "rgba(148, 163, 184, 0.6)",
                        }}
                    >
                        Upcoming Matches ({upcomingBookings.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("past")}
                        style={{
                            ...styles.tab,
                            borderBottomColor: activeTab === "past" ? "#bffe00" : "transparent",
                            color: activeTab === "past" ? "#bffe00" : "rgba(148, 163, 184, 0.6)",
                        }}
                    >
                        Past History & Cancelled ({pastBookings.length})
                    </button>
                </div>

                {loading ? (
                    <div style={styles.loadingContainer}>
                        <Loader2 className="animate-spin" size={32} style={{ color: "#bffe00" }} />
                        <p style={{ marginTop: "16px" }}>Fetching reservations history...</p>
                    </div>
                ) : error ? (
                    <div style={styles.errorContainer}>{error}</div>
                ) : displayList.length === 0 ? (
                    <div style={styles.emptyContainer}>
                        <Calendar size={48} style={{ color: "rgba(148, 163, 184, 0.15)", marginBottom: "16px" }} />
                        <h3>No bookings found</h3>
                        <p style={{ color: "rgba(148, 163, 184, 0.4)", fontSize: "14px", marginTop: "8px" }}>
                            You have no {activeTab} sports court bookings at the moment.
                        </p>
                        <Link href="/venues" style={styles.exploreLink}>
                            Find sports venues nearby
                        </Link>
                    </div>
                ) : (
                    /* Bookings list */
                    <div style={styles.list}>
                        {displayList.map((booking) => {
                            const date = booking.slots && booking.slots.length > 0
                                ? new Date(booking.slots[0].start_time).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })
                                : "Unknown Date";

                            const isCancelled = booking.status === "cancelled";
                            const isPaid = booking.payment_status === "paid" || booking.status === "confirmed";

                            return (
                                <div key={booking.id} style={styles.bookingCard}>
                                    <div style={styles.cardHeader}>
                                        <div style={styles.sportHeader}>
                                            <Trophy size={18} style={{ color: "#bffe00" }} />
                                            <span style={styles.sportLabel}>
                                                {booking.slots && booking.slots.length > 0 ? booking.slots[0].sport.toUpperCase() : "SPORTS"}
                                            </span>
                                        </div>
                                        {/* Status badge */}
                                        <div style={{
                                            ...styles.badge,
                                            backgroundColor: isCancelled 
                                                ? "rgba(239, 68, 68, 0.1)" 
                                                : isPaid 
                                                    ? "rgba(16, 185, 129, 0.1)" 
                                                    : "rgba(234, 179, 8, 0.1)",
                                            color: isCancelled 
                                                ? "#f87171" 
                                                : isPaid 
                                                    ? "#34d399" 
                                                    : "#fbbf24",
                                            borderColor: isCancelled 
                                                ? "rgba(239, 68, 68, 0.2)" 
                                                : isPaid 
                                                    ? "rgba(16, 185, 129, 0.2)" 
                                                    : "rgba(234, 179, 8, 0.2)",
                                        }}>
                                            {isCancelled ? "CANCELLED" : isPaid ? "CONFIRMED" : "HOLDING (UNPAID)"}
                                        </div>
                                    </div>

                                    {/* Slot times list */}
                                    <div style={styles.cardDetails}>
                                        <div style={styles.detailItem}>
                                            <Calendar size={14} style={{ color: "rgba(148, 163, 184, 0.6)" }} />
                                            <span>{date}</span>
                                        </div>
                                        
                                        {booking.slots && booking.slots.map((slot) => {
                                            const startStr = new Date(slot.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                                            const endStr = new Date(slot.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                                            return (
                                                <div key={slot.id} style={styles.detailItem}>
                                                    <Clock size={14} style={{ color: "rgba(148, 163, 184, 0.6)" }} />
                                                    <span>{startStr} - {endStr} (₹{slot.current_price})</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Metadata billing / cancellations */}
                                    <div style={styles.cardFooter}>
                                        <div style={styles.metaInfo}>
                                            <span>Booking ID: <strong>#MK-{booking.id}</strong></span>
                                            {booking.payment_id && (
                                                <span style={{ marginLeft: "16px" }}>Ref: <strong>{booking.payment_id}</strong></span>
                                            )}
                                        </div>
                                        
                                        {/* Actions */}
                                        {!isCancelled && activeTab === "upcoming" && (
                                            <button
                                                onClick={() => handleCancel(booking.id)}
                                                disabled={cancellingId === booking.id}
                                                style={styles.cancelBtn}
                                            >
                                                {cancellingId === booking.id ? "Cancelling..." : "Cancel Reservation"}
                                            </button>
                                        )}

                                        {isCancelled && booking.cancellation_reason && (
                                            <div style={styles.cancellationText}>
                                                Reason: {booking.cancellation_reason}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
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
        color: "#00f0ff",
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
        maxWidth: "800px",
        margin: "0 auto",
        padding: "40px 20px",
    },
    tabsContainer: {
        display: "flex",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        marginBottom: "30px",
        gap: "24px",
    },
    tab: {
        background: "transparent",
        border: "none",
        borderBottom: "3px solid transparent",
        padding: "12px 8px",
        fontSize: "15px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.2s ease",
        fontFamily: "'Outfit', sans-serif",
    },
    loadingContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 0",
        color: "rgba(148, 163, 184, 0.6)",
    },
    errorContainer: {
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.25)",
        color: "#fca5a5",
        padding: "16px",
        borderRadius: "10px",
        textAlign: "center",
    },
    emptyContainer: {
        textAlign: "center",
        padding: "60px 0",
    },
    exploreLink: {
        display: "inline-block",
        marginTop: "16px",
        color: "#bffe00",
        fontWeight: "600",
        textDecoration: "none",
        borderBottom: "1px solid #bffe00",
    },
    list: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    bookingCard: {
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "14px",
        padding: "24px",
        transition: "all 0.25s ease",
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "18px",
        paddingBottom: "12px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    },
    sportHeader: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    sportLabel: {
        fontSize: "14px",
        fontWeight: "800",
        color: "#ffffff",
        letterSpacing: "0.03em",
    },
    badge: {
        border: "1px solid",
        borderRadius: "20px",
        padding: "4px 12px",
        fontSize: "11px",
        fontWeight: "700",
        letterSpacing: "0.02em",
    },
    cardDetails: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginBottom: "20px",
    },
    detailItem: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "14px",
        color: "rgba(241, 245, 249, 0.8)",
    },
    cardFooter: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: "16px",
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    },
    metaInfo: {
        fontSize: "12px",
        color: "rgba(148, 163, 184, 0.4)",
    },
    cancelBtn: {
        background: "rgba(239, 68, 68, 0.08)",
        border: "1px solid rgba(239, 68, 68, 0.25)",
        color: "#f87171",
        padding: "8px 16px",
        borderRadius: "8px",
        fontSize: "12px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.2s ease",
        fontFamily: "'Outfit', sans-serif",
    },
    cancellationText: {
        fontSize: "12px",
        color: "#f87171",
        fontStyle: "italic",
    },
};
