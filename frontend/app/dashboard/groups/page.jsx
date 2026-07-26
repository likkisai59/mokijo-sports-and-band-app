"use client";
import { API_BASE_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function GroupsPage() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [expandedGroupId, setExpandedGroupId] = useState(null);

    useEffect(() => {
        const fetchGroups = async () => {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(`${API_BASE_URL}/groups?owner_id=${userId}`);
                if (response.ok) {
                    const data = await response.json();
                    setGroups(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error("Error fetching groups:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
        window.addEventListener("groupsUpdated", fetchGroups);
        return () => window.removeEventListener("groupsUpdated", fetchGroups);
    }, []);

    const memberName = (m) => {
        const name = `${m.first_name || ""} ${m.last_name || ""}`.trim();
        return name || m.email || "Member";
    };

    const toggleExpand = (groupId) => {
        setExpandedGroupId((prev) => (prev === groupId ? null : groupId));
    };

    const filteredGroups = groups.filter((g) => {
        const q = search.toLowerCase();
        return (
            (g.group_name || "").toLowerCase().includes(q) ||
            (g.activity || "").toLowerCase().includes(q) ||
            (g.age_group || "").toLowerCase().includes(q) ||
            (g.sub_group || "").toLowerCase().includes(q)
        );
    });

    return (
        <section
            className="event-section"
            style={{
                borderRadius: 0,
                border: "none",
                boxShadow: "none",
                padding: "32px 48px",
                minHeight: "calc(100vh - 96px)",
                background: "transparent",
            }}
        >
            <div className="event-top">
                <span>Groups</span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            backgroundColor: "rgba(255, 255, 255, 0.04)",
                            borderRadius: "10px",
                            padding: "8px 14px",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                        }}
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="#94a3b8" strokeWidth="2" fill="none">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            placeholder="Search groups..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                border: "none",
                                outline: "none",
                                background: "transparent",
                                fontSize: "14px",
                                color: "#f4f4f5",
                                width: "200px",
                            }}
                        />
                    </div>
                    <Link
                        href="/dashboard/importgroups"
                        style={{
                            padding: "9px 16px",
                            borderRadius: "10px",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            background: "rgba(255, 255, 255, 0.04)",
                            color: "#f4f4f5",
                            fontSize: "13px",
                            fontWeight: "600",
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                        }}
                    >
                        Add more members
                    </Link>
                    <Link
                        href="/dashboard/creategroup"
                        style={{
                            padding: "9px 16px",
                            borderRadius: "10px",
                            border: "none",
                            background: "linear-gradient(135deg, #c6ff3d, #10b981)",
                            color: "#08080f",
                            fontSize: "13px",
                            fontWeight: "700",
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                        }}
                    >
                        + Create Group
                    </Link>
                </div>
            </div>

            {loading ? (
                <div
                    className="loading-box"
                    style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}
                >
                    Loading groups...
                </div>
            ) : filteredGroups.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "15px" }}>
                    {filteredGroups.map((group) => {
                        const members = group.members || [];
                        const isExpanded = expandedGroupId === group.id;
                        return (
                            <div
                                key={group.id}
                                style={{
                                    backgroundColor: "rgba(20, 20, 31, 0.85)",
                                    borderRadius: "12px",
                                    border: "1px solid rgba(255, 255, 255, 0.07)",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "16px",
                                        padding: "18px 20px",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                                        <span
                                            style={{
                                                width: "42px",
                                                height: "42px",
                                                borderRadius: "50%",
                                                background: "rgba(198, 255, 61, 0.12)",
                                                color: "#c6ff3d",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontWeight: "700",
                                                fontSize: "16px",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {(group.group_name || "G").charAt(0).toUpperCase()}
                                        </span>
                                        <div style={{ minWidth: 0 }}>
                                            <div
                                                style={{
                                                    color: "#f4f4f5",
                                                    fontSize: "16px",
                                                    fontWeight: "600",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {group.group_name}
                                            </div>
                                            <div style={{ display: "flex", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                                                {group.activity && (
                                                    <span
                                                        style={{
                                                            fontSize: "12px",
                                                            padding: "2px 8px",
                                                            borderRadius: "10px",
                                                            backgroundColor: "rgba(255, 255, 255, 0.06)",
                                                            color: "#94a3b8",
                                                        }}
                                                    >
                                                        {group.activity}
                                                    </span>
                                                )}
                                                {group.age_group && (
                                                    <span
                                                        style={{
                                                            fontSize: "12px",
                                                            padding: "2px 8px",
                                                            borderRadius: "10px",
                                                            backgroundColor: "rgba(255, 255, 255, 0.06)",
                                                            color: "#94a3b8",
                                                        }}
                                                    >
                                                        {group.age_group}
                                                    </span>
                                                )}
                                                {group.sub_group && (
                                                    <span
                                                        style={{
                                                            fontSize: "12px",
                                                            padding: "2px 8px",
                                                            borderRadius: "10px",
                                                            backgroundColor: "rgba(255, 255, 255, 0.06)",
                                                            color: "#94a3b8",
                                                        }}
                                                    >
                                                        {group.sub_group}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                                        <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                                            {members.length} member{members.length === 1 ? "" : "s"}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => toggleExpand(group.id)}
                                            style={{
                                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                                background: "rgba(255, 255, 255, 0.04)",
                                                color: "#e2e8f0",
                                                borderRadius: "8px",
                                                padding: "7px 12px",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                cursor: "pointer",
                                            }}
                                        >
                                            {isExpanded ? "Hide members" : "Show members"}
                                        </button>
                                        <Link
                                            href={`/dashboard/group/${group.id}`}
                                            style={{
                                                padding: "7px 14px",
                                                borderRadius: "8px",
                                                background: "rgba(198, 255, 61, 0.12)",
                                                color: "#c6ff3d",
                                                fontSize: "12px",
                                                fontWeight: "700",
                                                textDecoration: "none",
                                            }}
                                        >
                                            Open group →
                                        </Link>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div
                                        style={{
                                            borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                                            padding: "14px 20px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "8px",
                                            backgroundColor: "rgba(255, 255, 255, 0.02)",
                                        }}
                                    >
                                        {members.length === 0 ? (
                                            <span style={{ fontSize: "13px", color: "#64748b" }}>
                                                No members in this group yet.
                                            </span>
                                        ) : (
                                            members.map((m) => (
                                                <div
                                                    key={m.id}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        fontSize: "13px",
                                                        color: "#e2e8f0",
                                                        padding: "4px 0",
                                                    }}
                                                >
                                                    <span>{memberName(m)}</span>
                                                    <span style={{ color: "#94a3b8" }}>{m.role || "Member"}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-box">
                    <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <h2>No groups yet</h2>
                    <p>Create your first group or add more members from an Excel file.</p>
                </div>
            )}
        </section>
    );
}
