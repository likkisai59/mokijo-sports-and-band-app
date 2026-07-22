"use client";
import { API_BASE_URL } from "@/lib/api";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import "../../styles/venues.css";

function parseJsonList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function authHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

function loadRazorpayCheckout() {
    return new Promise((resolve, reject) => {
        if (typeof window !== "undefined" && window.Razorpay) return resolve();
        const existing = document.querySelector("script[src='https://checkout.razorpay.com/v1/checkout.js']");
        if (existing) {
            existing.addEventListener("load", () => resolve());
            existing.addEventListener("error", () => reject(new Error("Could not load Razorpay Checkout.")), {
                once: true,
            });
            return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Could not load Razorpay Checkout."));
        document.body.appendChild(script);
    });
}

function VenuesPageContent() {
    const searchParams = useSearchParams();
    const venueIdParam = searchParams.get("venue_id");

    const [venues, setVenues] = useState([]);
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [bookingStatus, setBookingStatus] = useState(null);
    const [bookingMessage, setBookingMessage] = useState("");

    const fetchVenues = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ registered: "true" });
            if (searchQuery.trim()) {
                params.set("location", searchQuery.trim());
            }
            const response = await fetch(`${API_BASE_URL}/venues?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setVenues(Array.isArray(data) ? data : []);
            } else {
                setVenues([]);
            }
        } catch (error) {
            console.error("Error fetching venues:", error);
            setVenues([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSlots = async (venueId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/venues/${venueId}/slots?date_str=${date}`);
            if (response.ok) {
                const data = await response.json();
                setSlots(Array.isArray(data) ? data : []);
            } else {
                setSlots([]);
            }
        } catch (error) {
            console.error("Error fetching slots:", error);
            setSlots([]);
        }
    };

    useEffect(() => {
        fetchVenues();
    }, [searchQuery]);

    useEffect(() => {
        if (!venueIdParam || venues.length === 0 || selectedVenue) return;
        const match = venues.find((v) => String(v.id) === String(venueIdParam));
        if (match) setSelectedVenue(match);
    }, [venueIdParam, venues, selectedVenue]);

    useEffect(() => {
        if (selectedVenue) {
            fetchSlots(selectedVenue.id);
            setSelectedSlot(null);
        }
    }, [selectedVenue, date]);

    const handleConfirmBooking = async () => {
        if (!selectedSlot) return;
        setBookingStatus("loading");

        try {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                setBookingStatus("error");
                setBookingMessage("Please log in to book a venue.");
                return;
            }

            const holdRes = await fetch(`${API_BASE_URL}/bookings/hold`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                    user_id: parseInt(userId, 10),
                    slot_ids: [selectedSlot.id],
                }),
            });
            const holdData = await holdRes.json().catch(() => ({}));
            if (!holdRes.ok) {
                setBookingStatus("error");
                setBookingMessage(holdData.detail || "Could not reserve this slot. Please try another time.");
                return;
            }

            const orderRes = await fetch(`${API_BASE_URL}/bookings/razorpay/order`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                    booking_id: holdData.id,
                    user_id: parseInt(userId, 10),
                }),
            });
            const order = await orderRes.json().catch(() => ({}));
            if (!orderRes.ok) {
                setBookingStatus("error");
                setBookingMessage(order.detail || "Could not start Razorpay payment.");
                return;
            }

            await loadRazorpayCheckout();

            const checkout = new window.Razorpay({
                key: order.key_id,
                amount: order.amount,
                currency: order.currency,
                name: order.name || "Mukijo Venue Booking",
                description: order.description || `Booking #${holdData.id}`,
                order_id: order.razorpay_order_id,
                prefill: {
                    name: order.prefill_name || "",
                    email: order.prefill_email || "",
                    contact: order.prefill_contact || "",
                },
                handler: async (response) => {
                    try {
                        const verifyRes = await fetch(`${API_BASE_URL}/bookings/razorpay/verify`, {
                            method: "POST",
                            headers: authHeaders(),
                            body: JSON.stringify({
                                booking_id: holdData.id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            }),
                        });
                        const verifyData = await verifyRes.json().catch(() => ({}));
                        if (!verifyRes.ok) {
                            setBookingStatus("error");
                            setBookingMessage(verifyData.detail || "Payment verification failed.");
                            return;
                        }
                        setBookingStatus("success");
                        setBookingMessage("Payment successful. Your venue slot is booked.");
                        fetchSlots(selectedVenue.id);
                        setSelectedSlot(null);
                    } catch (verifyErr) {
                        console.error(verifyErr);
                        setBookingStatus("error");
                        setBookingMessage("Payment verification failed.");
                    }
                },
                modal: {
                    ondismiss: () => {
                        setBookingStatus("error");
                        setBookingMessage("Payment cancelled. Your slot hold may expire shortly.");
                    },
                },
            });

            checkout.on("payment.failed", (response) => {
                setBookingStatus("error");
                setBookingMessage(response?.error?.description || "Payment failed.");
            });

            setBookingStatus(null);
            checkout.open();
        } catch (error) {
            setBookingStatus("error");
            setBookingMessage("Network error occurred while booking.");
            console.error("Booking error:", error);
        }
    };

    const formatTime = (dateTimeStr) => {
        try {
            const dateObj = new Date(dateTimeStr);
            return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } catch (e) {
            return dateTimeStr;
        }
    };

    const priceLabel = selectedSlot
        ? `Pay ₹${selectedSlot.current_price} with Razorpay`
        : "Select a slot to book";

    return (
        <div className="venues-container">
            <header className="venues-header">
                <div>
                    <h1>Venues & Arenas</h1>
                    <p>Browse venues registered by venue owners and book available slots with Razorpay.</p>
                </div>
            </header>

            {!selectedVenue ? (
                <>
                    <div className="venues-toolbar">
                        <div className="search-box">
                            <svg
                                viewBox="0 0 24 24"
                                width="18"
                                height="18"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                            >
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                                type="text"
                                placeholder="Search venues..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading && (
                        <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                            <p>Loading sports venues...</p>
                        </div>
                    )}

                    {!loading && (
                        <div className="venues-grid">
                            {venues.map((venue) => {
                                const sports = parseJsonList(venue.sports_supported);
                                const rating =
                                    typeof venue.rating === "number" ? venue.rating.toFixed(1) : "5.0";
                                return (
                                    <div
                                        key={venue.id}
                                        className="venue-card"
                                        onClick={() => setSelectedVenue(venue)}
                                    >
                                        <div className="venue-cover">
                                            {venue.cover_image ? (
                                                <img
                                                    src={venue.cover_image}
                                                    alt={venue.name}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                        display: "block",
                                                    }}
                                                />
                                            ) : (
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    width="48"
                                                    height="48"
                                                    stroke="currentColor"
                                                    strokeWidth="1"
                                                    fill="none"
                                                >
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                    <circle cx="12" cy="10" r="3"></circle>
                                                </svg>
                                            )}
                                        </div>
                                        <div className="venue-body">
                                            <h3 className="venue-title" style={{ margin: 0 }}>
                                                {venue.name}
                                            </h3>
                                            <div className="venue-location">
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    width="14"
                                                    height="14"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    fill="none"
                                                >
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                    <circle cx="12" cy="10" r="3"></circle>
                                                </svg>
                                                <span>{venue.location}</span>
                                            </div>
                                            <div className="venue-sports">
                                                {sports.map((sport) => (
                                                    <span key={sport} className="sport-tag">
                                                        {sport}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="venue-footer">
                                                <div className="venue-rating">
                                                    ★ <span>{rating}</span>
                                                </div>
                                                <span className="book-now-text">Book with Razorpay →</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {venues.length === 0 && (
                                <div className="empty-slots-box" style={{ gridColumn: "1 / -1", padding: "60px" }}>
                                    <p>No registered venues yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="venue-details-grid">
                    <div className="venue-info-sidebar">
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "14px" }}>
                            <h2 style={{ margin: 0 }}>{selectedVenue.name}</h2>
                        </div>
                        <div className="venue-location" style={{ marginBottom: "14px" }}>
                            <svg
                                viewBox="0 0 24 24"
                                width="14"
                                height="14"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                            >
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span>{selectedVenue.location}</span>
                        </div>
                        <div className="venue-rating" style={{ marginBottom: "20px" }}>
                            ★{" "}
                            <span>
                                {typeof selectedVenue.rating === "number"
                                    ? selectedVenue.rating.toFixed(1)
                                    : "5.0"}{" "}
                                Rating
                            </span>
                        </div>
                        <p>
                            This arena offers premium quality playing surfaces, changing room facilities, and is highly
                            accessible within local hubs.
                        </p>

                        <div className="amenity-list">
                            <h4
                                style={{
                                    color: "var(--text-primary)",
                                    fontSize: "12px",
                                    textTransform: "uppercase",
                                    marginBottom: "8px",
                                }}
                            >
                                Amenities
                            </h4>
                            {parseJsonList(selectedVenue.amenities).map((amenity) => (
                                <div key={amenity} className="amenity-item">
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="14"
                                        height="14"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        fill="none"
                                    >
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    <span>{amenity}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            className="sport-filter-btn"
                            style={{ width: "100%", marginTop: "28px" }}
                            onClick={() => setSelectedVenue(null)}
                        >
                            ← Back to Venues
                        </button>
                    </div>

                    <div className="slots-panel">
                        <div className="slots-header">
                            <h3>Available Time Slots</h3>
                            <input
                                type="date"
                                className="slots-date-picker"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>

                        <div className="slots-grid">
                            {slots.map((slot) => {
                                const isSelected = selectedSlot?.id === slot.id;
                                const isHeld = slot.status === "HELD";
                                const isBooked = slot.is_blocked || slot.status === "BOOKED";
                                const isUnavailable = isBooked || isHeld;
                                return (
                                    <div
                                        key={slot.id}
                                        className={`slot-item ${isUnavailable ? "blocked" : ""} ${isSelected ? "selected" : ""}`}
                                        onClick={() => !isUnavailable && setSelectedSlot(slot)}
                                    >
                                        <span className="slot-time">{formatTime(slot.start_time)}</span>
                                        <span className="slot-sport">{slot.sport}</span>
                                        <span className="slot-price">
                                            {isBooked ? "Booked" : isHeld ? "Pending" : `₹${slot.current_price}`}
                                        </span>
                                    </div>
                                );
                            })}

                            {slots.length === 0 && (
                                <div className="empty-slots-box">
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="32"
                                        height="32"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        fill="none"
                                    >
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    <p>No available slots found for this date. Check another calendar date.</p>
                                </div>
                            )}
                        </div>

                        <div className="confirm-booking-box">
                            <button
                                className="confirm-booking-btn"
                                disabled={!selectedSlot || bookingStatus === "loading"}
                                onClick={handleConfirmBooking}
                            >
                                {bookingStatus === "loading" ? "Opening Razorpay…" : priceLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {bookingStatus && bookingStatus !== "loading" && (
                <div className="modal-overlay" onClick={() => setBookingStatus(null)}>
                    <div
                        className="modal-card"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border)",
                            color: "var(--text-primary)",
                        }}
                    >
                        <div className="modal-header">
                            <h2 style={{ color: bookingStatus === "success" ? "var(--brand)" : "var(--rose)" }}>
                                {bookingStatus === "success" ? "Booking Confirmed!" : "Booking Issue"}
                            </h2>
                            <button className="close-btn" onClick={() => setBookingStatus(null)}>
                                ×
                            </button>
                        </div>
                        <p
                            style={{
                                fontSize: "14px",
                                lineHeight: "1.6",
                                color: "var(--text-secondary)",
                                marginBottom: "24px",
                            }}
                        >
                            {bookingMessage}
                        </p>
                        <button
                            className="confirm-booking-btn"
                            style={{ width: "100%" }}
                            onClick={() => setBookingStatus(null)}
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function VenuesPage() {
    return (
        <Suspense fallback={<div className="venues-container"><p>Loading venues...</p></div>}>
            <VenuesPageContent />
        </Suspense>
    );
}
