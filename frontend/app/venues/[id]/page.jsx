"use client";
import { API_BASE_URL } from "@/lib/api";
import { openVenueBookingRazorpay, getPostVenueBookingPath } from "@/lib/venueRazorpay";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useParams as useReactRouterParams } from "react-router-dom";
import {
    ArrowLeft,
    MapPin,
    Star,
    Calendar as CalIcon,
    Clock,
    ChevronRight,
    CheckCircle2,
    User,
    MessageSquare,
} from "lucide-react";

export default function VenueDetailPage(props) {
    const routeParams = useReactRouterParams() || {};
    const id = props?.params?.id || routeParams?.id;
    const router = useRouter();

    const [venue, setVenue] = useState(null);
    const [courts, setCourts] = useState([]);
    const [selectedCourt, setSelectedCourt] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [datesList, setDatesList] = useState([]);
    const [slots, setSlots] = useState([]);
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [loadingVenue, setLoadingVenue] = useState(true);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Reviews list
    const [reviews, setReviews] = useState([]);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        // Generate list of next 7 days
        const list = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const iso = d.toISOString().split("T")[0];
            const display = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
            list.push({ iso, display, isToday: i === 0 });
        }
        setDatesList(list);
        setSelectedDate(list[0].iso);
    }, []);

    useEffect(() => {
        if (!id) return;
        const fetchVenueDetail = async () => {
            setLoadingVenue(true);
            try {
                let found = null;
                const directRes = await fetch(`${API_BASE_URL}/venues/${id}`);
                if (directRes.ok) {
                    found = await directRes.json();
                } else {
                    const listRes = await fetch(`${API_BASE_URL}/venues`);
                    if (listRes.ok) {
                        const allVenues = await listRes.json();
                        found = (allVenues || []).find((v) => v.id.toString() === id.toString());
                    }
                }

                if (found) {
                    setVenue(found);
                    setCourts(found.courts || []);
                    setReviews(found.reviews || []);
                    if (found.courts && found.courts.length > 0) {
                        setSelectedCourt(found.courts[0]);
                    }
                } else {
                    setError("Venue detail not found.");
                }
            } catch (err) {
                console.error(err);
                setError("Cannot connect to server.");
            } finally {
                setLoadingVenue(false);
            }
        };
        fetchVenueDetail();
    }, [id]);

    useEffect(() => {
        if (!id || !selectedDate) return;
        loadSlots();
    }, [id, selectedDate, selectedCourt]);

    const loadSlots = async () => {
        if (!id || !selectedDate) return;
        setLoadingSlots(true);
        try {
            const res = await fetch(`${API_BASE_URL}/venues/${id}/slots?date_str=${selectedDate}`);
            if (res.ok) {
                const data = await res.json();
                let filtered = data;
                if (selectedCourt) {
                    filtered = data.filter((s) => s.court_id === selectedCourt.id || !s.court_id);
                }
                setSlots(filtered || []);
                setSelectedSlots([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleSlotClick = (slot) => {
        if (slot.status === "BOOKED" || slot.is_blocked) return;

        // Toggle slot selection
        if (selectedSlots.includes(slot.id)) {
            setSelectedSlots((prev) => prev.filter((sId) => sId !== slot.id));
        } else {
            setSelectedSlots((prev) => [...prev, slot.id]);
        }
    };

    const handleBook = async () => {
        if (selectedSlots.length === 0) return;
        const userId = localStorage.getItem("userId");
        if (!userId) {
            setError("Please log in to book a slot and pay with Razorpay.");
            router.push("/login-user");
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const token = localStorage.getItem("accessToken");
            const headers = { "Content-Type": "application/json" };
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const res = await fetch(`${API_BASE_URL}/bookings/hold`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    slot_ids: selectedSlots,
                    user_id: Number(userId),
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const detail = errorData.detail;
                const message = Array.isArray(detail)
                    ? detail.map((d) => d.msg || d).join(", ")
                    : detail || "One or more slots are no longer available. Please select other slots.";
                setError(message);
                return;
            }

            const booking = await res.json();
            if (!booking?.id) {
                setError("Booking hold created but no booking id returned. Please try again.");
                return;
            }

            await openVenueBookingRazorpay({
                bookingId: booking.id,
                userId,
                onSuccess: () => {
                    setSelectedSlots([]);
                    router.push(getPostVenueBookingPath());
                },
                onError: (message) => setError(message),
                onDismiss: () => {
                    setError("Payment cancelled. Your slots may still be held for a few minutes.");
                    loadSlots();
                },
            });
        } catch (err) {
            console.error(err);
            if (err?.message && err.message !== "Payment cancelled.") {
                setError(err.message || "Connection error. Please try again.");
            }
            loadSlots();
        } finally {
            setSubmitting(false);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        const userId = localStorage.getItem("userId");
        if (!userId) {
            alert("Please log in to submit a review.");
            return;
        }

        setSubmittingReview(true);
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
            const res = await fetch(`${API_BASE_URL}/venues/${id}/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    user_id: Number(userId),
                    rating: newRating,
                    comment: newComment,
                }),
            });

            if (res.ok) {
                const newRev = await res.json();
                setReviews((prev) => [newRev, ...prev]);
                setNewComment("");
                setNewRating(5);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loadingVenue) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p>Loading arena information...</p>
            </div>
        );
    }

    if (error && !venue) {
        return (
            <div style={styles.errorWrapper}>
                <div style={styles.errorContainer}>{error}</div>
                <Link href="/venues" style={styles.backLink}>
                    Go Back
                </Link>
            </div>
        );
    }

    const totalPrice = slots.filter((s) => selectedSlots.includes(s.id)).reduce((sum, s) => sum + s.current_price, 0);

    return (
        <div style={styles.container}>
            {/* Top Bar */}
            <header style={styles.header}>
                <Link href="/venues" style={styles.backBtn}>
                    <ArrowLeft size={16} />
                    <span>Back to Arenas</span>
                </Link>
                <div style={styles.headerBrand}>
                    <span style={styles.logo}>{venue?.name}</span>
                </div>
            </header>

            <main style={styles.main}>
                {/* Details Banner */}
                <section style={styles.banner}>
                    <div style={styles.bannerInfo}>
                        <h1 style={styles.title}>{venue?.name}</h1>
                        <div style={styles.locationGroup}>
                            <MapPin size={16} style={{ color: "#d9ff6e" }} />
                            <span>{venue?.location}</span>
                        </div>
                        <div style={styles.ratingGroup}>
                            <Star size={16} fill="#ffb800" stroke="#ffb800" />
                            <span style={styles.ratingVal}>{venue?.rating}</span>
                            <span style={styles.ratingCount}>({reviews.length} reviews)</span>
                        </div>
                        <p style={styles.desc}>
                            {venue?.description ||
                                "A premier sports facility featuring top-tier courts, lighting, and amenities to support all competitive and recreational activities."}
                        </p>
                    </div>
                    <div style={styles.bannerMedia}>
                        <img
                            src={
                                venue?.cover_image ||
                                "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=600&auto=format&fit=crop"
                            }
                            alt={venue?.name}
                            style={styles.coverImg}
                        />
                    </div>
                </section>

                {error && <div style={{ ...styles.errorContainer, marginBottom: "24px" }}>{error}</div>}

                {/* Booking Picker Section */}
                <div style={styles.grid}>
                    <div style={styles.leftCol}>
                        {/* Court Picker */}
                        {courts.length > 0 && (
                            <section style={styles.section}>
                                <h2 style={styles.sectionTitle}>Select Court / Pitch</h2>
                                <div style={styles.courtsGrid}>
                                    {courts.map((court) => (
                                        <button
                                            key={court.id}
                                            onClick={() => setSelectedCourt(court)}
                                            style={{
                                                ...styles.courtCard,
                                                borderColor:
                                                    selectedCourt?.id === court.id
                                                        ? "#c6ff3d"
                                                        : "rgba(255, 255, 255, 0.08)",
                                                background:
                                                    selectedCourt?.id === court.id
                                                        ? "rgba(198, 255, 61, 0.05)"
                                                        : "rgba(255, 255, 255, 0.02)",
                                            }}
                                        >
                                            <h3 style={styles.courtName}>{court.name}</h3>
                                            <span style={styles.courtType}>{court.sport_type}</span>
                                            <span style={styles.courtCap}>Capacity: {court.capacity} players</span>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Date Picker */}
                        <section style={styles.section}>
                            <h2 style={styles.sectionTitle}>Select Date</h2>
                            <div style={styles.dateSelector}>
                                {datesList.map((d) => (
                                    <button
                                        key={d.iso}
                                        onClick={() => setSelectedDate(d.iso)}
                                        style={{
                                            ...styles.dateChip,
                                            backgroundColor:
                                                selectedDate === d.iso ? "#d9ff6e" : "rgba(255, 255, 255, 0.04)",
                                            color: selectedDate === d.iso ? "#08080f" : "#f4f4f5",
                                            borderColor:
                                                selectedDate === d.iso ? "#d9ff6e" : "rgba(255, 255, 255, 0.08)",
                                        }}
                                    >
                                        {d.display}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Time Slots Selector */}
                        <section style={styles.section}>
                            <h2 style={styles.sectionTitle}>Available Slots</h2>
                            {loadingSlots ? (
                                <div style={styles.slotsLoading}>Loading court timings...</div>
                            ) : slots.length === 0 ? (
                                <div style={styles.slotsEmpty}>No available slots for the selected date/court.</div>
                            ) : (
                                <div style={styles.slotsGrid}>
                                    {slots.map((slot) => {
                                        const startTime = new Date(slot.start_time).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        });
                                        const endTime = new Date(slot.end_time).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        });
                                        const isBooked = slot.status === "BOOKED" || slot.is_blocked;
                                        const isHeld = slot.status === "HELD" && new Date(slot.held_until) > new Date();
                                        const isSelected = selectedSlots.includes(slot.id);

                                        let slotBg = "rgba(255, 255, 255, 0.03)";
                                        let slotBorder = "rgba(255, 255, 255, 0.06)";
                                        let slotColor = "#f4f4f5";
                                        let cursor = "pointer";

                                        if (isBooked) {
                                            slotBg = "rgba(239, 68, 68, 0.06)";
                                            slotBorder = "rgba(239, 68, 68, 0.15)";
                                            slotColor = "rgba(148, 163, 184, 0.3)";
                                            cursor = "not-allowed";
                                        } else if (isHeld) {
                                            slotBg = "rgba(234, 179, 8, 0.06)";
                                            slotBorder = "rgba(234, 179, 8, 0.15)";
                                            slotColor = "rgba(148, 163, 184, 0.4)";
                                            cursor = "not-allowed";
                                        } else if (isSelected) {
                                            slotBg = "rgba(198, 255, 61, 0.1)";
                                            slotBorder = "#c6ff3d";
                                            slotColor = "#c6ff3d";
                                        }

                                        return (
                                            <div
                                                key={slot.id}
                                                onClick={() => handleSlotClick(slot)}
                                                style={{
                                                    ...styles.slotCard,
                                                    backgroundColor: slotBg,
                                                    borderColor: slotBorder,
                                                    color: slotColor,
                                                    cursor: cursor,
                                                }}
                                            >
                                                <div style={styles.slotTime}>
                                                    <Clock size={12} />
                                                    <span>
                                                        {startTime} - {endTime}
                                                    </span>
                                                </div>
                                                <span style={styles.slotPrice}>
                                                    {isBooked
                                                        ? "BOOKED"
                                                        : isHeld
                                                          ? "PENDING"
                                                          : `₹${slot.current_price}`}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        {/* Customer Reviews Area */}
                        <section style={styles.section}>
                            <h2 style={styles.sectionTitle}>Customer Reviews</h2>

                            {/* Review Form */}
                            <form onSubmit={handleReviewSubmit} style={styles.reviewForm}>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px" }}>
                                    Write a Review
                                </h3>
                                <div
                                    style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px" }}
                                >
                                    <label
                                        style={{
                                            fontSize: "12px",
                                            color: "rgba(148, 163, 184, 0.6)",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        Rating:
                                    </label>
                                    <select
                                        value={newRating}
                                        onChange={(e) => setNewRating(Number(e.target.value))}
                                        style={styles.reviewSelect}
                                    >
                                        {[5, 4, 3, 2, 1].map((r) => (
                                            <option key={r} value={r}>
                                                {r} Star{r > 1 ? "s" : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <textarea
                                    placeholder="Share your experience playing at this arena..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    style={styles.reviewTextarea}
                                    rows={3}
                                    required
                                />
                                <button type="submit" style={styles.reviewSubmitBtn} disabled={submittingReview}>
                                    {submittingReview ? "Posting..." : "Submit Review"}
                                </button>
                            </form>

                            {/* Reviews list */}
                            <div style={styles.reviewsList}>
                                {reviews.length === 0 ? (
                                    <p style={{ color: "rgba(148, 163, 184, 0.4)", fontSize: "14px" }}>
                                        No reviews posted yet.
                                    </p>
                                ) : (
                                    reviews.map((rev) => (
                                        <div key={rev.id} style={styles.reviewItem}>
                                            <div style={styles.reviewHeader}>
                                                <div style={styles.reviewUser}>
                                                    <User size={16} style={{ color: "#d9ff6e" }} />
                                                    <span>{rev.user_name || "Verified Athlete"}</span>
                                                </div>
                                                <div style={styles.reviewStars}>
                                                    {Array.from({ length: rev.rating }).map((_, i) => (
                                                        <Star key={i} size={12} fill="#ffb800" stroke="#ffb800" />
                                                    ))}
                                                </div>
                                            </div>
                                            <p style={styles.reviewComment}>{rev.comment}</p>
                                            <span style={styles.reviewDate}>
                                                {new Date(rev.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Checkout Summary sticky */}
                    <div style={styles.rightCol}>
                        <div style={styles.stickySummary}>
                            <h3 style={styles.summaryTitle}>Booking Summary</h3>

                            <div style={styles.summaryDetails}>
                                <div style={styles.summaryRow}>
                                    <span style={styles.summaryLabel}>Venue</span>
                                    <span style={styles.summaryVal}>{venue?.name}</span>
                                </div>
                                <div style={styles.summaryRow}>
                                    <span style={styles.summaryLabel}>Court</span>
                                    <span style={styles.summaryVal}>{selectedCourt?.name || "None Selected"}</span>
                                </div>
                                <div style={styles.summaryRow}>
                                    <span style={styles.summaryLabel}>Date</span>
                                    <span style={styles.summaryVal}>
                                        {new Date(selectedDate).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </span>
                                </div>
                                <div style={styles.summaryRow}>
                                    <span style={styles.summaryLabel}>Slots Selected</span>
                                    <span style={styles.summaryVal}>{selectedSlots.length} slot(s)</span>
                                </div>
                            </div>

                            <div style={styles.totalRow}>
                                <span>Total Price</span>
                                <span>₹{totalPrice}</span>
                            </div>

                            <button
                                onClick={handleBook}
                                disabled={selectedSlots.length === 0 || submitting}
                                style={{
                                    ...styles.checkoutBtn,
                                    opacity: selectedSlots.length === 0 || submitting ? 0.6 : 1,
                                    cursor: selectedSlots.length === 0 || submitting ? "not-allowed" : "pointer",
                                }}
                            >
                                {submitting ? "Opening Razorpay..." : "Book Now"}
                            </button>
                            <p style={styles.summaryTip}>* Razorpay opens immediately to complete payment.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
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
        color: "#d9ff6e",
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
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "40px",
    },
    banner: {
        background: "linear-gradient(135deg, rgba(20, 20, 31, 0.9) 0%, rgba(20, 20, 35, 0.7) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        padding: "40px",
        marginBottom: "40px",
        display: "grid",
        gridTemplateColumns: "1.2fr 0.8fr",
        gap: "40px",
        position: "relative",
        overflow: "hidden",
    },
    bannerInfo: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
    },
    title: {
        fontSize: "36px",
        fontWeight: "900",
        marginBottom: "12px",
        background: "linear-gradient(135deg, #ffffff, rgba(255,255,255,0.75))",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },
    locationGroup: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "14px",
        color: "rgba(148, 163, 184, 0.8)",
        marginBottom: "10px",
    },
    ratingGroup: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "14px",
        marginBottom: "20px",
    },
    ratingVal: {
        fontWeight: "700",
        color: "#ffb800",
    },
    ratingCount: {
        color: "rgba(148, 163, 184, 0.4)",
    },
    desc: {
        fontSize: "15px",
        color: "rgba(244, 244, 245, 0.65)",
        lineHeight: "1.6",
    },
    bannerMedia: {
        borderRadius: "12px",
        overflow: "hidden",
        height: "220px",
        backgroundColor: "#0c0c16",
    },
    coverImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
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
    grid: {
        display: "grid",
        gridTemplateColumns: "1.3fr 0.7fr",
        gap: "40px",
    },
    leftCol: {
        display: "flex",
        flexDirection: "column",
        gap: "40px",
    },
    rightCol: {
        display: "flex",
        flexDirection: "column",
    },
    section: {
        display: "flex",
        flexDirection: "column",
    },
    sectionTitle: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#f4f4f5",
        marginBottom: "20px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderLeft: "3px solid #c6ff3d",
        paddingLeft: "10px",
    },
    courtsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "16px",
    },
    courtCard: {
        border: "1.5px solid",
        borderRadius: "12px",
        padding: "16px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        textAlign: "left",
        fontFamily: "'Outfit', sans-serif",
        color: "#f4f4f5",
        transition: "all 0.25s ease",
    },
    courtName: {
        fontSize: "15px",
        fontWeight: "700",
        marginBottom: "4px",
    },
    courtType: {
        fontSize: "12px",
        color: "#d9ff6e",
        textTransform: "uppercase",
        fontWeight: "600",
        marginBottom: "8px",
    },
    courtCap: {
        fontSize: "11px",
        color: "rgba(148, 163, 184, 0.4)",
    },
    dateSelector: {
        display: "flex",
        gap: "12px",
        overflowX: "auto",
        paddingBottom: "8px",
    },
    dateChip: {
        padding: "10px 20px",
        borderRadius: "10px",
        border: "1px solid",
        fontWeight: "700",
        fontSize: "13px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
        fontFamily: "'Outfit', sans-serif",
    },
    slotsLoading: {
        color: "rgba(148, 163, 184, 0.5)",
        fontSize: "14px",
        padding: "20px 0",
    },
    slotsEmpty: {
        color: "rgba(239, 68, 68, 0.6)",
        fontSize: "14px",
        padding: "20px 0",
    },
    slotsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: "14px",
    },
    slotCard: {
        border: "1.5px solid",
        borderRadius: "10px",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.25s ease",
    },
    slotTime: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "12px",
        fontWeight: "600",
    },
    slotPrice: {
        fontSize: "14px",
        fontWeight: "800",
    },
    stickySummary: {
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
        fontSize: "16px",
        fontWeight: "700",
        textTransform: "uppercase",
        color: "rgba(244, 244, 245, 0.6)",
        marginBottom: "20px",
        letterSpacing: "0.05em",
    },
    summaryDetails: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        marginBottom: "20px",
        paddingBottom: "20px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    },
    summaryRow: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "14px",
    },
    summaryLabel: {
        color: "rgba(148, 163, 184, 0.5)",
    },
    summaryVal: {
        fontWeight: "600",
        color: "#ffffff",
        textAlign: "right",
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
    checkoutBtn: {
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
    summaryTip: {
        fontSize: "11px",
        color: "rgba(148, 163, 184, 0.4)",
        textAlign: "center",
        marginTop: "12px",
        lineHeight: "1.4",
    },
    reviewForm: {
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "24px",
    },
    reviewSelect: {
        background: "#0c0c16",
        color: "#f4f4f5",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "6px",
        padding: "4px 8px",
        fontSize: "13px",
        outline: "none",
        cursor: "pointer",
        fontFamily: "'Outfit', sans-serif",
    },
    reviewTextarea: {
        width: "100%",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "8px",
        padding: "12px",
        color: "#f4f4f5",
        fontSize: "14px",
        outline: "none",
        fontFamily: "'Outfit', sans-serif",
        resize: "none",
        marginBottom: "12px",
    },
    reviewSubmitBtn: {
        background: "rgba(217, 255, 110, 0.1)",
        border: "1px solid rgba(217, 255, 110, 0.2)",
        color: "#d9ff6e",
        padding: "8px 20px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    reviewsList: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    reviewItem: {
        background: "rgba(255, 255, 255, 0.01)",
        border: "1px solid rgba(255, 255, 255, 0.04)",
        borderRadius: "10px",
        padding: "16px",
    },
    reviewHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8px",
    },
    reviewUser: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "13px",
        fontWeight: "600",
    },
    reviewStars: {
        display: "flex",
        gap: "2px",
    },
    reviewComment: {
        fontSize: "13px",
        color: "rgba(244, 244, 245, 0.7)",
        lineHeight: "1.5",
        margin: "0 0 8px 0",
    },
    reviewDate: {
        fontSize: "11px",
        color: "rgba(148, 163, 184, 0.3)",
    },
};
