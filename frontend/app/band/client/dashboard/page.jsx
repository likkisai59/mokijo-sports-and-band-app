"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import bandApi from "@/lib/bandApi";
import { getBandUser } from "@/lib/bandAuth";
import { Calendar, Heart, MessageSquare, IndianRupee } from "lucide-react";

const STATUS_COLORS = {
    pending: "rgba(245, 158, 11, 0.15)",
    accepted: "rgba(16, 185, 129, 0.15)",
    counter_offered: "rgba(217, 255, 110, 0.15)",
    completed: "rgba(198, 255, 61, 0.12)",
    rejected: "rgba(239, 68, 68, 0.15)",
    cancelled: "rgba(255, 255, 255, 0.06)",
};

export default function ClientDashboardPage() {
    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const u = getBandUser();
        setUser(u);

        async function loadData() {
            try {
                const res = await bandApi.get("/bookings/client");
                const b = Array.isArray(res.data) ? res.data : res.data.items || res.data.bookings || [];
                setBookings(b);
            } catch (err) {
                console.error("Failed to load client bookings", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const activeBookings = bookings.filter(b => b.status === "pending" || b.status === "accepted" || b.status === "counter_offered");
    const pastBookings = bookings.filter(b => b.status === "completed");

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div>
                <h1 className="cd-page-title flex items-center gap-2">
                    Welcome back, {user?.name || "Client"} 👋
                </h1>
                <p className="cd-page-sub">
                    Manage your event bookings, favorite artists, and messages from one place.
                </p>
            </div>

            <div className="cd-stats-row">
                <div className="cd-stat-card">
                    <div className="cd-stat-icon green">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <div className="cd-stat-value">{activeBookings.length}</div>
                        <div className="cd-stat-label">Active Bookings</div>
                    </div>
                </div>
                <div className="cd-stat-card">
                    <div className="cd-stat-icon cyan">
                        <Heart size={20} />
                    </div>
                    <div>
                        <div className="cd-stat-value">0</div>
                        <div className="cd-stat-label">Saved Favorites</div>
                    </div>
                </div>
                <div className="cd-stat-card">
                    <div className="cd-stat-icon blue">
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <div className="cd-stat-value">0</div>
                        <div className="cd-stat-label">Unread Messages</div>
                    </div>
                </div>
                <div className="cd-stat-card">
                    <div className="cd-stat-icon orange">
                        <IndianRupee size={20} />
                    </div>
                    <div>
                        <div className="cd-stat-value">{pastBookings.length}</div>
                        <div className="cd-stat-label">Completed Events</div>
                    </div>
                </div>
            </div>

            <div className="cd-card">
                <div className="cd-card-header">
                    <h2 className="cd-card-title">Recent Bookings</h2>
                    <Link href="/band/client/bookings" className="cd-card-action">
                        View All
                    </Link>
                </div>
                
                {loading ? (
                    <div className="text-center py-8 text-xs text-text-muted">Loading bookings...</div>
                ) : bookings.length === 0 ? (
                    <div className="cd-empty">
                        <div className="cd-empty-text">No Bookings Yet</div>
                        <div className="cd-empty-sub">Explore the marketplace to find and book your favorite artists and venues.</div>
                        <Link href="/band/artists" className="cd-btn-primary" style={{ display: 'inline-block', marginTop: '16px', textDecoration: 'none' }}>
                            Browse Artists
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {bookings.slice(0, 5).map(b => (
                            <div key={b.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-bg-card/30 hover:bg-bg-card/50 transition-colors">
                                <div>
                                    <h4 className="text-sm font-bold text-text-primary">{b.event_name || `Booking #${b.id}`}</h4>
                                    <p className="text-xs text-text-muted mt-1">
                                        {b.event_date ? new Date(b.event_date).toLocaleDateString() : "TBD"} &bull; {b.start_time}-{b.end_time}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-black text-primary">₹{b.proposed_price}</span>
                                    <span 
                                        className="cd-badge" 
                                        style={{ 
                                            background: STATUS_COLORS[b.status] || "rgba(255,255,255,0.06)",
                                            textTransform: "capitalize",
                                            border: "1px solid rgba(255,255,255,0.1)"
                                        }}
                                    >
                                        {b.status?.replace("_", " ")}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
