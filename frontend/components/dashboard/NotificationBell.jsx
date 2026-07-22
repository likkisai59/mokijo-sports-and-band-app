"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

const READ_KEY = "mukijo_notification_read_ids";
const TRAINER_READ_KEY = "mukijo_trainer_notification_read_ids";
const VENUE_READ_KEY = "mukijo_venue_notification_read_ids";

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

function loadReadIds(storageKey = READ_KEY) {
    if (typeof window === "undefined") return new Set();
    try {
        const raw = localStorage.getItem(storageKey);
        const arr = raw ? JSON.parse(raw) : [];
        return new Set(Array.isArray(arr) ? arr : []);
    } catch {
        return new Set();
    }
}

function saveReadIds(set, storageKey = READ_KEY) {
    try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(set)));
    } catch {
        /* ignore */
    }
}

function appId(sub) {
    return `app:${sub.id}`;
}

function activityId(activity, index) {
    return `act:${activity.match_id || "x"}:${activity.member_name || ""}:${index}`;
}

function candidateId(c) {
    return `cand:${c.id}`;
}

function bookingNotifId(b) {
    return `book:${b.booking_id}`;
}

function storageKeyForMode(mode) {
    if (mode === "trainer") return TRAINER_READ_KEY;
    if (mode === "venue") return VENUE_READ_KEY;
    return READ_KEY;
}

/**
 * Gold notification bell for dashboard headers.
 * - admin: signup applications + live activity
 * - trainer: training registration candidates
 * - venue: pending booking approvals
 * - empty: bell UI with empty state
 */
export default function NotificationBell({
    mode = "auto", // "admin" | "empty" | "auto" | "trainer" | "venue"
    applicationsHref = "/dashboard/signup-forms",
    candidatesHref = "/trainer-dashboard/candidates",
    bookingsHref = "/venue-dashboard/bookings",
}) {
    const isTrainerMode = mode === "trainer";
    const isVenueMode = mode === "venue";
    const [open, setOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(mode === "admin");
    const [applications, setApplications] = useState([]);
    const [liveActivities, setLiveActivities] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [pendingBookings, setPendingBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [readIds, setReadIds] = useState(() => loadReadIds(storageKeyForMode(mode)));

    useEffect(() => {
        if (mode === "admin") {
            setIsAdmin(true);
            return;
        }
        if (mode === "empty" || mode === "trainer" || mode === "venue") {
            setIsAdmin(false);
            return;
        }
        const role = (localStorage.getItem("userRole") || "").toLowerCase();
        const isMember = localStorage.getItem("isMember") === "true" || role === "team_member";
        const admin =
            !isMember &&
            (role === "club_admin" ||
                role === "admin" ||
                role === "owner" ||
                role === "" ||
                !!localStorage.getItem("userId"));
        if (role === "venue_owner" || role === "user" || role === "player" || role === "trainer" || isMember) {
            setIsAdmin(false);
        } else {
            setIsAdmin(admin && !isMember);
        }
    }, [mode]);

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
                const [appRes, overviewRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/signup-submissions?owner_id=${userId}`).catch(() => null),
                    fetch(`${API_BASE_URL}/dashboard/overview?owner_id=${userId}`).catch(() => null),
                ]);

                if (appRes?.ok) {
                    const data = await appRes.json();
                    if (!cancelled) setApplications(Array.isArray(data) ? data : []);
                }

                if (overviewRes?.ok) {
                    const overview = await overviewRes.json();
                    const activityItems = Array.isArray(overview?.active_team_activity)
                        ? overview.active_team_activity
                        : [];
                    if (!cancelled) setLiveActivities(activityItems.slice(0, 6));
                }
            } catch (err) {
                console.error("Error loading notifications:", err);
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
    }, [isAdmin]);

    useEffect(() => {
        if (!isTrainerMode) return;
        const trainerId = localStorage.getItem("trainerId");
        const token = localStorage.getItem("accessToken");
        if (!trainerId || !token) return;

        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/trainer/${trainerId}/candidates`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (!cancelled) setCandidates(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Error loading trainer notifications:", err);
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
    }, [isTrainerMode]);

    useEffect(() => {
        if (!isVenueMode) return;
        const ownerId = localStorage.getItem("venueOwnerId");
        if (!ownerId) return;

        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/bookings/venue-owner/${ownerId}`);
                if (res.ok) {
                    const data = await res.json();
                    const pending = (Array.isArray(data) ? data : []).filter(
                        (b) => b.booking_status === "pending_approval"
                    );
                    if (!cancelled) setPendingBookings(pending);
                }
            } catch (err) {
                console.error("Error loading venue notifications:", err);
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
    }, [isVenueMode]);

    const unreadCount = useMemo(() => {
        if (isTrainerMode) {
            return candidates.filter((c) => !readIds.has(candidateId(c))).length;
        }
        if (isVenueMode) {
            return pendingBookings.filter((b) => !readIds.has(bookingNotifId(b))).length;
        }
        if (!isAdmin) return 0;
        let count = 0;
        applications.forEach((sub) => {
            if (!readIds.has(appId(sub))) count += 1;
        });
        liveActivities.forEach((activity, index) => {
            if (!readIds.has(activityId(activity, index))) count += 1;
        });
        return count;
    }, [isAdmin, isTrainerMode, isVenueMode, applications, liveActivities, candidates, pendingBookings, readIds]);

    function markRead(id) {
        const key = storageKeyForMode(mode);
        setReadIds((prev) => {
            const next = new Set(prev);
            next.add(id);
            saveReadIds(next, key);
            return next;
        });
    }

    function markAllVisibleRead() {
        const key = storageKeyForMode(mode);
        setReadIds((prev) => {
            const next = new Set(prev);
            if (isTrainerMode) {
                candidates.forEach((c) => next.add(candidateId(c)));
            } else if (isVenueMode) {
                pendingBookings.forEach((b) => next.add(bookingNotifId(b)));
            } else {
                applications.forEach((sub) => next.add(appId(sub)));
                liveActivities.forEach((activity, index) => next.add(activityId(activity, index)));
            }
            saveReadIds(next, key);
            return next;
        });
    }

    function handleToggleOpen() {
        setOpen((prev) => {
            const next = !prev;
            if (next) {
                setTimeout(() => markAllVisibleRead(), 0);
            }
            return next;
        });
    }

    const showActivePanel = isAdmin || isTrainerMode || isVenueMode;
    const viewAllHref = isTrainerMode ? candidatesHref : isVenueMode ? bookingsHref : applicationsHref;

    return (
        <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                aria-label="Notifications"
                onClick={handleToggleOpen}
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
                {unreadCount > 0 && (
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
                        {unreadCount > 9 ? "9+" : unreadCount}
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
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Notifications</span>
                        {showActivePanel && (
                            <Link
                                href={viewAllHref}
                                onClick={() => setOpen(false)}
                                style={{ fontSize: 12, color: "#facc15", textDecoration: "none" }}
                            >
                                View all
                            </Link>
                        )}
                    </div>

                    {!showActivePanel && (
                        <p style={{ margin: 0, padding: "16px 10px", fontSize: 13, color: "rgba(148,163,184,0.7)" }}>
                            No notifications
                        </p>
                    )}

                    {showActivePanel && loading && (
                        <p style={{ margin: 0, padding: "16px 10px", fontSize: 13, color: "rgba(148,163,184,0.7)" }}>
                            Loading...
                        </p>
                    )}

                    {isAdmin && !loading && applications.length === 0 && liveActivities.length === 0 && (
                        <p style={{ margin: 0, padding: "16px 10px", fontSize: 13, color: "rgba(148,163,184,0.7)" }}>
                            No notifications
                        </p>
                    )}

                    {isTrainerMode && !loading && candidates.length === 0 && (
                        <p style={{ margin: 0, padding: "16px 10px", fontSize: 13, color: "rgba(148,163,184,0.7)" }}>
                            No candidate registrations yet
                        </p>
                    )}

                    {isVenueMode && !loading && pendingBookings.length === 0 && (
                        <p style={{ margin: 0, padding: "16px 10px", fontSize: 13, color: "rgba(148,163,184,0.7)" }}>
                            No pending booking requests
                        </p>
                    )}

                    {isAdmin && liveActivities.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#facc15",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.04em",
                                    padding: "6px 10px",
                                }}
                            >
                                Live team activity
                            </div>
                            {liveActivities.map((activity, index) => {
                                const id = activityId(activity, index);
                                const unread = !readIds.has(id);
                                return (
                                    <div
                                        key={id}
                                        onClick={() => markRead(id)}
                                        style={{
                                            padding: "10px",
                                            borderRadius: 8,
                                            background: unread
                                                ? "rgba(250, 204, 21, 0.12)"
                                                : "rgba(250, 204, 21, 0.05)",
                                            color: "#e2e8f0",
                                            marginBottom: 4,
                                            cursor: "pointer",
                                            opacity: unread ? 1 : 0.7,
                                        }}
                                    >
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{activity.member_name}</div>
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
                            const id = appId(sub);
                            const unread = !readIds.has(id);
                            return (
                                <Link
                                    key={sub.id}
                                    href={applicationsHref}
                                    onClick={() => {
                                        markRead(id);
                                        setOpen(false);
                                    }}
                                    style={{
                                        display: "block",
                                        padding: "10px",
                                        borderRadius: 8,
                                        textDecoration: "none",
                                        color: "#e2e8f0",
                                        marginBottom: 4,
                                        background: unread
                                            ? "rgba(255,255,255,0.06)"
                                            : "rgba(255,255,255,0.02)",
                                        opacity: unread ? 1 : 0.65,
                                    }}
                                >
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{parseApplicantName(sub)}</div>
                                    <div style={{ fontSize: 11, color: "rgba(148,163,184,0.75)", marginTop: 2 }}>
                                        {sub.role || "Applicant"} · Waiting approval
                                    </div>
                                </Link>
                            );
                        })}

                    {isTrainerMode &&
                        !loading &&
                        candidates.slice(0, 8).map((c) => {
                            const id = candidateId(c);
                            const unread = !readIds.has(id);
                            return (
                                <Link
                                    key={c.id}
                                    href={candidatesHref}
                                    onClick={() => {
                                        markRead(id);
                                        setOpen(false);
                                    }}
                                    style={{
                                        display: "block",
                                        padding: "10px",
                                        borderRadius: 8,
                                        textDecoration: "none",
                                        color: "#e2e8f0",
                                        marginBottom: 4,
                                        background: unread
                                            ? "rgba(255,255,255,0.06)"
                                            : "rgba(255,255,255,0.02)",
                                        opacity: unread ? 1 : 0.65,
                                    }}
                                >
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                                        {c.participant_name || "Candidate"}
                                    </div>
                                    <div style={{ fontSize: 11, color: "rgba(148,163,184,0.75)", marginTop: 2 }}>
                                        {(c.course_title || "Training") +
                                            " · " +
                                            (c.payment_status || c.status || "registered")}
                                    </div>
                                </Link>
                            );
                        })}

                    {isVenueMode &&
                        !loading &&
                        pendingBookings.slice(0, 8).map((b) => {
                            const id = bookingNotifId(b);
                            const unread = !readIds.has(id);
                            return (
                                <Link
                                    key={b.booking_id}
                                    href={bookingsHref}
                                    onClick={() => {
                                        markRead(id);
                                        setOpen(false);
                                    }}
                                    style={{
                                        display: "block",
                                        padding: "10px",
                                        borderRadius: 8,
                                        textDecoration: "none",
                                        color: "#e2e8f0",
                                        marginBottom: 4,
                                        background: unread
                                            ? "rgba(255,255,255,0.06)"
                                            : "rgba(255,255,255,0.02)",
                                        opacity: unread ? 1 : 0.65,
                                    }}
                                >
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                                        {b.customer_name || "Customer"}
                                    </div>
                                    <div style={{ fontSize: 11, color: "rgba(148,163,184,0.75)", marginTop: 2 }}>
                                        {(b.venue_name || "Venue") +
                                            " · " +
                                            (b.sport || "booking") +
                                            " · ₹" +
                                            (b.amount_paid ?? 0)}
                                    </div>
                                </Link>
                            );
                        })}
                </div>
            )}
        </div>
    );
}
