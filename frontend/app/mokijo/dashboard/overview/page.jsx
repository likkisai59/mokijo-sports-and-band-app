"use client";
import { API_BASE_URL } from "@/lib/api";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./overview.module.css";

const StatCard = ({ icon, label, value, sub, color, loading, href }) => {
    const content = (
        <>
            <div className={styles.statIcon}>{icon}</div>
            <div className={styles.statBody}>
                <span className={styles.statValue}>{loading ? "\u2014" : value}</span>
                <span className={styles.statLabel}>{label}</span>
                {sub && <span className={styles.statSub}>{sub}</span>}
            </div>
            {href && (
                <span className={styles.statArrow}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </span>
            )}
        </>
    );

    if (href) {
        return (
            <Link href={href} className={`${styles.statCard} ${styles[color]} ${styles.statCardLink}`}>
                {content}
            </Link>
        );
    }
    return <div className={`${styles.statCard} ${styles[color]}`}>{content}</div>;
};

function getEventDateParts(event) {
    const rawDate = event?.start_time || event?.start_date || event?.date;
    const eventDate = rawDate ? new Date(rawDate) : null;

    if (!eventDate || Number.isNaN(eventDate.getTime())) {
        return { month: "TBA", day: "" };
    }

    return {
        month: eventDate.toLocaleDateString("en-US", { month: "short" }),
        day: String(eventDate.getDate()),
    };
}

export default function OverviewPage() {
    const [isMember, setIsMember] = useState(false);
    const [memberRole, setMemberRole] = useState("Member");
    const [userName, setUserName] = useState("User");
    const [clubName, setClubName] = useState("My Club");
    const [memberGroupName, setMemberGroupName] = useState("");
    const [approvalStatus, setApprovalStatus] = useState("");
    const [bannerDismissed, setBannerDismissed] = useState(false);

    const [adminData, setAdminData] = useState(null);
    const [coachData, setCoachData] = useState(null);
    const [realEvents, setRealEvents] = useState([]);
    const [realMembers, setRealMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Event response status
    const [responses, setResponses] = useState({});

    const [campaigns, setCampaigns] = useState([]);
    const [liveMatches, setLiveMatches] = useState([]);
    const [trainerTrainings, setTrainerTrainings] = useState([]);
    const [registeredCourses, setRegisteredCourses] = useState([]);
    const [memberRegistrations, setMemberRegistrations] = useState([]);

    const userId = typeof window !== "undefined" ? (localStorage.getItem("userId") || localStorage.getItem("user_id") || localStorage.getItem("memberId") || localStorage.getItem("member_id") || localStorage.getItem("ownerId")) : null;

    useEffect(() => {
        const storedIsMember = localStorage.getItem("isMember") === "true";
        const storedRole = localStorage.getItem("memberRole") || "Player";
        const storedUserName = localStorage.getItem("userName") || "User";
        const storedClubName = localStorage.getItem("clubName") || "My Club";
        const storedEmail = localStorage.getItem("userEmail") || "";
        const storedGroupName = localStorage.getItem("memberGroupName") || "";
        const storedApprovalStatus = localStorage.getItem("approvalStatus") || "";

        setIsMember(storedIsMember);
        setMemberRole(storedRole);
        setUserName(storedUserName);
        setClubName(storedClubName);
        setMemberGroupName(storedGroupName);
        setApprovalStatus(storedApprovalStatus);

        const dismissKey = `bannerDismissed_${storedEmail || userId || "guest"}`;
        setBannerDismissed(localStorage.getItem(dismissKey) === "true");

        const fetchData = async () => {
            setLoading(true);
            const token = localStorage.getItem("accessToken");
            const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
            try {
                // Fetch active fundraising campaigns for all roles
                try {
                    const campaignsRes = await fetch(`${API_BASE_URL}/fundraising?owner_id=${userId || 1}`, {
                        headers: authHeaders,
                    });
                    if (campaignsRes.ok) {
                        const camps = await campaignsRes.json();
                        setCampaigns(camps);
                    }
                } catch (e) {
                    console.error("Error fetching campaigns on overview:", e);
                }

                // Fetch live matches
                try {
                    const matchesRes = await fetch(
                        `${API_BASE_URL}/matches?owner_id=${userId || 1}&status=live`,
                        { headers: authHeaders }
                    );
                    if (matchesRes.ok) {
                        const mData = await matchesRes.json();
                        setLiveMatches(mData || []);
                    }
                } catch (e) {
                    console.error("Error fetching live matches on overview:", e);
                }

                // Trainer trainings for dashboard cards (admin / player / parent)
                try {
                    const trainingsRes = await fetch(
                        `${API_BASE_URL}/courses/trainer-trainings?owner_id=${userId || 1}`,
                        { headers: authHeaders }
                    );
                    if (trainingsRes.ok) {
                        const trainings = await trainingsRes.json();
                        setTrainerTrainings(Array.isArray(trainings) ? trainings : []);
                    }
                } catch (e) {
                    console.error("Error fetching trainer trainings on overview:", e);
                }

                if (!storedIsMember) {
                    // Admin overview
                    const res = await fetch(`${API_BASE_URL}/dashboard/overview?owner_id=${userId}`, {
                        headers: authHeaders,
                    });
                    if (res.ok) {
                        const d = await res.json();
                        setAdminData(d);
                    }
                } else if (storedRole.toLowerCase() === "coach") {
                    // Coach overview
                    const res = await fetch(
                        `${API_BASE_URL}/dashboard/coach?owner_id=${userId || 1}&coach_email=${encodeURIComponent(storedEmail)}`,
                        { headers: authHeaders }
                    );
                    if (res.ok) {
                        const d = await res.json();
                        setCoachData(d);
                    }
                } else {
                    // Fetch real events, teammates, registered courses & attendance for member-based schedules
                    const [eventsRes, membersRes, coursesRes, registrationsRes] = await Promise.all([
                        fetch(`${API_BASE_URL}/events?owner_id=${userId || 1}`, { headers: authHeaders }),
                        fetch(`${API_BASE_URL}/members?owner_id=${userId || 1}`, { headers: authHeaders }).catch(() => null),
                        storedEmail
                            ? fetch(
                                `${API_BASE_URL}/courses?owner_id=${userId || 1}&member_email=${encodeURIComponent(storedEmail)}`,
                                { headers: authHeaders }
                            ).catch(() => null)
                            : Promise.resolve(null),
                        storedEmail
                            ? fetch(
                                `${API_BASE_URL}/members/registrations?member_email=${encodeURIComponent(storedEmail)}`,
                                { headers: authHeaders }
                            ).catch(() => null)
                            : Promise.resolve(null),
                    ]);

                    if (eventsRes && eventsRes.ok) {
                        const evs = await eventsRes.json();
                        const visibleEvents = Array.isArray(evs)
                            ? evs.filter((event) => event.visible_to_member !== false)
                            : [];
                        setRealEvents(visibleEvents);
                    }
                    if (membersRes && membersRes.ok) {
                        const mems = await membersRes.json();
                        setRealMembers(Array.isArray(mems) ? mems : []);
                    }
                    if (coursesRes && coursesRes.ok) {
                        const courseData = await coursesRes.json();
                        setRegisteredCourses(Array.isArray(courseData) ? courseData : []);
                    }
                    if (registrationsRes && registrationsRes.ok) {
                        const regData = await registrationsRes.json();
                        setMemberRegistrations(Array.isArray(regData) ? regData : []);
                    }
                }
            } catch (err) {
                console.error("Dashboard loading error:", err);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (liveMatches.length === 0) return;

        const sockets = liveMatches.map((match) => {
            const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            let wsHost = window.location.host;
            if (API_BASE_URL.startsWith("http")) {
                const urlObj = new URL(API_BASE_URL);
                wsHost = urlObj.host;
            }
            const wsUrl = `${wsProtocol}//${wsHost}/ws/scoreboard/${match.id}`;
            const ws = new WebSocket(wsUrl);

            ws.onmessage = (event) => {
                try {
                    const updatedMatch = JSON.parse(event.data);
                    setLiveMatches((prevMatches) =>
                        prevMatches.map((m) => (m.id === updatedMatch.id ? updatedMatch : m))
                    );
                } catch (err) {
                    console.error("Error parsing WebSocket message:", err);
                }
            };

            ws.onerror = (err) => console.error("Scoreboard WS error:", err);

            return ws;
        });

        return () => {
            sockets.forEach((ws) => ws.close());
        };
    }, [liveMatches.length]);

    // Teammates limited to the member's own group, excluding parents/guardians/coaches
    const activeTeammates = realMembers.filter((m) => {
        const sameGroup = memberGroupName
            ? (m.group_name || "").trim().toLowerCase() === memberGroupName.trim().toLowerCase()
            : false;
        const role = (m.role || "").toLowerCase();
        const isExcludedRole = role.includes("parent") || role.includes("guardian") || role.includes("coach");
        return sameGroup && !isExcludedRole;
    });

    // Handle interactive player response
    const handlePlayerResponse = async (eventId, responseType) => {
        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_BASE_URL}/events/${eventId}/respond`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    member_email: localStorage.getItem("userEmail") || "",
                    status: responseType, // accepted, declined, maybe
                }),
            });
            if (res.ok) {
                setResponses((prev) => ({ ...prev, [eventId]: responseType }));
                alert(`Your response status has been successfully set to: ${responseType.toUpperCase()}`);
            } else {
                alert("Failed to submit your response. Check if session limit was reached.");
            }
        } catch (e) {
            console.error("Event response error:", e);
            alert("Connection error while sending your response.");
        }
    };

    const dismissApprovalBanner = () => {
        const email = localStorage.getItem("userEmail") || userId || "guest";
        localStorage.setItem(`bannerDismissed_${email}`, "true");
        setBannerDismissed(true);
    };

    const renderMemberApprovalBanner = () => {
        if (bannerDismissed) return null;

        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: "1px solid #bbf7d0",
                    background: "#f0fdf4",
                    color: "#166534",
                    marginBottom: "16px",
                    flexWrap: "wrap",
                }}
            >
                <div>
                    <strong style={{ display: "block", fontSize: "14px" }}>Application accepted by club admin</strong>
                    <span style={{ fontSize: "13px" }}>
                        Your member dashboard is active{memberGroupName ? ` for ${memberGroupName}` : ""}.
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                        style={{
                            padding: "4px 10px",
                            borderRadius: "999px",
                            background: "#dcfce7",
                            color: "#166534",
                            fontSize: "12px",
                            fontWeight: 800,
                            textTransform: "uppercase",
                        }}
                    >
                        {approvalStatus || "accepted"}
                    </span>
                    <button
                        type="button"
                        onClick={dismissApprovalBanner}
                        aria-label="Dismiss notification"
                        title="Dismiss"
                        style={{
                            border: "none",
                            background: "transparent",
                            color: "#166534",
                            cursor: "pointer",
                            fontSize: "18px",
                            lineHeight: 1,
                            padding: "2px 6px",
                            borderRadius: "6px",
                        }}
                    >
                        ×
                    </button>
                </div>
            </div>
        );
    };

    const renderTrainerTrainingsSection = () => {
        const dateText = (value) => {
            if (!value) return "Not scheduled";
            return value;
        };

        return (
            <>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Discover Trainings</h2>
                    <p className={styles.sectionSubtitle}>Independent trainings created by platform trainers</p>
                </div>

                {loading ? (
                    <div className={styles.venuesGrid}>
                        {[1, 2, 3].map((n) => (
                            <div key={n} className={styles.venueCard} style={{ minHeight: 160 }}>
                                <div className={styles.venueCardContent}>
                                    <div className={styles.skeletonRow} style={{ width: "60%", height: 20 }} />
                                    <div className={styles.skeletonRow} style={{ width: "80%", height: 15 }} />
                                    <div className={styles.skeletonRow} style={{ width: "40%", height: 15 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : trainerTrainings.length === 0 ? (
                    <div className={styles.venueCard} style={{ marginBottom: 32, padding: 24 }}>
                        <div className={styles.venueCardContent}>
                            <p style={{ margin: 0, color: "rgba(148, 163, 184, 0.8)", fontSize: 14 }}>
                                No trainings available yet.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className={styles.venuesGrid}>
                        {trainerTrainings.map((training) => (
                            <Link
                                key={training.id}
                                href={`/trainings/${training.id}`}
                                className={styles.venueCard}
                                style={{ textDecoration: "none", color: "inherit", display: "block" }}
                            >
                                <div
                                    style={{
                                        height: 140,
                                        overflow: "hidden",
                                        borderRadius: "12px 12px 0 0",
                                        background: "rgba(255,255,255,0.04)",
                                    }}
                                >
                                    <img
                                        src={
                                            training.cover_image ||
                                            "https://images.unsplash.com/photo-1517649763962-0c6238842e77?q=80&w=600&auto=format&fit=crop"
                                        }
                                        alt={training.title}
                                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                    />
                                </div>
                                <div className={styles.venueCardContent}>
                                    <div className={styles.venueCardHeader}>
                                        <h3 className={styles.venueName}>{training.title}</h3>
                                        <span className={`${styles.statusBadge} ${styles.verified}`}>
                                            {training.status || "open"}
                                        </span>
                                    </div>
                                    <p style={{ margin: "0 0 10px", fontSize: 13, color: "rgba(148, 163, 184, 0.85)" }}>
                                        {training.trainer_name
                                            ? `Trainer · ${training.trainer_name}`
                                            : training.instructor || "Trainer session"}
                                    </p>
                                    <p style={{ margin: "0 0 12px", fontSize: 13, color: "rgba(226, 232, 240, 0.8)" }}>
                                        {training.description || "No description added."}
                                    </p>
                                    <div style={{ display: "grid", gap: 6, fontSize: 12, color: "rgba(148, 163, 184, 0.9)" }}>
                                        <span>
                                            Dates: {dateText(training.start_date)}
                                            {training.end_date ? ` → ${dateText(training.end_date)}` : ""}
                                        </span>
                                        <span>Schedule: {training.schedule || "—"}</span>
                                        <span>Location: {training.location || "TBA"}</span>
                                    </div>
                                    {training.reschedule_reason && (
                                        <p style={{ margin: "12px 0 0", fontSize: 12, color: "#fb923c" }}>
                                            Rescheduled: {training.reschedule_reason}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </>
        );
    };

    // Render 1: Club Admin Dashboard
    const renderAdminDashboard = () => {
        return (
            <div className={styles.page}>
                {/* Quick Actions */}
                <div className={styles.actionBar}>
                    <Link href="/dashboard/creategroup" className={styles.actionButton}>
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        Create New Group
                    </Link>
                    <Link href="/dashboard/importgroups" className={styles.actionButton}>
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Add more members
                    </Link>
                    <Link href="/dashboard/events/new" className={styles.actionButton}>
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Create New Event
                    </Link>
                    <Link href="/dashboard/fundraising/new" className={styles.actionButton}>
                        <svg
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            stroke="currentColor"
                            fill="none"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M6 3h12" />
                            <path d="M6 8h12" />
                            <path d="m6 13 8.5 8" />
                            <path d="M6 13h3" />
                            <path d="M9 13c6.667 0 6.667-10 0-10" />
                        </svg>
                        Create New Campaign
                    </Link>
                    <Link href="/dashboard/members" className={styles.actionButton}>
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <line x1="19" y1="8" x2="19" y2="14"></line>
                            <line x1="22" y1="11" x2="16" y2="11"></line>
                        </svg>
                        Add a New Member
                    </Link>
                </div>

                {/* Page heading */}
                <div className={styles.pageHeader}>
                    <div>
                        <div className="auth-brand text-[28px] md:text-[36px] font-black uppercase tracking-wider text-[#c6ff3d] mb-1">
                            MUKIJO
                        </div>
                        <h1 className={styles.pageTitle}>Club Overview</h1>
                        <p className={styles.pageSubtitle}>A snapshot of {clubName}&apos;s activity and performance</p>
                    </div>
                    <div className={styles.dateBadge}>
                        {new Date().toLocaleDateString("en-IN", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        })}
                    </div>
                </div>

                {renderTrainerTrainingsSection()}

                {/* Registered Venues */}
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Registered Venues</h2>
                    <p className={styles.sectionSubtitle}>Venues registered by owners on the platform</p>
                </div>

                {loading ? (
                    <div className={styles.venuesGrid}>
                        {[1, 2, 3].map((n) => (
                            <div key={n} className={styles.venueCard} style={{ minHeight: 260 }}>
                                <div className={styles.skeletonRow} style={{ height: 140, borderRadius: '16px 16px 0 0' }} />
                                <div className={styles.venueCardContent}>
                                    <div className={styles.skeletonRow} style={{ width: "60%", height: 20 }} />
                                    <div className={styles.skeletonRow} style={{ width: "80%", height: 15 }} />
                                    <div className={styles.skeletonRow} style={{ width: "40%", height: 15 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : adminData?.venues && adminData.venues.length > 0 ? (
                    <div className={styles.venuesGrid}>
                        {adminData.venues.map((venue) => (
                            <Link
                                key={venue.id}
                                href={`/dashboard/venues?venue=${venue.id}`}
                                className={styles.venueCard}
                                style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
                            >
                                {venue.cover_image ? (
                                    <img src={venue.cover_image} alt={venue.name} className={styles.venueImage} />
                                ) : (
                                    <div className={styles.venuePlaceholderImage}>
                                        <span>No Cover Image</span>
                                    </div>
                                )}
                                <div className={styles.venueCardContent}>
                                    <div className={styles.venueCardHeader}>
                                        <h3 className={styles.venueName}>{venue.name}</h3>
                                    </div>
                                    <p className={styles.venueLocation}>
                                        <strong>Location:</strong> {venue.location}
                                    </p>
                                    {venue.sports_supported && (
                                        <p className={styles.venueSports}>
                                            <strong>Sports:</strong> {(() => {
                                                try {
                                                    const parsed = JSON.parse(venue.sports_supported);
                                                    if (Array.isArray(parsed)) {
                                                        return parsed.join(", ");
                                                    }
                                                } catch (e) { }
                                                return venue.sports_supported.replace(/[\[\]"]/g, "");
                                            })()}
                                        </p>
                                    )}
                                    <div className={styles.venueOwnerInfo}>
                                        <p><strong>Owner:</strong> {venue.owner_name}</p>
                                        {venue.contact_email && <p><strong>Email:</strong> {venue.contact_email}</p>}
                                        {venue.contact_phone && <p><strong>Phone:</strong> {venue.contact_phone}</p>}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyVenues}>
                        <p>No registered venues found.</p>
                    </div>
                )}

                {/* Stat Cards */}
                <div className={styles.statsGrid}>
                    <StatCard
                        loading={loading}
                        color="blue"
                        label="Total Members"
                        value={adminData?.total_members ?? adminData?.totalMembers ?? 0}
                        sub="Across all groups"
                        href="/dashboard/members"
                        icon={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        }
                    />
                    <StatCard
                        loading={loading}
                        color="violet"
                        label="Total Groups"
                        value={adminData?.total_groups ?? adminData?.totalGroups ?? 0}
                        sub="Active groups"
                        href="/dashboard"
                        icon={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                <polyline points="2 17 12 22 22 17" />
                                <polyline points="2 12 12 17 22 12" />
                            </svg>
                        }
                    />
                    <StatCard
                        loading={loading}
                        color="amber"
                        label="Pending Payments"
                        value={`\u20B9${(adminData?.pending_payments ?? adminData?.pendingPayments ?? 0).toLocaleString()}`}
                        sub="Awaiting collection"
                        icon={
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M6 3h12" />
                                <path d="M6 8h12" />
                                <path d="m6 13 8.5 8" />
                                <path d="M6 13h3" />
                                <path d="M9 13c6.667 0 6.667-10 0-10" />
                            </svg>
                        }
                    />
                    <StatCard
                        loading={loading}
                        color="emerald"
                        label="Upcoming Events"
                        value={adminData?.upcoming_events_count ?? adminData?.upcoming_events ?? adminData?.upcomingEvents ?? 0}
                        sub="Scheduled ahead"
                        href="/dashboard"
                        icon={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        }
                    />
                    <StatCard
                        loading={loading}
                        color="rose"
                        label="Fundraising"
                        value={`\u20B9${(adminData?.fundraising_total ?? adminData?.fundraising ?? adminData?.fundraisingTotal ?? 0).toLocaleString()}`}
                        sub="Total raised"
                        icon={
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                <polyline points="17 6 23 6 23 12" />
                            </svg>
                        }
                    />
                    <StatCard
                        loading={loading}
                        color="cyan"
                        label="Live Matches"
                        value={adminData?.live_matches_count ?? adminData?.live_matches ?? (Array.isArray(adminData?.liveMatches) ? adminData.liveMatches.length : 0)}
                        sub="Currently in play"
                        href="/dashboard/matches"
                        icon={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M12 7v5l3 2" />
                            </svg>
                        }
                    />
                </div>

                {(adminData?.active_team_activity?.length ?? 0) > 0 && (
                    <div className={styles.sectionCard} style={{ marginTop: "24px" }}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Active Team Activity</h2>
                            <span className={styles.liveBadge}>Live</span>
                        </div>
                        <div className={styles.activityGrid}>
                            {adminData.active_team_activity.slice(0, 6).map((activity, index) => (
                                <div key={`${activity.match_id}-${activity.member_name}-${index}`} className={styles.activityCard}>
                                    <div className={styles.activityAvatar}>
                                        {(activity.member_name || "P").split(" ")[0][0]?.toUpperCase() || "P"}
                                    </div>
                                    <div className={styles.activityBody}>
                                        <div className={styles.activityMember}>{activity.member_name}</div>
                                        <div className={styles.activityMatch}>{activity.match_title}</div>
                                        <div className={styles.activityMeta}>Venue · {activity.venue || "TBA"}</div>
                                        <div className={styles.activityTiming}>{activity.timing || "Live now"}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {(adminData?.live_matches?.length ?? 0) > 0 && (
                    <div className={styles.sectionCard} style={{ marginTop: "24px" }}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Live Matches</h2>
                            <Link href="/dashboard/matches" className={styles.viewAllLink}>View all matches</Link>
                        </div>
                        <div className={styles.eventList}>
                            {adminData.live_matches.map((match) => (
                                <Link
                                    key={match.id}
                                    href={`/scoreboard/${match.id}`}
                                    className={styles.eventCard}
                                    style={{ textDecoration: "none", color: "inherit", display: "block" }}
                                >
                                    <div className={styles.eventMeta}>
                                        <span className={styles.eventTypeBadge}>{match.sport || "Match"}</span>
                                        <span className={styles.eventDate}>{match.status || "Live"}</span>
                                    </div>
                                    <div className={styles.eventTitle}>{match.title || match.summary || "Live match"}</div>
                                    <div className={styles.eventLocation}>{match.summary || match.teams?.join(" vs ") || "In progress"}</div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Render 2: Coach Dashboard
    const renderCoachDashboard = () => {
        const myEvents = coachData?.upcoming_events || [];
        return (
            <div className={styles.page}>
                {renderMemberApprovalBanner()}
                {/* Quick Actions */}
                <div className={styles.actionBar}>
                    <Link href="/dashboard/events/new" className={styles.actionButton}>
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Schedule Match/Session
                    </Link>
                    <Link
                        href={`/dashboard/members?group=${encodeURIComponent(memberGroupName)}`}
                        className={styles.actionButton}
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                        </svg>
                        Manage Player Members
                    </Link>
                </div>

                {/* Page heading */}
                <div className={styles.pageHeader}>
                    <div>
                        <div className="auth-brand text-[28px] md:text-[36px] font-black uppercase tracking-wider text-[#c6ff3d] mb-1">
                            MUKIJO
                        </div>
                        <h1 className={styles.pageTitle}>Coach Console</h1>
                        <p className={styles.pageSubtitle}>
                            Welcome back, Coach {userName}! Manage your team & practices.
                        </p>
                    </div>
                    <div className={styles.dateBadge}>
                        {new Date().toLocaleDateString("en-IN", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        })}
                    </div>
                </div>

                {/* Stats */}
                <div className={styles.statsGrid}>
                    <StatCard
                        loading={loading}
                        color="blue"
                        label="Squad Players"
                        value={coachData?.squad_players_count ?? 0}
                        sub="Assigned to your group"
                        href="/dashboard/members"
                        icon={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                            </svg>
                        }
                    />
                    <StatCard
                        loading={loading}
                        color="violet"
                        label="Upcoming Events"
                        value={coachData?.upcoming_events_count ?? 0}
                        sub="Events & practices"
                        href="/dashboard/events"
                        icon={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                            </svg>
                        }
                    />
                    <StatCard
                        loading={loading}
                        color="emerald"
                        label="Attendance Rating"
                        value={coachData?.attendance_rating ?? "0%"}
                        sub="Team presence average"
                        icon={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        }
                    />
                </div>

                {/* Content Panels */}
                <div className={styles.panels}>
                    {renderLiveMatchesWidget()}

                    <div className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <h3 className={styles.panelTitle}>Upcoming Practice Itinerary</h3>
                            <Link href="/dashboard/events" className={styles.panelLink}>
                                View All
                            </Link>
                        </div>
                        <ul className={styles.eventList}>
                            {myEvents.length > 0 ? (
                                myEvents.slice(0, 3).map((ev, idx) => {
                                    const { month, day } = getEventDateParts(ev);

                                    return (
                                        <li key={idx} className={styles.eventRow}>
                                            <div className={styles.eventDateBox}>
                                                <span className={styles.eventMonth}>{month}</span>
                                                <span className={styles.eventDay}>{day}</span>
                                            </div>
                                            <div className={styles.eventInfo}>
                                                <span className={styles.eventName}>{ev.name || ev.title}</span>
                                                <div className={styles.eventMeta}>
                                                    <span className={styles.eventType}>
                                                        {ev.category || ev.type || "Practice"}
                                                    </span>
                                                    <span>Location: {ev.venue || ev.location}</span>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })
                            ) : (
                                <li style={{ color: "#94a3b8", fontSize: "13px", padding: "8px 0" }}>
                                    No upcoming practices or sessions scheduled yet.
                                </li>
                            )}
                        </ul>
                    </div>

                    {renderActiveCampaignsPanel()}
                </div>
            </div>
        );
    };

    const renderActiveCampaignsPanel = () => {
        const activeCamps = campaigns.filter((c) => c.status === "active");
        if (activeCamps.length === 0) return null;

        return (
            <div className={styles.panel}>
                <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle}>Active Club Fundraising</h3>
                    <Link href="/dashboard/fundraising" className={styles.panelLink}>
                        Support Us
                    </Link>
                </div>
                <ul
                    style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                    }}
                >
                    {activeCamps.slice(0, 2).map((c) => {
                        const progress = Math.min(100, Math.round(((c.raised || 0) / (c.goal || 1)) * 100));
                        return (
                            <li
                                key={c.id}
                                style={{
                                    padding: "12px",
                                    border: "1px solid #f4f4f5",
                                    borderRadius: "10px",
                                    background: "#f8fafc",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        marginBottom: "6px",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontWeight: "700",
                                            fontSize: "13px",
                                            color: "#0f172a",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            maxWidth: "200px",
                                        }}
                                    >
                                        {c.title}
                                    </div>
                                    <span
                                        style={{
                                            fontSize: "10px",
                                            fontWeight: "700",
                                            padding: "2px 6px",
                                            borderRadius: "8px",
                                            background: "#eff6ff",
                                            color: "#c6ff3d",
                                        }}
                                    >
                                        {progress}%
                                    </span>
                                </div>
                                <div
                                    style={{
                                        fontSize: "11px",
                                        color: "#64748b",
                                        marginBottom: "8px",
                                        textOverflow: "ellipsis",
                                        overflow: "hidden",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {c.description || "Support our club sports campaigns!"}
                                </div>
                                <div
                                    style={{
                                        height: "6px",
                                        background: "#e2e8f0",
                                        borderRadius: "99px",
                                        overflow: "hidden",
                                        marginBottom: "10px",
                                    }}
                                >
                                    <div
                                        style={{
                                            height: "100%",
                                            width: `${progress}%`,
                                            background: "linear-gradient(90deg, #c6ff3d, #10b981)",
                                            borderRadius: "99px",
                                        }}
                                    />
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#0f172a" }}>
                                        Rs. {Number(c.raised || 0).toLocaleString()}{" "}
                                        <span style={{ color: "#94a3b8", fontWeight: "normal" }}>
                                            / Rs. {Number(c.goal || 0).toLocaleString()}
                                        </span>
                                    </span>
                                    <Link
                                        href={`/dashboard/fundraising/donate/${c.id}`}
                                        style={{
                                            padding: "4px 10px",
                                            background: "#c6ff3d",
                                            color: "white",
                                            textDecoration: "none",
                                            borderRadius: "6px",
                                            fontSize: "11px",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        Donate
                                    </Link>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    };

    // Reusable Live Scoreboard widget for members
    const renderLiveMatchesWidget = () => {
        if (liveMatches.length === 0) return null;
        return (
            <div className={styles.panel} style={{ gridColumn: "span 2", background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "16px", padding: "20px", marginBottom: "24px" }}>
                <div className={styles.panelHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className={styles.liveDot}></span>
                        <h3 className={styles.panelTitle} style={{ color: "#ef4444", margin: 0, fontWeight: "800", fontSize: "16px" }}>LIVE MATCH SCORES</h3>
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {liveMatches.map((match) => (
                        <div key={match.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "16px 20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <span style={{ fontSize: "15px", fontWeight: "700", color: "#f8fafc" }}>{match.title}</span>
                                <span style={{ fontSize: "12px", color: "rgba(148, 163, 184, 0.6)" }}>{match.sport} • {match.venue}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                                {match.teams && match.teams.length === 2 ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                        <div style={{ textAlign: "right" }}>
                                            <span style={{ fontSize: "14px", fontWeight: "700", color: "#e2e8f0" }}>{match.teams[0].team_name}</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(239, 68, 68, 0.1)", padding: "6px 16px", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                                            <span style={{ fontSize: "18px", fontWeight: "800", color: "#f8fafc" }}>{match.teams[0].score ?? 0}</span>
                                            <span style={{ color: "rgba(148,163,184,0.4)" }}>:</span>
                                            <span style={{ fontSize: "18px", fontWeight: "800", color: "#f8fafc" }}>{match.teams[1].score ?? 0}</span>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: "14px", fontWeight: "700", color: "#e2e8f0" }}>{match.teams[1].team_name}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <span style={{ color: "#64748b" }}>No team data</span>
                                )}
                                <Link
                                    href={`/scoreboard/${match.id}`}
                                    className="m-btn primary"
                                    style={{
                                        padding: "6px 12px",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        textDecoration: "none",
                                        background: "var(--brand, #c6ff3d)",
                                        color: "#000",
                                        fontWeight: "700"
                                    }}
                                >
                                    View Scoreboard
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render 3: Player Dashboard
    const renderPlayerDashboard = () => {
        return (
            <div className={styles.page}>
                {renderMemberApprovalBanner()}
                {/* Quick Actions */}
                <div className={styles.actionBar}>
                    <Link
                        href="/dashboard/events"
                        className={styles.actionButton}
                        style={{
                            background: "linear-gradient(135deg, #c6ff3d, #d9ff6e)",
                            color: "#08080f",
                            fontWeight: "800",
                            border: "none",
                            boxShadow: "0 4px 14px rgba(198, 255, 61, 0.3)",
                        }}
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                        </svg>
                        My Game Schedule
                    </Link>
                    <Link
                        href="/dashboard/fundraising"
                        className={styles.actionButton}
                        style={{
                            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                            color: "#ffffff",
                            fontWeight: "700",
                            border: "none",
                            boxShadow: "0 4px 14px rgba(59, 130, 246, 0.3)",
                        }}
                    >
                        {"\u20B9"} Support Club Dues
                    </Link>
                </div>

                {/* Page heading */}
                <div className={styles.pageHeader}>
                    <div>
                        <h1 className={styles.pageTitle}>Athlete Space</h1>
                        <p className={styles.pageSubtitle}>
                            Welcome back, {userName}! Let&apos;s push our athletic goals today.
                        </p>
                    </div>
                    <div className={styles.dateBadge}>
                        {new Date().toLocaleDateString("en-IN", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        })}
                    </div>
                </div>

                {renderTrainerTrainingsSection()}

                {/* Content Panels */}
                <div className={styles.panels}>
                    {renderLiveMatchesWidget()}
                </div>
            </div>
        );
    };

    // Render 4: Parent Dashboard
    const renderParentDashboard = () => {
        return (
            <div className={styles.page}>
                {renderMemberApprovalBanner()}
                {/* Quick Actions */}
                <div className={styles.actionBar}>
                    <Link
                        href={`/dashboard/members?group=${encodeURIComponent(memberGroupName)}`}
                        className={styles.actionButton}
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                        </svg>
                        Members
                    </Link>
                    <Link href="/dashboard/events" className={styles.actionButton}>
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none">
                            <rect x="3" y="5" width="18" height="16" rx="2" ry="2"></rect>
                            <line x1="16" y1="3" x2="16" y2="7"></line>
                            <line x1="8" y1="3" x2="8" y2="7"></line>
                            <line x1="3" y1="11" x2="21" y2="11"></line>
                            <circle cx="8" cy="15" r="1"></circle>
                            <circle cx="12" cy="15" r="1"></circle>
                            <circle cx="16" cy="15" r="1"></circle>
                        </svg>
                        Events
                    </Link>
                    <Link href="/dashboard/fundraising" className={styles.actionButton}>
                        <span className={styles.actionSymbol}>{"\u20B9"}</span>
                        Donate
                    </Link>
                </div>

                {/* Page heading */}
                <div className={styles.pageHeader}>
                    <div>
                        <h1 className={styles.pageTitle}>Guardian Portal</h1>
                        <p className={styles.pageSubtitle}>
                            Welcome back, parent {userName}! Manage emergency details, kids&apos; events, and fees.
                        </p>
                    </div>
                    <div className={styles.dateBadge}>
                        {new Date().toLocaleDateString("en-IN", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        })}
                    </div>
                </div>

                {renderTrainerTrainingsSection()}

                {/* Stats */}
                <div className={styles.statsGrid}>
                    <StatCard
                        loading={loading}
                        color="blue"
                        label="Children Registered"
                        value={activeTeammates.length}
                        sub={activeTeammates.length > 0 ? "Linked to your group" : "No linked children yet"}
                        icon={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            </svg>
                        }
                    />
                    <StatCard
                        loading={loading}
                        color="violet"
                        label="Upcoming Events"
                        value={realEvents.length}
                        sub="Events scheduled"
                        href="/dashboard/events"
                        icon={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                            </svg>
                        }
                    />
                    <StatCard
                        loading={loading}
                        color="amber"
                        label="Outstanding Dues"
                        value="Rs. 0"
                        sub="No dues data available"
                        href="/dashboard/payments"
                        icon={<span className={styles.rupeeIcon}>{"\u20B9"}</span>}
                    />
                </div>

                {/* Content Panels */}
                <div className={styles.panels}>
                    {renderLiveMatchesWidget()}
                    {renderActiveCampaignsPanel()}
                </div>
            </div>
        );
    };

    // Render 5: Referee Dashboard
    const renderRefereeDashboard = () => {
        const liveCount = liveMatches.length;

        return (
            <div className={styles.page}>
                {renderMemberApprovalBanner()}

                {/* Page heading */}
                <div className={styles.pageHeader}>
                    <div>
                        <h1 className={styles.pageTitle}>Match Official Desk</h1>
                        <p className={styles.pageSubtitle}>
                            Welcome back, Referee {userName}! Open live matches to input scores and manage the
                            scoreboard.
                        </p>
                    </div>
                    <div className={styles.dateBadge}>
                        {new Date().toLocaleDateString("en-IN", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        })}
                    </div>
                </div>

                {/* Stats */}
                <div className={styles.statsGrid}>
                    <StatCard
                        loading={loading}
                        color="rose"
                        label="Live Matches"
                        value={liveCount}
                        sub="In progress now"
                        href="/dashboard/matches"
                        icon={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M8 12h8" />
                                <path d="M12 8v8" />
                            </svg>
                        }
                    />
                </div>

                {/* Content Panels */}
                <div className={styles.panels}>
                    {renderLiveMatchesWidget() || (
                        <div className={styles.panel} style={{ gridColumn: "span 2", padding: "28px", textAlign: "center" }}>
                            <h3 className={styles.panelTitle} style={{ marginBottom: "8px" }}>
                                No live matches
                            </h3>
                            <p style={{ color: "#64748b", marginBottom: "0" }}>
                                When a match goes live, it will appear here for scoring.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div
                className={styles.page}
                style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}
            >
                <div style={{ textAlign: "center", color: "#64748b" }}>
                    <div
                        style={{
                            width: "40px",
                            height: "40px",
                            border: "4px solid #cbd5e1",
                            borderTopColor: "#c6ff3d",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            margin: "0 auto 16px",
                        }}
                    ></div>
                    <p style={{ fontWeight: 600 }}>Loading customized role dashboard...</p>
                </div>
                <style jsx>{`
                    @keyframes spin {
                        to {
                            transform: rotate(360deg);
                        }
                    }
                `}</style>
            </div>
        );
    }

    if (isMember) {
        const role = memberRole?.toLowerCase();
        if (role === "coach") {
            return renderCoachDashboard();
        } else if (role === "parent") {
            return renderParentDashboard();
        } else if (role === "referee") {
            return renderRefereeDashboard();
        } else {
            // Default player dashboard
            return renderPlayerDashboard();
        }
    }

    // Default Club Admin Overview
    return renderAdminDashboard();
}
