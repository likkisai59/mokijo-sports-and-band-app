"use client";
import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";

const API = API_BASE_URL;

function statusBadge(status) {
    const map = { reserved: "blue", paid: "green", cancelled: "red", pending: "yellow" };
    return <span className={`vd-badge ${map[status] || "gray"}`}>{status}</span>;
}

export default function BookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [venueFilter, setVenueFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [actionLoading, setActionLoading] = useState(null);

    const fetchOwnerBookings = async () => {
        const ownerId = localStorage.getItem("venueOwnerId");
        if (!ownerId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/bookings/venue-owner/${ownerId}`);
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
                setFiltered(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOwnerBookings();
    }, []);

    const handleBookingAction = async (bookingId, action) => {
        setActionLoading(bookingId);
        try {
            const res = await fetch(`${API}/bookings/${bookingId}/${action}`, {
                method: "POST",
            });
            if (res.ok) {
                await fetchOwnerBookings();
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

    useEffect(() => {
        let data = bookings;
        if (venueFilter !== "all") data = data.filter((b) => b.venue_name === venueFilter);
        if (statusFilter !== "all")
            data = data.filter((b) => b.booking_status === statusFilter || b.payment_status === statusFilter);
        if (search)
            data = data.filter(
                (b) =>
                    b.customer_name.toLowerCase().includes(search.toLowerCase()) ||
                    b.sport.toLowerCase().includes(search.toLowerCase())
            );
        setFiltered(data);
    }, [venueFilter, statusFilter, search, bookings]);

    const uniqueVenues = [...new Set(bookings.map((b) => b.venue_name))];

    const fmt = (iso) => {
        if (!iso) return "—";
        const d = new Date(iso);
        return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    };
    const fmtDate = (iso) => {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    };

    return (
        <>
            <h1 className="vd-page-title">Bookings</h1>
            <p className="vd-page-sub">All bookings across your venues</p>

            <div className="vd-controls">
                <input
                    className="vd-input-sm"
                    placeholder="Search customer / sport…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ minWidth: 200 }}
                />
                <select className="vd-select" value={venueFilter} onChange={(e) => setVenueFilter(e.target.value)}>
                    <option value="all">All Venues</option>
                    {uniqueVenues.map((v) => (
                        <option key={v} value={v}>
                            {v}
                        </option>
                    ))}
                </select>
                <select className="vd-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="reserved">Reserved</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <span style={{ marginLeft: "auto", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                    {filtered.length} bookings
                </span>
            </div>

            <div className="vd-card">
                {loading ? (
                    <div className="vd-loading">
                        <div className="vd-spinner" /> Loading…
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="vd-empty">
                        <div className="vd-empty-icon">📋</div>
                        <div className="vd-empty-text">No bookings found</div>
                        <div className="vd-empty-sub">Try changing your filters</div>
                    </div>
                ) : (
                    <div className="vd-table-wrap">
                        <table className="vd-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Customer</th>
                                    <th>Venue</th>
                                    <th>Sport</th>
                                    <th>Time</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((b) => (
                                    <tr key={b.booking_id}>
                                        <td style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
                                            #{b.booking_id}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{b.customer_name}</div>
                                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                                                {b.customer_email}
                                            </div>
                                        </td>
                                        <td>{b.venue_name}</td>
                                        <td style={{ textTransform: "capitalize" }}>{b.sport}</td>
                                        <td style={{ whiteSpace: "nowrap" }}>
                                            {fmt(b.start_time)} – {fmt(b.end_time)}
                                        </td>
                                        <td style={{ whiteSpace: "nowrap" }}>{fmtDate(b.booking_date)}</td>
                                        <td style={{ color: "#c6ff3d", fontWeight: 600 }}>₹{b.amount_paid}</td>
                                        <td>{statusBadge(b.payment_status)}</td>
                                        <td>{statusBadge(b.booking_status)}</td>
                                        <td style={{ whiteSpace: "nowrap" }}>
                                            {b.booking_status === "pending_approval" ? (
                                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                    <button
                                                        className="vd-action-btn vd-action-approve"
                                                        onClick={() => handleBookingAction(b.booking_id, "approve")}
                                                        disabled={actionLoading === b.booking_id}
                                                    >
                                                        {actionLoading === b.booking_id ? "Processing…" : "Approve"}
                                                    </button>
                                                    <button
                                                        className="vd-action-btn vd-action-reject"
                                                        onClick={() => handleBookingAction(b.booking_id, "reject")}
                                                        disabled={actionLoading === b.booking_id}
                                                    >
                                                        {actionLoading === b.booking_id ? "Processing…" : "Reject"}
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ color: "rgba(255,255,255,0.65)" }}>
                                                    No action
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
