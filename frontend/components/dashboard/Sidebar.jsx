"use client";
import { API_BASE_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
    const [groups, setGroups] = useState([]);
    const [clubName, setClubName] = useState("My Club");
    const [isMember, setIsMember] = useState(false);
    const [userRole, setUserRole] = useState("");
    const pathname = usePathname();

    const [isGroupsExpanded, setIsGroupsExpanded] = useState(() => {
        return pathname.startsWith("/dashboard/group/");
    });

    useEffect(() => {
        if (pathname.startsWith("/dashboard/group/")) {
            setIsGroupsExpanded(true);
        }
    }, [pathname]);

    const [memberRole, setMemberRole] = useState("");

    useEffect(() => {
        setIsMember(localStorage.getItem("isMember") === "true");
        setClubName(localStorage.getItem("clubName") || "My Club");
        setUserRole(localStorage.getItem("userRole") || "");
        setMemberRole(localStorage.getItem("memberRole") || "");
        const fetchGroups = async () => {
            const userId = localStorage.getItem("userId");
            if (!userId) return;

            try {
                const response = await fetch(`${API_BASE_URL}/groups?owner_id=${userId}`);
                if (response.ok) {
                    const data = await response.json();
                    setGroups(data);
                }
            } catch (error) {
                console.error("Error fetching groups:", error);
            }
        };

        fetchGroups();

        // Listen for groups updates to refresh the list
        window.addEventListener("groupsUpdated", fetchGroups);
        return () => window.removeEventListener("groupsUpdated", fetchGroups);
    }, []);

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <span className="club-badge">{clubName.charAt(0)}</span>
                <span className="club-name-text">{clubName}</span>
            </div>

            <Link
                href="/dashboard/overview"
                className={`menu-item ${pathname === "/dashboard/overview" ? "active" : ""}`}
            >
                <span className="icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                </span>
                <span>Dashboard</span>
            </Link>

            {!isMember && (
                <Link href="/dashboard" className={`menu-item ${pathname === "/dashboard" ? "active" : ""}`}>
                    <span className="icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                    </span>
                    <span>Home</span>
                </Link>
            )}

            {!isMember && (
                <Link
                    href="/dashboard/signup-forms"
                    className={`menu-item ${pathname.startsWith("/dashboard/signup-forms") ? "active" : ""}`}
                    style={{ textDecoration: "none" }}
                >
                    <span className="icon">
                        <svg
                            viewBox="0 0 24 24"
                            width="22"
                            height="22"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                        >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                    </span>
                    <span>Signup Forms</span>
                </Link>
            )}

            {!isMember && (
                <>
                    <button
                        type="button"
                        onClick={() => setIsGroupsExpanded((prev) => !prev)}
                        className={`menu-item ${pathname.startsWith("/dashboard/group/") ? "active" : ""}`}
                        style={{
                            width: "100%",
                            border: "none",
                            background: "transparent",
                            textAlign: "left",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span className="icon">
                                <svg
                                    viewBox="0 0 24 24"
                                    width="22"
                                    height="22"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    fill="none"
                                >
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </span>
                            <span>Groups</span>
                        </div>
                        <span
                            style={{
                                transition: "transform 0.2s",
                                transform: isGroupsExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                display: "inline-flex",
                            }}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </span>
                    </button>
                    {isGroupsExpanded && (
                        <div
                            className="sidebar-group-list"
                            style={{
                                paddingLeft: "24px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "2px",
                                margin: "4px 0 8px 0",
                            }}
                        >
                            {groups.length > 0 ? (
                                groups.map((group) => {
                                    const isActive = pathname === `/dashboard/group/${group.id}`;
                                    return (
                                        <Link
                                            key={group.id}
                                            href={`/dashboard/group/${group.id}`}
                                            className={`sidebar-group-link ${isActive ? "active" : ""}`}
                                            style={{ textDecoration: "none" }}
                                        >
                                            <svg
                                                viewBox="0 0 24 24"
                                                width="14"
                                                height="14"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                fill="none"
                                            >
                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="9" cy="7" r="4"></circle>
                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                            </svg>
                                            {group.group_name}
                                        </Link>
                                    );
                                })
                            ) : (
                                <p
                                    style={{
                                        fontSize: "13px",
                                        color: "rgba(255,255,255,0.4)",
                                        padding: "10px 8px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        margin: 0,
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="14"
                                        height="14"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        fill="none"
                                    >
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                    No groups
                                </p>
                            )}
                        </div>
                    )}
                </>
            )}

            <div className="menu-item">
                <span className="icon">
                    <svg viewBox="0 0 24 24">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </span>
                <span>Messages</span>
            </div>

            {!isMember && (
                <Link
                    href="/dashboard/members"
                    className={`menu-item ${pathname === "/dashboard/members" ? "active" : ""}`}
                    style={{ textDecoration: "none" }}
                >
                    <span className="icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </span>
                    <span>Members</span>
                </Link>
            )}

            <Link
                href="/dashboard/courses"
                className={`menu-item ${pathname.startsWith("/dashboard/courses") ? "active" : ""}`}
                style={{ textDecoration: "none" }}
            >
                <span className="icon">
                    <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"></path>
                    </svg>
                </span>
                <span>Training</span>
            </Link>

            <Link
                href="/dashboard/fundraising"
                className={`menu-item ${pathname.startsWith("/dashboard/fundraising") ? "active" : ""}`}
                style={{ textDecoration: "none" }}
            >
                <span
                    className="icon"
                    style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        width: "22px",
                        height: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    ₹
                </span>
                <span>Fundraising</span>
            </Link>

            <Link
                href="/dashboard/events"
                className={`menu-item ${pathname.startsWith("/dashboard/events") ? "active" : ""}`}
                style={{ textDecoration: "none" }}
            >
                <span className="icon">
                    <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                </span>
                <span>Events</span>
            </Link>

            {(!isMember || memberRole === "Referee" || memberRole === "Coach") && (
                <Link
                    href="/dashboard/matches"
                    className={`menu-item ${pathname.startsWith("/dashboard/matches") ? "active" : ""}`}
                    style={{ textDecoration: "none" }}
                >
                    <span className="icon">
                        <svg
                            viewBox="0 0 24 24"
                            width="22"
                            height="22"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 12h8" />
                            <path d="M12 8v8" />
                        </svg>
                    </span>
                    <span>Live Matches</span>
                </Link>
            )}

            {!isMember && (
                <Link
                    href="/dashboard/venues"
                    className={`menu-item ${pathname.startsWith("/dashboard/venues") ? "active" : ""}`}
                    style={{ textDecoration: "none" }}
                >
                    <span className="icon">
                        <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                    </span>
                    <span>Venues</span>
                </Link>
            )}

            {userRole === "mukijo_admin" && (
                <Link
                    href="/dashboard/venue-verification"
                    className={`menu-item ${pathname.startsWith("/dashboard/venue-verification") ? "active" : ""}`}
                    style={{ textDecoration: "none" }}
                >
                    <span className="icon">
                        <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none">
                            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </span>
                    <span>Venue Verification</span>
                </Link>
            )}
        </aside>
    );
}
