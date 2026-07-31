"use client";
import { API_BASE_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import Link from "next/link";
import "@/app/styles/venues.css";

export default function DashboardBookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const userId = localStorage.getItem("userId");
        if (!userId) {
            setError("Session expired. Please log in.");
            setLoading(false);
            return;
        }

        fetch(`${API_BASE_URL}/users/${userId}/bookings`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => setBookings(Array.isArray(data) ? data : []))
            .catch(() => setError("Failed to load booked venues."))
            .finally(() => setLoading(false));
    }, []);

    const formatTime = (iso) => {
        try {
            return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } catch {
            return "";
        }
    };

    const formatDate = (iso) => {
        try {
            return new Date(iso).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
        } catch {
            return "";
        }
    };

    const bookedList = bookings.filter(
        (b) => b.status !== "cancelled" && (b.payment_status === "paid" || b.status === "confirmed")
    );

    return (
        <div className="venues-container">
            <header className="venues-header">
                <div>
                    <h1>My Bookings</h1>
                    <p>Booked venues list</p>
                </div>
            </header>

            {loading ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                    <p>Loading booked venues...</p>
                </div>
            ) : error ? (
                <div className="empty-slots-box" style={{ padding: 40 }}>
                    <p style={{ color: "var(--rose)" }}>{error}</p>
                </div>
            ) : bookedList.length === 0 ? (
                <div className="empty-slots-box" style={{ padding: 60 }}>
                    <p>No booked venues yet.</p>
                    <Link
                        href="/dashboard/venues"
                        className="book-now-text"
                        style={{ marginTop: 12, display: "inline-block" }}
                    >
                        Browse venues →
                    </Link>
                </div>
            ) : (
                <div style={{ width: "100%", overflowX: "auto" }}>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            textAlign: "left",
                            fontSize: 14,
                        }}
                    >
                        <thead>
                            <tr>
                                {["Venue", "Location", "Sport", "Date", "Time", "Amount", "Status", ""].map(
                                    (label) => (
                                        <th
                                            key={label || "action"}
                                            style={{
                                                padding: "12px 14px",
                                                borderBottom: "1px solid var(--border)",
                                                color: "var(--text-secondary)",
                                                fontWeight: 600,
                                                fontSize: 12,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.4px",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {label}
                                        </th>
                                    )
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {bookedList.map((booking) => {
                                const venueName = booking.venue?.name || "Venue";
                                const venueLocation = booking.venue?.location || "—";
                                const venueId = booking.venue?.id || booking.slots?.[0]?.venue_id;
                                const sport = booking.slots?.[0]?.sport || "—";
                                const slotDate = booking.slots?.[0]?.start_time
                                    ? formatDate(booking.slots[0].start_time)
                                    : formatDate(booking.booking_date) || "—";
                                const slotsText =
                                    booking.slots?.length > 0
                                        ? booking.slots
                                              .map(
                                                  (s) =>
                                                      `${formatTime(s.start_time)} – ${formatTime(s.end_time)}`
                                              )
                                              .join(", ")
                                        : "—";

                                return (
                                    <tr key={booking.id}>
                                        <td
                                            style={{
                                                padding: "14px",
                                                borderBottom: "1px solid var(--border)",
                                                color: "var(--text-primary)",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {venueName}
                                        </td>
                                        <td
                                            style={{
                                                padding: "14px",
                                                borderBottom: "1px solid var(--border)",
                                                color: "var(--text-secondary)",
                                            }}
                                        >
                                            {venueLocation}
                                        </td>
                                        <td
                                            style={{
                                                padding: "14px",
                                                borderBottom: "1px solid var(--border)",
                                                color: "var(--text-secondary)",
                                                textTransform: "capitalize",
                                            }}
                                        >
                                            {sport}
                                        </td>
                                        <td
                                            style={{
                                                padding: "14px",
                                                borderBottom: "1px solid var(--border)",
                                                color: "var(--text-secondary)",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {slotDate}
                                        </td>
                                        <td
                                            style={{
                                                padding: "14px",
                                                borderBottom: "1px solid var(--border)",
                                                color: "var(--text-secondary)",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {slotsText}
                                        </td>
                                        <td
                                            style={{
                                                padding: "14px",
                                                borderBottom: "1px solid var(--border)",
                                                color: "var(--text-primary)",
                                                fontWeight: 600,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            ₹{booking.amount_paid ?? 0}
                                        </td>
                                        <td
                                            style={{
                                                padding: "14px",
                                                borderBottom: "1px solid var(--border)",
                                                color: "#4ade80",
                                                fontWeight: 700,
                                                fontSize: 12,
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            Booked
                                        </td>
                                        <td
                                            style={{
                                                padding: "14px",
                                                borderBottom: "1px solid var(--border)",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {venueId ? (
                                                <Link
                                                    href={`/dashboard/venues?venue=${venueId}`}
                                                    className="book-now-text"
                                                >
                                                    View
                                                </Link>
                                            ) : null}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
