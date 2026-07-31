"use client";
import { API_BASE_URL } from "@/lib/api";
import { openVenueBookingRazorpay } from "@/lib/venueRazorpay";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "@/app/styles/venues.css";

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

function VenuesPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
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
                const list = Array.isArray(data) ? data : [];
                setVenues(list);
                const venueIdParam = searchParams.get("venue");
                if (venueIdParam) {
                    const match = list.find((v) => String(v.id) === String(venueIdParam));
                    if (match) setSelectedVenue(match);
                }
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
            const token = localStorage.getItem("accessToken");
            if (!userId || !token) {
                setBookingStatus("error");
                setBookingMessage("Please log in to book a slot and pay with Razorpay.");
                return;
            }

            const response = await fetch(`${API_BASE_URL}/bookings/hold`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: parseInt(userId, 10),
                    slot_ids: [selectedSlot.id],
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data?.id) {
                const detail = data.detail;
                const message = Array.isArray(detail)
                    ? detail.map((d) => d.msg || d).join(", ")
                    : detail || "This slot could not be held. Please try another time.";
                setBookingStatus("error");
                setBookingMessage(message);
                return;
            }

            await openVenueBookingRazorpay({
                bookingId: data.id,
                userId,
                onSuccess: () => {
                    setSelectedSlot(null);
                    fetchSlots(selectedVenue.id);
                    setBookingStatus("success");
                    setBookingMessage("Payment successful. Your booking is confirmed.");
                    router.push("/dashboard/bookings");
                },
                onError: (message) => {
                    setBookingStatus("error");
                    setBookingMessage(message);
                    fetchSlots(selectedVenue.id);
                },
                onDismiss: () => {
                    setBookingStatus("error");
                    setBookingMessage("Payment cancelled. Your slot may still be held for a few minutes.");
                    fetchSlots(selectedVenue.id);
                },
            });
        } catch (error) {
            if (error?.message === "Payment cancelled.") {
                setBookingStatus("error");
                setBookingMessage("Payment cancelled. Your slot may still be held for a few minutes.");
            } else {
                setBookingStatus("error");
                setBookingMessage(error?.message || "Network error occurred while starting Razorpay checkout.");
            }
            if (selectedVenue) fetchSlots(selectedVenue.id);
            console.error("Booking hold error:", error);
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

    return (
        <div className="venues-container">
            <header className="venues-header">
                <div>
                    <h1>Venues & Arenas</h1>
                    <p>Browse venues registered by venue owners and book available slots.</p>
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
                                placeholder="Search by location..."
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
                                                <span className="book-now-text">View slots →</span>
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
                        <h2 style={{ margin: "0 0 14px" }}>{selectedVenue.name}</h2>
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
                                {bookingStatus === "loading" ? "Opening Razorpay..." : "Book Now"}
                            </button>
                            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, textAlign: "center" }}>
                                Razorpay opens immediately to complete payment.
                            </p>
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
                                {bookingStatus === "success" ? "Booking Confirmed!" : "Booking Conflict"}
                            </h2>
                            <button className="close-btn" onClick={() => setBookingStatus(null)}>
                                ×
                            </button>
                        </div>
                        <p>{bookingMessage}</p>
                        <button className="confirm-booking-btn" onClick={() => setBookingStatus(null)}>
                            Close
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
