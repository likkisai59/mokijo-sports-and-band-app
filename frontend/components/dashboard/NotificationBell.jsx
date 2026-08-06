"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

function parseApplicantName(sub) {
    let parsedData = {};
    try {
        parsedData =
            typeof sub.submitted_data === "string" ? JSON.parse(sub.submitted_data) : sub.submitted_data || {};
    } catch {
        parsedData = {};
    }
    const firstName = parsedData.first_name || parsedData.firstName || "Applicant";
    const lastName = parsedData.last_name || parsedData.lastName || "";
    return `${firstName} ${lastName}`.trim();
}

function applicationNotifId(sub) {
    return `app-${sub.id}`;
}

function activityNotifId(activity, index) {
    return `activity-${activity.match_id ?? "x"}-${activity.member_name ?? index}`;
}

function bookingNotifId(booking) {
    return `booking-${booking.booking_id}`;
}

/**
 * Gold notification bell for dashboard headers.
 * Club admins see signup applications; club members (players/parents/coaches)
 * see their own pending event invitations; venue partners see bookings awaiting
 * their approval — each with per-user read-state tracking.
 */
export default function NotificationBell({
    mode = "auto", // "admin" | "member" | "venue_owner" | "empty" | "auto"
    applicationsHref = "/dashboard/signup-forms",
}) {
    const [open, setOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(mode === "admin");
    const [isMemberMode, setIsMemberMode] = useState(mode === "member");
    const [isVenueOwnerMode, setIsVenueOwnerMode] = useState(mode === "venue_owner");
    const [applications, setApplications] = useState([]);
    const [liveActivities, setLiveActivities] = useState([]);
    const [pendingInvites, setPendingInvites] = useState([]);
    const [pendingBookings, setPendingBookings] = useState([]);
    const [readIds, setReadIds] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (mode === "admin") {
            setIsAdmin(true);
            setIsMemberMode(false);
            setIsVenueOwnerMode(false);
            return;
        }
        if (mode === "member") {
            setIsAdmin(false);
            setIsMemberMode(true);
            setIsVenueOwnerMode(false);
            return;
        }
        if (mode === "venue_owner") {
            setIsAdmin(false);
            setIsMemberMode(false);
            setIsVenueOwnerMode(true);
            return;
        }
        if (mode === "empty") {
            setIsAdmin(false);
            setIsMemberMode(false);
            setIsVenueOwnerMode(false);
            return;
        }
        const role = (localStorage.getItem("userRole") || "").toLowerCase();
        const isMember = localStorage.getItem("isMember") === "true" || role === "team_member";
        const admin =
            !isMember &&
            (role === "club_admin" || role === "admin" || role === "owner" || role === "" || !!localStorage.getItem("userId"));
        if (isMember) {
            setIsAdmin(false);
            setIsMemberMode(true);
            setIsVenueOwnerMode(false);
        } else if (role === "venue_owner") {
            setIsAdmin(false);
            setIsMemberMode(false);
            setIsVenueOwnerMode(true);
        } else if (role === "user" || role === "player") {
            setIsAdmin(false);
            setIsMemberMode(false);
            setIsVenueOwnerMode(false);
        } else {
            setIsAdmin(admin);
            setIsMemberMode(false);
            setIsVenueOwnerMode(false);
        }
    }, [mode]);

    const readStateKey = () => {
        if (typeof window === "undefined") return "notifications_read_guest";
        const identity =
            localStorage.getItem("venueOwnerId") || localStorage.getItem("userEmail") || localStorage.getItem("userId") || "guest";
        return `notifications_read_${identity}`;
    };

    useEffect(() => {
        if (!isMemberMode && !isAdmin && !isVenueOwnerMode) return;
        try {
            const stored = JSON.parse(localStorage.getItem(readStateKey()) || "[]");
            setReadIds(Array.isArray(stored) ? stored : []);
        } catch {
            setReadIds([]);
        }
    }, [isMemberMode, isAdmin, isVenueOwnerMode]);

    useEffect(() => {
        if (!isVenueOwnerMode) return;
        const ownerId = localStorage.getItem("venueOwnerId");
        if (!ownerId) return;

        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/bookings/venue-owner/${ownerId}`).catch(() => null);
                if (res?.ok) {
                    const data = await res.json();
                    const pending = Array.isArray(data)
                        ? data.filter((b) => b.booking_status === "pending_approval")
                        : [];
                    if (!cancelled) setPendingBookings(pending);
                }
            } catch (err) {
                console.error("Error loading venue owner notifications:", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        const intervalId = window.setInterval(load, 15000);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [isVenueOwnerMode]);

    useEffect(() => {
        if (!isMemberMode) return;
        const email = localStorage.getItem("userEmail");
        if (!email) return;

        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("accessToken");
                const res = await fetch(
                    `${API_BASE_URL}/members/registrations?member_email=${encodeURIComponent(email)}`,
                    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                ).catch(() => null);

                if (res?.ok) {
                    const data = await res.json();
                    const pending = Array.isArray(data) ? data.filter((r) => r.status === "pending") : [];
                    if (!cancelled) setPendingInvites(pending);
                }
            } catch (err) {
                console.error("Error loading member notifications:", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        const intervalId = window.setInterval(load, 15000);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [isMemberMode]);

    const unreadInvites = pendingInvites.filter((r) => !readIds.includes(r.event_id));
    const unreadBookings = pendingBookings.filter((b) => !readIds.includes(bookingNotifId(b)));

    const adminNotifIds = isAdmin
        ? [
              ...applications.map(applicationNotifId),
              ...liveActivities.map((activity, index) => activityNotifId(activity, index)),
          ]
        : [];
    const unreadAdminCount = adminNotifIds.filter((id) => !readIds.includes(id)).length;

    const markAllRead = () => {
        const idsToMark = isAdmin
            ? adminNotifIds
            : isVenueOwnerMode
              ? pendingBookings.map(bookingNotifId)
              : pendingInvites.map((r) => r.event_id);
        if (idsToMark.length === 0) return;
        const merged = Array.from(new Set([...readIds, ...idsToMark]));
        setReadIds(merged);
        try {
            localStorage.setItem(readStateKey(), JSON.stringify(merged));
        } catch {
            // ignore storage errors (e.g. private browsing quota)
        }
    };

    useEffect(() => {
        if (!open) return;
        const close = () => setOpen(false);
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, [open]);

    useEffect(() => {
        if (!isAdmin) return;
        const userId = localStorage.getItem("userId");
        if (!userId) return;

        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("accessToken");
                const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

                const [appRes, overviewRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/signup-submissions?owner_id=${userId}`).catch(() => null),
                    fetch(`${API_BASE_URL}/dashboard/overview?owner_id=${userId}`, { headers: authHeaders }).catch(() => null),
                ]);

                if (appRes?.ok) {
                    const data = await appRes.json();
                    if (!cancelled) setApplications(Array.isArray(data) ? data : []);
                }

                if (overviewRes?.ok) {
                    const overview = await overviewRes.json();
                    const activityItems = Array.isArray(overview?.active_team_activity) ? overview.active_team_activity : [];
                    if (!cancelled) setLiveActivities(activityItems.slice(0, 6));
                }
            } catch (err) {
                console.error("Error loading notifications:", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        const intervalId = window.setInterval(() => {
            load();
        }, 15000);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [isAdmin]);

    const pendingCount = isAdmin
        ? unreadAdminCount
        : isMemberMode
          ? unreadInvites.length
          : isVenueOwnerMode
            ? unreadBookings.length
            : 0;

    return (
        <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                aria-label="Notifications"
                onClick={() => {
                    setOpen((prev) => {
                        const next = !prev;
                        if (next && (isMemberMode || isAdmin || isVenueOwnerMode)) markAllRead();
                        return next;
                    });
                }}
                style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    border: "1px solid rgba(234, 179, 8, 0.35)",
                    background: "rgba(234, 179, 8, 0.12)",
                    color: "#facc15",
                    cursor: "pointer",
                    padding: 0,
                }}
            >
                <Bell size={18} fill="currentColor" strokeWidth={1.5} />
                {pendingCount > 0 && (
                    <span
                        style={{
                            position: "absolute",
                            top: -2,
                            right: -2,
                            minWidth: 16,
                            height: 16,
                            borderRadius: 8,
                            background: "#ef4444",
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 4px",
                            lineHeight: 1,
                        }}
                    >
                        {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                )}
            </button>

            {open && (
                <div
                    style={{
                        position: "absolute",
                        top: "120%",
                        right: 0,
                        width: 320,
                        maxHeight: 360,
                        overflowY: "auto",
                        backgroundColor: "#0f0f1a",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: 10,
                        padding: 8,
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
                        zIndex: 1100,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 10px",
                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                            marginBottom: 6,
                        }}
                    >
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#f4f4f5" }}>Notifications</span>
                        {isAdmin && (
                            <Link
                                href={applicationsHref}
                                onClick={() => setOpen(false)}
                                style={{ fontSize: 12, color: "#facc15", textDecoration: "none" }}
                            >
                                View all
                            </Link>
                        )}
                        {isMemberMode && (
                            <Link
                                href="/dashboard/events"
                                onClick={() => setOpen(false)}
                                style={{ fontSize: 12, color: "#facc15", textDecoration: "none" }}
                            >
                                View all
                            </Link>
                        )}
                        {isVenueOwnerMode && (
                            <Link
                                href="/venue-dashboard/bookings"
                                onClick={() => setOpen(false)}
                                style={{ fontSize: 12, color: "#facc15", textDecoration: "none" }}
                            >
                                View all
                            </Link>
                        )}
                    </div>

                    {!isAdmin && !isMemberMode && !isVenueOwnerMode && (
                        <p style={{ margin: 0, padding: "16px 10px", fontSize: 13, color: "rgba(148,163,184,0.7)" }}>
                            No notifications
                        </p>
                    )}

                    {isVenueOwnerMode && loading && (
                        <p style={{ margin: 0, padding: "16px 10px", fontSize: 13, color: "rgba(148,163,184,0.7)" }}>
                            Loading...
                        </p>
                    )}

                    {isVenueOwnerMode && !loading && pendingBookings.length === 0 && (
                        <p style={{ margin: 0, padding: "16px 10px", fontSize: 13, color: "rgba(148,163,184,0.7)" }}>
                            No notifications
                        </p>
                    )}

                    {isVenueOwnerMode &&
                        !loading &&
                        pendingBookings.slice(0, 8).map((booking) => {
                            const isRead = readIds.includes(bookingNotifId(booking));
                            return (
                                <Link
                                    key={bookingNotifId(booking)}
                                    href="/venue-dashboard/bookings"
                                    onClick={() => setOpen(false)}
                                    style={{
                                        display: "block",
                                        padding: "10px",
                                        borderRadius: 8,
                                        textDecoration: "none",
                                        color: "#e2e8f0",
                                        marginBottom: 4,
                                        background: isRead ? "rgba(255,255,255,0.02)" : "rgba(250, 204, 21, 0.08)",
                                    }}
                                >
                                    <div style={{ fontSize: 13, fontWeight: isRead ? 500 : 700 }}>
                                        Booking request — {booking.customer_name || "Guest"}
                                    </div>
                                    <div style={{ fontSize: 11, color: "rgba(148,163,184,0.75)", marginTop: 2 }}>
                                        {booking.venue_name || "Venue"} · {booking.sport || "Sport"} · Awaiting approval
                                    </div>
                                </Link>
                            );
                        })}

                    {isAdmin && loading && (
                        <p style={{ margin: 0, padding: "16px 10px", fontSize: 13, color: "rgba(148,163,184,0.7)" }}>
                            Loading...
                        </p>
                    )}

                    {isAdmin && !loading && applications.length === 0 && liveActivities.length === 0 && (
                        <p style={{ margin: 0, padding: "16px 10px", fontSize: 13, color: "rgba(148,163,184,0.7)" }}>
                            No notifications
                        </p>
                    )}

                    {isMemberMode && loading && (
                        <p style={{ margin: 0, padding: "16px 10px", fontSize: 13, color: "rgba(148,163,184,0.7)" }}>
                            Loading...
                        </p>
                    )}

                    {isMemberMode && !loading && pendingInvites.length === 0 && (
                        <p style={{ margin: 0, padding: "16px 10px", fontSize: 13, color: "rgba(148,163,184,0.7)" }}>
                            No notifications
                        </p>
                    )}

                    {isMemberMode &&
                        !loading &&
                        pendingInvites.slice(0, 8).map((invite) => {
                            const isRead = readIds.includes(invite.event_id);
                            return (
                                <Link
                                    key={invite.id}
                                    href={`/dashboard/events/${invite.event_id}`}
                                    onClick={() => setOpen(false)}
                                    style={{
                                        display: "block",
                                        padding: "10px",
                                        borderRadius: 8,
                                        textDecoration: "none",
                                        color: "#e2e8f0",
                                        marginBottom: 4,
                                        background: isRead ? "rgba(255,255,255,0.02)" : "rgba(250, 204, 21, 0.08)",
                                    }}
                                >
                                    <div style={{ fontSize: 13, fontWeight: isRead ? 500 : 700 }}>
                                        New event invite
                                    </div>
                                    <div style={{ fontSize: 11, color: "rgba(148,163,184,0.75)", marginTop: 2 }}>
                                        Awaiting your RSVP · Tap to respond
                                    </div>
                                </Link>
                            );
                        })}

                    {isAdmin && liveActivities.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#facc15", textTransform: "uppercase", letterSpacing: "0.04em", padding: "6px 10px" }}>
                                Live team activity
                            </div>
                            {liveActivities.map((activity, index) => {
                                const isRead = readIds.includes(activityNotifId(activity, index));
                                return (
                                    <div
                                        key={activityNotifId(activity, index)}
                                        style={{
                                            padding: "10px",
                                            borderRadius: 8,
                                            background: isRead ? "rgba(255,255,255,0.02)" : "rgba(250, 204, 21, 0.08)",
                                            color: "#e2e8f0",
                                            marginBottom: 4,
                                        }}
                                    >
                                        <div style={{ fontSize: 13, fontWeight: isRead ? 500 : 700 }}>{activity.member_name}</div>
                                        <div style={{ fontSize: 11, color: "rgba(148,163,184,0.75)", marginTop: 2 }}>
                                            {activity.match_title} · {activity.venue}
                                        </div>
                                        <div style={{ fontSize: 11, color: "#facc15", marginTop: 2 }}>
                                            {activity.timing || "Live now"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {isAdmin &&
                        !loading &&
                        applications.slice(0, 8).map((sub) => {
                            const isRead = readIds.includes(applicationNotifId(sub));
                            return (
                                <Link
                                    key={applicationNotifId(sub)}
                                    href={applicationsHref}
                                    onClick={() => setOpen(false)}
                                    style={{
                                        display: "block",
                                        padding: "10px",
                                        borderRadius: 8,
                                        textDecoration: "none",
                                        color: "#e2e8f0",
                                        marginBottom: 4,
                                        background: isRead ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.03)",
                                    }}
                                >
                                    <div style={{ fontSize: 13, fontWeight: isRead ? 500 : 700 }}>{parseApplicantName(sub)}</div>
                                    <div style={{ fontSize: 11, color: "rgba(148,163,184,0.75)", marginTop: 2 }}>
                                        {sub.role || "Applicant"} · Waiting approval
                                    </div>
                                </Link>
                            );
                        })}
                </div>
            )}
        </div>
    );
}
