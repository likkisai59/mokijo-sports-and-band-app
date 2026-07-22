"use client";
import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";

const API = API_BASE_URL;

function StatCard({ icon, value, label, color }) {
    return (
        <div className="vd-stat-card">
            <div className={`vd-stat-icon ${color}`}>{icon}</div>
            <div className="vd-stat-value">{value}</div>
            <div className="vd-stat-label">{label}</div>
        </div>
    );
}

export default function VenueOverviewPage() {
    const [venues, setVenues] = useState([]);
    const [analytics, setAnalytics] = useState([]);
    const [pendingBookings, setPendingBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchPending = async (ownerId) => {
        try {
            const res = await fetch(`${API}/bookings/venue-owner/${ownerId}`);
            if (res.ok) {
                const data = await res.json();
                setPendingBookings(
                    (Array.isArray(data) ? data : []).filter((b) => b.booking_status === "pending_approval")
                );
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        const ownerId = localStorage.getItem("venueOwnerId");
        if (!ownerId) return;

        const load = async () => {
            try {
                const vRes = await fetch(`${API}/venue-owner/${ownerId}/venues`);
                const vData = vRes.ok ? await vRes.json() : [];
                setVenues(vData);

                const analyticsArr = await Promise.all(
                    vData.map((v) =>
                        fetch(`${API}/venues/${v.id}/analytics`)
                            .then((r) => (r.ok ? r.json() : null))
                            .catch(() => null)
                    )
                );
                setAnalytics(analyticsArr.filter(Boolean));
                await fetchPending(ownerId);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleBookingAction = async (bookingId, action) => {
        setActionLoading(bookingId);
        try {
            const res = await fetch(`${API}/bookings/${bookingId}/${action}`, { method: "POST" });
            if (res.ok) {
                const ownerId = localStorage.getItem("venueOwnerId");
                if (ownerId) await fetchPending(ownerId);
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.detail || `Failed to ${action} booking.`);
            }
        } catch (err) {
            console.error(err);
            alert(`Network error: could not ${action} booking.`);
        } finally {
            setActionLoading(null);
        }
    };

    const totalBookings = analytics.reduce((s, a) => s + (a?.total_bookings || 0), 0);
    const totalRevenue = analytics.reduce((s, a) => s + (a?.total_revenue || 0), 0);
    const avgOccupancy = analytics.length
        ? Math.round(analytics.reduce((s, a) => s + (a?.occupancy_rate || 0), 0) / analytics.length)
        : 0;

    // Top customers across all venues
    const allCustomers = analytics.flatMap((a) => a?.customer_retention || []);
    const topCustomers = allCustomers.sort((a, b) => b.bookings_count - a.bookings_count).slice(0, 5);

    // Peak hours across venues
    const allPeaks = analytics.flatMap((a) => a?.peak_hours || []);

    if (loading)
        return (
            <div className="vd-loading">
                <div className="vd-spinner" /> Loading home…
            </div>
        );

    return (
        <>
            <h1 className="vd-page-title">Home</h1>
            <p className="vd-page-sub">Your venue performance at a glance</p>

            <div className="vd-card" style={{ marginBottom: 20 }}>
                <div className="vd-card-header">
                    <span className="vd-card-title">Pending booking requests</span>
                    <a href="/venue-dashboard/bookings" className="vd-card-action">
                        View all →
                    </a>
                </div>
                {pendingBookings.length === 0 ? (
                    <div className="vd-empty" style={{ padding: "24px 0" }}>
                        <div className="vd-empty-text">No pending requests</div>
                        <div className="vd-empty-sub">New booking requests will show up here</div>
                    </div>
                ) : (
                    <div className="vd-table-wrap">
                        <table className="vd-table">
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Venue</th>
                                    <th>Sport</th>
                                    <th>Amount</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingBookings.slice(0, 8).map((b) => (
                                    <tr key={b.booking_id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{b.customer_name}</div>
                                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                                                {b.customer_email}
                                            </div>
                                        </td>
                                        <td>{b.venue_name}</td>
                                        <td style={{ textTransform: "capitalize" }}>{b.sport}</td>
                                        <td style={{ color: "#bffe00", fontWeight: 600 }}>₹{b.amount_paid}</td>
                                        <td style={{ whiteSpace: "nowrap" }}>
                                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                <button
                                                    className="vd-action-btn vd-action-approve"
                                                    onClick={() => handleBookingAction(b.booking_id, "approve")}
                                                    disabled={actionLoading === b.booking_id}
                                                >
                                                    {actionLoading === b.booking_id ? "…" : "Approve"}
                                                </button>
                                                <button
                                                    className="vd-action-btn vd-action-reject"
                                                    onClick={() => handleBookingAction(b.booking_id, "reject")}
                                                    disabled={actionLoading === b.booking_id}
                                                >
                                                    {actionLoading === b.booking_id ? "…" : "Reject"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="vd-stats-row">
                <StatCard
                    color="green"
                    value={venues.length}
                    label="Active Venues"
                    icon={
                        <svg
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                    }
                />
                <StatCard
                    color="cyan"
                    value={totalBookings}
                    label="Total Bookings"
                    icon={
                        <svg
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    }
                />
                <StatCard
                    color="orange"
                    value={`₹${totalRevenue.toLocaleString()}`}
                    label="Total Revenue"
                    icon={
                        <svg
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    }
                />
                <StatCard
                    color="blue"
                    value={`${avgOccupancy}%`}
                    label="Avg Occupancy"
                    icon={
                        <svg
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                    }
                />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Peak Hours */}
                <div className="vd-card">
                    <div className="vd-card-header">
                        <span className="vd-card-title">Peak Hours</span>
                    </div>
                    {allPeaks.length === 0 ? (
                        <div className="vd-empty">
                            <div className="vd-empty-icon">⏰</div>
                            <div className="vd-empty-text">No data yet</div>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {allPeaks.slice(0, 5).map((p, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <span
                                        style={{
                                            fontSize: 13,
                                            color: "rgba(255,255,255,0.6)",
                                            width: 80,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {p.time}
                                    </span>
                                    <div
                                        style={{
                                            flex: 1,
                                            background: "rgba(255,255,255,0.06)",
                                            borderRadius: 4,
                                            height: 8,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: "100%",
                                                width: `${p.percentage}%`,
                                                background: "linear-gradient(90deg,#bffe00,#00f0ff)",
                                                borderRadius: 4,
                                            }}
                                        />
                                    </div>
                                    <span style={{ fontSize: 12, color: "#bffe00", width: 36, textAlign: "right" }}>
                                        {p.percentage}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Customers */}
                <div className="vd-card">
                    <div className="vd-card-header">
                        <span className="vd-card-title">Top Customers</span>
                    </div>
                    {topCustomers.length === 0 ? (
                        <div className="vd-empty">
                            <div className="vd-empty-icon">👤</div>
                            <div className="vd-empty-text">No bookings yet</div>
                        </div>
                    ) : (
                        <table className="vd-table">
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Bookings</th>
                                    <th>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topCustomers.map((c, i) => (
                                    <tr key={i}>
                                        <td>{c.user_name}</td>
                                        <td>{c.bookings_count}</td>
                                        <td>
                                            <span className={`vd-badge ${c.is_repeat ? "green" : "gray"}`}>
                                                {c.is_repeat ? "Repeat" : "New"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Venues Summary */}
            <div className="vd-card" style={{ marginTop: 0 }}>
                <div className="vd-card-header">
                    <span className="vd-card-title">Your Venues</span>
                    <a href="/venue-dashboard/my-venues" className="vd-card-action">
                        View all →
                    </a>
                </div>
                {venues.length === 0 ? (
                    <div className="vd-empty">
                        <div className="vd-empty-text">No venues registered yet.</div>
                    </div>
                ) : (
                    <table className="vd-table">
                        <thead>
                            <tr>
                                <th>Venue</th>
                                <th>Location</th>
                                <th>Sports</th>
                                <th>Slots</th>
                                <th>Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            {venues.map((v, i) => {
                                const sports = (() => {
                                    try {
                                        return JSON.parse(v.sports_supported || "[]");
                                    } catch {
                                        return [];
                                    }
                                })();
                                const a = analytics[i];
                                return (
                                    <tr key={v.id}>
                                        <td style={{ fontWeight: 600 }}>{v.name}</td>
                                        <td>{v.location}</td>
                                        <td>
                                            {sports.slice(0, 2).join(", ")}
                                            {sports.length > 2 ? ` +${sports.length - 2}` : ""}
                                        </td>
                                        <td>{a?.total_bookings ?? "—"}</td>
                                        <td>⭐ {v.rating ?? "5.0"}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}
