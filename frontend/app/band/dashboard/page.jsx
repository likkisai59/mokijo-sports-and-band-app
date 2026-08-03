"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import bandApi from "@/lib/bandApi";
import { getBandUser, isBandAuthenticated, BAND_ROLE_LABELS } from "@/lib/bandAuth";

function extractStats(obj) {
    if (!obj || typeof obj !== "object") return [];
    return Object.entries(obj)
        .filter(([, v]) => typeof v === "number" || typeof v === "string")
        .filter(([k]) => !["id", "name", "email", "role", "status", "currency"].includes(k))
        .slice(0, 6);
}

function normalizeBookings(res) {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.items)) return res.items;
    if (res && Array.isArray(res.bookings)) return res.bookings;
    return [];
}

const STATUS_COLORS = {
    pending: "rgba(245, 158, 11, 0.15)",
    accepted: "rgba(16, 185, 129, 0.15)",
    counter_offered: "rgba(217, 255, 110, 0.15)",
    completed: "rgba(198, 255, 61, 0.12)",
    rejected: "rgba(239, 68, 68, 0.15)",
    cancelled: "rgba(255, 255, 255, 0.06)",
};

export default function BandDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isBandAuthenticated()) {
            router.replace("/band/login");
            return;
        }
        const u = getBandUser();
        setUser(u);

        async function load() {
            try {
                const promises = [];
                let statsUrl = null;
                let bookingsUrl = null;

                if (u.role === "artist") {
                    statsUrl = "/artists/me/dashboard";
                    bookingsUrl = "/bookings/artist";
                } else if (u.role === "venue_owner") {
                    statsUrl = "/venues/me/dashboard";
                    bookingsUrl = "/bookings/venue";
                } else if (u.role === "client") {
                    bookingsUrl = "/bookings/client";
                }

                if (statsUrl) promises.push(bandApi.get(statsUrl).then((r) => r.data).catch(() => null));
                else promises.push(Promise.resolve(null));
                if (bookingsUrl) promises.push(bandApi.get(bookingsUrl).then((r) => normalizeBookings(r.data)).catch(() => []));
                else promises.push(Promise.resolve([]));

                const [s, b] = await Promise.all(promises);
                setStats(s);
                setBookings(b);
            } catch {
                setError("Could not load your dashboard. Please try again.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [router]);

    if (!user) {
        return <div className="band-loading">Loading…</div>;
    }

    const statEntries = extractStats(stats);

    return (
        <div className="band-dash">
            <div className="band-dash__head">
                <div className="band-dash__role">{BAND_ROLE_LABELS[user.role] || user.role}</div>
                <h1 className="band-dash__greet">Hey {user.name || "there"} 👋</h1>
                <p style={{ color: "rgba(244, 244, 245,0.5)", fontSize: 14, marginTop: 4 }}>
                    Welcome to your band dashboard.
                </p>
            </div>

            {error && <div className="band-error">{error}</div>}

            {loading ? (
                <div className="band-loading">Loading your stats…</div>
            ) : (
                <>
                    {statEntries.length > 0 && (
                        <div className="band-stats">
                            {statEntries.map(([k, v], i) => (
                                <div className="band-stat" key={k}>
                                    <div className="band-stat__label">{k.replace(/_/g, " ")}</div>
                                    <div className={`band-stat__value ${i === 0 ? "band-stat__value--accent" : ""}`}>{v}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="band-section__head">
                        <h2 className="band-section__title">Recent bookings</h2>
                        <Link href="/band/bookings" className="band-navbar__link band-navbar__link--accent">
                            View all
                        </Link>
                    </div>

                    {bookings.length === 0 ? (
                        <div className="band-empty">
                            No bookings yet.{" "}
                            {user.role === "client" ? "Start by exploring artists and venues." : "New requests will appear here."}
                        </div>
                    ) : (
                        <div className="band-grid" style={{ gridTemplateColumns: "1fr" }}>
                            {bookings.slice(0, 6).map((b) => (
                                <div className="band-card" key={b.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", cursor: "default" }}>
                                    <div>
                                        <div className="band-card__title">{b.event_name || "Booking #" + b.id}</div>
                                        <div style={{ color: "rgba(244, 244, 245,0.5)", fontSize: 13, marginTop: 4 }}>
                                            {b.event_date ? new Date(b.event_date).toLocaleDateString() : ""} · {b.start_time}–{b.end_time}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                        <span style={{ fontWeight: 800, color: "#c6ff3d" }}>₹{b.proposed_price}</span>
                                        <span
                                            className="band-chip"
                                            style={{
                                                background: STATUS_COLORS[b.status] || "rgba(255,255,255,0.06)",
                                                textTransform: "capitalize",
                                            }}
                                        >
                                            {b.status?.replace("_", " ")}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
