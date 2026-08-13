"use client";
import { API_BASE_URL } from "@/lib/api";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Plus,
    Calendar,
    Clock,
    MapPin,
    Users,
    Trash2,
    ArrowRight,
    Sparkles,
    Globe,
    Lock,
    Bell,
    UserCheck,
    UserPlus,
    Hourglass,
    Loader2,
    CalendarCheck,
    Activity,
} from "lucide-react";
import "@/app/styles/events.css";

export default function EventsPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("upcoming"); // upcoming, ongoing, past
    const router = useRouter();

    const todayStr = new Date().toISOString().split("T")[0];
    const isMember = typeof window !== "undefined" ? localStorage.getItem("isMember") === "true" : false;

    useEffect(() => {
        const fetchEvents = async () => {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                router.push("/login");
                return;
            }

            try {
                const token = localStorage.getItem("accessToken");
                const response = await fetch(`${API_BASE_URL}/events?owner_id=${userId}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (response.ok) {
                    const data = await response.json();
                    const visibleEvents = Array.isArray(data)
                        ? data.filter((event) => event.visible_to_member !== false)
                        : [];
                    setEvents(visibleEvents);
                }
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [router]);

    const handleDelete = async (eventId) => {
        if (!confirm("Are you sure you want to delete this event?")) return;

        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("accessToken");
        try {
            const response = await fetch(`${API_BASE_URL}/events/${eventId}?owner_id=${userId}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            if (response.ok) {
                setEvents(events.filter((e) => e.id !== eventId));
            } else {
                alert("Failed to delete event");
            }
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    };

    // Resolve an event's effective date
    const getEventDateStr = (event) => {
        if (event.date) return String(event.date).slice(0, 10);
        if (event.start_time) return String(event.start_time).slice(0, 10);
        return null;
    };

    // Filter events by status based on date
    const getFilteredEvents = () => {
        return events.filter((event) => {
            const eventDate = getEventDateStr(event);
            if (!eventDate) return activeTab === "upcoming";

            if (activeTab === "upcoming") {
                return eventDate > todayStr;
            } else if (activeTab === "ongoing") {
                return eventDate === todayStr;
            } else if (activeTab === "past") {
                return eventDate < todayStr;
            }
            return true;
        });
    };

    const upcomingCount = events.filter((e) => {
        const d = getEventDateStr(e);
        return !d || d > todayStr;
    }).length;
    const ongoingCount = events.filter((e) => getEventDateStr(e) === todayStr).length;
    const pastCount = events.filter((e) => {
        const d = getEventDateStr(e);
        return d && d < todayStr;
    }).length;

    const filtered = getFilteredEvents();

    // Default gradient presets for events
    const coverPresets = {
        Match: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
        Training: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
        Meeting: "linear-gradient(135deg, #475569 0%, #1e293b 100%)",
        Social: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
        Tournament: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
        Ceremony: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
    };

    const getCoverBackground = (event) => {
        if (event.cover_image) {
            if (event.cover_image.startsWith("linear-gradient")) {
                return event.cover_image;
            }
            return `url(${event.cover_image}) center/cover no-repeat`;
        }
        return coverPresets[event.type] || "linear-gradient(135deg, #059669 0%, #10b981 100%)";
    };

    return (
        <div style={styles.pageContainer}>
            {/* Header Section */}
            <div style={styles.headerContainerLight}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "28px" }}>🏆</span>
                        <h1 style={styles.headerTitleLight}>Club Events &amp; Fixtures</h1>
                    </div>
                    <p style={styles.headerSubtitleLight}>
                        {isMember
                            ? "View upcoming match fixtures, squad training sessions, and RSVP status."
                            : "Schedule matches, training sessions, and track member attendance."}
                    </p>
                </div>
                {!isMember && (
                    <Link href="/dashboard/events/new" style={styles.createBtnLight}>
                        <Plus size={18} />
                        <span>Schedule New Event</span>
                    </Link>
                )}
            </div>

            {/* Filter Pill Tab Cards */}
            <div style={styles.filterGridLight}>
                <div
                    onClick={() => setActiveTab("upcoming")}
                    style={{
                        ...styles.filterCardLight,
                        ...(activeTab === "upcoming" ? styles.filterCardActiveLight : {}),
                    }}
                    role="button"
                    tabIndex={0}
                >
                    <div style={{ ...styles.filterIconBoxLight, backgroundColor: "#ecfdf5", color: "#059669" }}>
                        <Calendar size={18} />
                    </div>
                    <div>
                        <div style={styles.filterTitleLight}>Upcoming Events</div>
                        <div style={styles.filterCountLight}>{upcomingCount}</div>
                    </div>
                </div>

                <div
                    onClick={() => setActiveTab("ongoing")}
                    style={{
                        ...styles.filterCardLight,
                        ...(activeTab === "ongoing" ? styles.filterCardActiveLight : {}),
                    }}
                    role="button"
                    tabIndex={0}
                >
                    <div style={{ ...styles.filterIconBoxLight, backgroundColor: "#fef3c7", color: "#d97706" }}>
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <div style={styles.filterTitleLight}>Ongoing Today</div>
                        <div style={styles.filterCountLight}>{ongoingCount}</div>
                    </div>
                </div>

                <div
                    onClick={() => setActiveTab("past")}
                    style={{
                        ...styles.filterCardLight,
                        ...(activeTab === "past" ? styles.filterCardActiveLight : {}),
                    }}
                    role="button"
                    tabIndex={0}
                >
                    <div style={{ ...styles.filterIconBoxLight, backgroundColor: "#f1f5f9", color: "#64748b" }}>
                        <CalendarCheck size={18} />
                    </div>
                    <div>
                        <div style={styles.filterTitleLight}>Past &amp; Archived</div>
                        <div style={styles.filterCountLight}>{pastCount}</div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div style={styles.loadingBoxLight}>
                    <Loader2 className="animate-spin" size={32} style={{ color: "#059669" }} />
                    <p style={{ margin: "10px 0 0 0", fontSize: "14px", color: "#64748b" }}>Loading club events...</p>
                </div>
            ) : filtered.length > 0 ? (
                <div style={styles.rectangularGridLight}>
                    {filtered.map((event) => (
                        <div key={event.id} style={styles.rectangularEventCardLight}>
                            {/* Rectangular Image/Gradient Banner */}
                            <div
                                style={{
                                    ...styles.rectangularCoverWrapperLight,
                                    background: getCoverBackground(event),
                                }}
                            >
                                <span style={styles.rectangularCategoryBadgeLight}>
                                    {(event.type || "EVENT").toUpperCase()}
                                </span>
                                {event.registration_deadline && (
                                    <span style={styles.rectangularDeadlineBadgeLight}>
                                        Deadline:{" "}
                                        {new Date(event.registration_deadline).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </span>
                                )}
                            </div>

                            {/* Rectangular Card Body */}
                            <div style={styles.rectangularCardBodyLight}>
                                <h3 style={styles.rectangularTitleLight}>{event.name}</h3>

                                <div style={styles.rectangularMetaGridLight}>
                                    <div style={styles.rectangularMetaItemLight}>
                                        <Calendar size={14} style={{ color: "#059669" }} />
                                        <span>
                                            {new Date(event.date).toLocaleDateString("en-US", {
                                                weekday: "short",
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </span>
                                    </div>

                                    <div style={styles.rectangularMetaItemLight}>
                                        <Clock size={14} style={{ color: "#059669" }} />
                                        <span>
                                            {event.start_time && event.end_time
                                                ? `${event.start_time} - ${event.end_time}`
                                                : event.time || "No specific time"}
                                        </span>
                                    </div>

                                    <div style={styles.rectangularMetaItemLight}>
                                        <MapPin size={14} style={{ color: "#059669" }} />
                                        <span>{event.location || "Online / TBD"}</span>
                                    </div>

                                    {event.group_name && (
                                        <div style={styles.rectangularMetaItemLight}>
                                            <Users size={14} style={{ color: "#059669" }} />
                                            <span>
                                                Target Group: <strong>{event.group_name}</strong>
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Setting Badges */}
                                <div style={styles.settingBadgeGroupLight}>
                                    {event.is_public ? (
                                        <span style={styles.settingBadgeLight}>🌐 Public</span>
                                    ) : (
                                        <span style={styles.settingBadgeLight}>🔒 Private</span>
                                    )}
                                    {event.attendance_tracking && (
                                        <span style={styles.settingBadgeLight}>📝 Attendance Active</span>
                                    )}
                                    {event.auto_reminder && <span style={styles.settingBadgeLight}>🔔 Auto Reminder</span>}
                                    {event.allow_guest && <span style={styles.settingBadgeLight}>👤 Guest Entry</span>}
                                    {event.allow_waiting_list && <span style={styles.settingBadgeLight}>⏳ Waitlist</span>}
                                </div>

                                {/* Card Footer Actions */}
                                <div style={styles.rectangularCardFooterLight}>
                                    <Link href={`/dashboard/events/${event.id}`} style={styles.manageBtnLight}>
                                        <span>{isMember ? "View Details & RSVP" : "Manage Event"}</span>
                                        <ArrowRight size={14} />
                                    </Link>
                                    {!isMember && (
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            style={styles.deleteBtnLight}
                                            title="Delete Event"
                                        >
                                            <Trash2 size={15} />
                                            <span>Delete</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={styles.emptyBoxLight}>
                    <Calendar size={48} style={{ color: "#cbd5e1", marginBottom: "12px" }} />
                    <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                        No {activeTab} events found
                    </h3>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "6px 0 16px 0" }}>
                        {isMember
                            ? "There are currently no events scheduled for your roster in this category."
                            : "There are no events in this category yet. You can schedule a new match or training session immediately."}
                    </p>
                    {!isMember && (
                        <Link href="/dashboard/events/new" style={styles.createBtnLight}>
                            <Plus size={16} />
                            <span>Schedule New Event</span>
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}

// Inline Style Definitions (Senior UI/UX Designer Skill)
const styles = {
    pageContainer: {
        maxWidth: "1160px",
        margin: "0 auto",
        padding: "32px 20px 60px 20px",
        fontFamily: "'Outfit', sans-serif",
        color: "#0f172a",
    },
    headerContainerLight: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        marginBottom: "28px",
    },
    headerTitleLight: {
        fontSize: "28px",
        fontWeight: "800",
        color: "#0f172a",
        margin: 0,
        letterSpacing: "-0.01em",
    },
    headerSubtitleLight: {
        fontSize: "14px",
        color: "#64748b",
        margin: "4px 0 0 0",
    },
    createBtnLight: {
        background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
        color: "#ffffff",
        border: "none",
        borderRadius: "12px",
        padding: "12px 24px",
        fontSize: "13px",
        fontWeight: "800",
        cursor: "pointer",
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 4px 16px rgba(16, 185, 129, 0.25)",
        transition: "all 0.2s ease",
    },
    filterGridLight: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "16px",
        marginBottom: "32px",
    },
    filterCardLight: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
    },
    filterCardActiveLight: {
        background: "#f0fdf4",
        borderColor: "#a7f3d0",
        boxShadow: "0 4px 14px rgba(5, 150, 105, 0.08)",
    },
    filterIconBoxLight: {
        width: "42px",
        height: "42px",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    filterTitleLight: {
        fontSize: "12px",
        fontWeight: "700",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
    },
    filterCountLight: {
        fontSize: "22px",
        fontWeight: "800",
        color: "#0f172a",
        margin: "2px 0 0 0",
    },
    loadingBoxLight: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "60px 20px",
        textAlign: "center",
    },
    rectangularGridLight: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
        gap: "24px",
    },
    rectangularEventCardLight: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "18px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.04)",
        transition: "all 0.25s ease",
    },
    rectangularCoverWrapperLight: {
        position: "relative",
        width: "100%",
        height: "170px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        padding: "14px",
    },
    rectangularCategoryBadgeLight: {
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(8px)",
        color: "#059669",
        border: "1px solid #a7f3d0",
        borderRadius: "20px",
        padding: "4px 12px",
        fontSize: "11px",
        fontWeight: "800",
        letterSpacing: "0.05em",
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
    },
    rectangularDeadlineBadgeLight: {
        background: "rgba(239, 68, 68, 0.9)",
        color: "#ffffff",
        borderRadius: "20px",
        padding: "4px 12px",
        fontSize: "11px",
        fontWeight: "800",
        letterSpacing: "0.03em",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    },
    rectangularCardBodyLight: {
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        flex: 1,
    },
    rectangularTitleLight: {
        fontSize: "18px",
        fontWeight: "800",
        color: "#0f172a",
        margin: 0,
        lineHeight: "1.3",
    },
    rectangularMetaGridLight: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        background: "#f8fafc",
        padding: "12px 14px",
        borderRadius: "12px",
        border: "1px solid #f1f5f9",
    },
    rectangularMetaItemLight: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "12px",
        color: "#334155",
        fontWeight: "500",
    },
    settingBadgeGroupLight: {
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        marginTop: "4px",
    },
    settingBadgeLight: {
        background: "#f1f5f9",
        color: "#475569",
        border: "1px solid #e2e8f0",
        borderRadius: "6px",
        padding: "3px 8px",
        fontSize: "11px",
        fontWeight: "600",
    },
    rectangularCardFooterLight: {
        paddingTop: "14px",
        borderTop: "1px solid #f1f5f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        marginTop: "auto",
    },
    manageBtnLight: {
        background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
        color: "#ffffff",
        borderRadius: "10px",
        padding: "9px 18px",
        fontSize: "12px",
        fontWeight: "800",
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        boxShadow: "0 3px 10px rgba(16, 185, 129, 0.2)",
    },
    deleteBtnLight: {
        background: "#fef2f2",
        color: "#ef4444",
        border: "1px solid #fee2e2",
        borderRadius: "10px",
        padding: "9px 14px",
        fontSize: "12px",
        fontWeight: "700",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
    },
    emptyBoxLight: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "20px",
        padding: "60px 20px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
};

