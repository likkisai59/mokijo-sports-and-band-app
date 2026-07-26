"use client";
import { API_BASE_URL } from "@/lib/api";

import { useState, useEffect } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function MemberSection() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    const isMember = typeof window !== "undefined" ? localStorage.getItem("isMember") === "true" : false;
    const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") : "";
    const groupParam = searchParams.get("group");

    useEffect(() => {
        const fetchAllMembers = async () => {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                setLoading(false);
                return;
            }
            try {
                const token = localStorage.getItem("accessToken");
                const response = await fetch(`${API_BASE_URL}/members?owner_id=${userId}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (response.ok) {
                    const data = await response.json();

                    if (isMember) {
                        // Members (players/parents/coaches) only ever see their own group's roster.
                        const emailClean = (userEmail || "").trim().toLowerCase();
                        const currentMember = data.find(
                            (m) => (m.email || "").trim().toLowerCase() === emailClean
                        );
                        const fallbackGroupName = localStorage.getItem("memberGroupName") || "";
                        const scopedGroupName = (groupParam || fallbackGroupName || "").trim().toLowerCase();

                        if (currentMember?.group_id && !groupParam) {
                            setMembers(data.filter((m) => m.group_id === currentMember.group_id));
                        } else if (scopedGroupName) {
                            setMembers(
                                data.filter((m) => (m.group_name || "").trim().toLowerCase() === scopedGroupName)
                            );
                        } else {
                            // No reliable group signal - do not leak the full club roster.
                            setMembers([]);
                        }
                    } else {
                        // Only surface members who actually have a group/roster assignment,
                        // not a random dump of every role in the system.
                        const rosteredMembers = data.filter((m) => m.group_id);
                        setMembers(rosteredMembers);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch all members:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllMembers();
    }, [isMember, userEmail, groupParam]);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");

    const DEFAULT_ROLE_OPTIONS = ["Player", "Coach", "Parent", "Referee"];
    const EXCLUDED_ROLES = new Set(["Trainer", "Member"]);
    const roleOptions = Array.from(
        new Set([
            ...DEFAULT_ROLE_OPTIONS,
            ...members.map((m) => m.role).filter((r) => r && !EXCLUDED_ROLES.has(r)),
        ])
    );

    const handleDeleteMember = async (memberId, memberName) => {
        if (confirm(`Are you sure you want to delete member "${memberName}"?`)) {
            try {
                const token = localStorage.getItem("accessToken");
                const userId = localStorage.getItem("userId");
                const response = await fetch(`${API_BASE_URL}/members/${memberId}?owner_id=${userId}`, {
                    method: "DELETE",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (response.ok) {
                    setMembers((prev) => prev.filter((m) => m.id !== memberId));
                } else {
                    alert("Failed to delete member");
                }
            } catch (error) {
                console.error("Error deleting member:", error);
                alert("Error deleting member");
            }
        }
    };

    const filteredMembers = members.filter((m) => {
        const q = search.toLowerCase();
        const matchesSearch =
            (m.first_name || "").toLowerCase().includes(q) ||
            (m.last_name || "").toLowerCase().includes(q) ||
            (m.email || "").toLowerCase().includes(q) ||
            (m.phone || "").toLowerCase().includes(q) ||
            (m.group_name || "").toLowerCase().includes(q);

        const matchesRole = roleFilter === "All" || (m.role || "").toLowerCase() === roleFilter.toLowerCase();

        return matchesSearch && matchesRole;
    });

    // Club admin view: Group Name → member list, Group Name → member list
    const membersByGroup = (() => {
        const map = new Map();
        filteredMembers.forEach((m) => {
            const name = (m.group_name || "").trim() || "Ungrouped";
            if (!map.has(name)) map.set(name, []);
            map.get(name).push(m);
        });
        return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    })();

    const renderMemberRows = (list) =>
        list.map((member) => (
            <tr
                key={member.id}
                style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                    backgroundColor: "transparent",
                }}
            >
                <td
                    style={{
                        padding: "16px",
                        color: "#f4f4f5",
                        fontSize: "15px",
                        fontWeight: "500",
                    }}
                >
                    {member.first_name}
                </td>
                <td style={{ padding: "16px", color: "#f4f4f5", fontSize: "15px" }}>
                    {member.last_name || "-"}
                </td>
                <td style={{ padding: "16px", color: "#94a3b8", fontSize: "15px" }}>
                    {member.email || "-"}
                </td>
                <td style={{ padding: "16px", color: "#94a3b8", fontSize: "15px" }}>
                    {member.phone || "-"}
                </td>
                <td style={{ padding: "16px" }}>
                    <span
                        style={{
                            fontSize: "13px",
                            padding: "4px 10px",
                            backgroundColor: "rgba(99, 179, 237, 0.12)",
                            color: "#7dd3fc",
                            borderRadius: "12px",
                            fontWeight: "500",
                        }}
                    >
                        {member.role || "Member"}
                    </span>
                </td>
                {!isMember && (
                    <td style={{ padding: "16px", textAlign: "center" }}>
                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <button
                                onClick={() => router.push(`/dashboard/members/${member.id}/edit`)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#94a3b8",
                                    padding: "6px",
                                    borderRadius: "6px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s ease",
                                }}
                                title="Edit Member"
                                onMouseOver={(e) => {
                                    e.currentTarget.style.color = "#c6ff3d";
                                    e.currentTarget.style.backgroundColor = "rgba(198, 255, 61, 0.1)";
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.color = "#94a3b8";
                                    e.currentTarget.style.backgroundColor = "transparent";
                                }}
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() =>
                                    handleDeleteMember(
                                        member.id,
                                        `${member.first_name} ${member.last_name || ""}`
                                    )
                                }
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#94a3b8",
                                    padding: "6px",
                                    borderRadius: "6px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s ease",
                                }}
                                title="Delete Member"
                                onMouseOver={(e) => {
                                    e.currentTarget.style.color = "#ef4444";
                                    e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.12)";
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.color = "#94a3b8";
                                    e.currentTarget.style.backgroundColor = "transparent";
                                }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </td>
                )}
            </tr>
        ));

    const tableHeader = (
        <thead
            style={{
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
            }}
        >
            <tr>
                <th style={{ padding: "16px", fontWeight: "600", color: "#94a3b8", fontSize: "14px" }}>
                    First Name
                </th>
                <th style={{ padding: "16px", fontWeight: "600", color: "#94a3b8", fontSize: "14px" }}>
                    Last Name
                </th>
                <th style={{ padding: "16px", fontWeight: "600", color: "#94a3b8", fontSize: "14px" }}>
                    Email
                </th>
                <th style={{ padding: "16px", fontWeight: "600", color: "#94a3b8", fontSize: "14px" }}>
                    Phone Number
                </th>
                <th style={{ padding: "16px", fontWeight: "600", color: "#94a3b8", fontSize: "14px" }}>
                    Role
                </th>
                {!isMember && (
                    <th
                        style={{
                            padding: "16px",
                            fontWeight: "600",
                            color: "#94a3b8",
                            fontSize: "14px",
                            textAlign: "center",
                        }}
                    >
                        Actions
                    </th>
                )}
            </tr>
        </thead>
    );

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
                <span>Members</span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        style={{
                            backgroundColor: "rgba(255, 255, 255, 0.04)",
                            borderRadius: "10px",
                            padding: "9px 12px",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            color: "#f4f4f5",
                            fontSize: "14px",
                            outline: "none",
                            cursor: "pointer",
                        }}
                    >
                        <option value="All">All Roles</option>
                        {roleOptions.map((role) => (
                            <option key={role} value={role}>
                                {role}
                            </option>
                        ))}
                    </select>
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
                            placeholder="Search members..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                border: "none",
                                outline: "none",
                                background: "transparent",
                                fontSize: "14px",
                                color: "#f4f4f5",
                                width: "220px",
                            }}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div
                    className="loading-box"
                    style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}
                >
                    Loading members list...
                </div>
            ) : membersByGroup.length > 0 ? (
                <div style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "28px" }}>
                    {membersByGroup.map(([groupName, groupMembers]) => (
                        <div key={groupName}>
                            <h3
                                style={{
                                    margin: "0 0 12px 0",
                                    fontSize: "18px",
                                    fontWeight: 700,
                                    color: "#f4f4f5",
                                    letterSpacing: "0.01em",
                                }}
                            >
                                {groupName}
                            </h3>
                            <div
                                className="members-table-container"
                                style={{
                                    width: "100%",
                                    backgroundColor: "rgba(20, 20, 31, 0.85)",
                                    borderRadius: "12px",
                                    border: "1px solid rgba(255, 255, 255, 0.07)",
                                    overflow: "visible",
                                }}
                            >
                                <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                                    {tableHeader}
                                    <tbody>{renderMemberRows(groupMembers)}</tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-box">
                    <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <h2>No squad members found</h2>
                    <p>
                        {isMember
                            ? "You have not been assigned to a group squad yet."
                            : "Add more members or add members manually to see them here."}
                    </p>
                </div>
            )}
        </section>
    );
}
