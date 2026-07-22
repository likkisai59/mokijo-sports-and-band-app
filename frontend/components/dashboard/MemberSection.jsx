"use client";
import { API_BASE_URL } from "@/lib/api";

import { useState, useEffect, useMemo } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

const TEAM_ROSTER_ROLES = new Set(["player", "member", "club admin", "club_admin", "admin", ""]);

function normalizeRole(role) {
    return String(role || "").trim().toLowerCase();
}

function isTeamRosterRole(role) {
    const r = normalizeRole(role);
    if (TEAM_ROSTER_ROLES.has(r)) return true;
    // Treat missing/unknown member roles as roster players (default club members)
    if (!r || r === "null" || r === "undefined") return true;
    // Exclude external onboarding roles
    if (["parent", "guardian", "coach", "referee", "refree", "trainer"].includes(r)) return false;
    return false;
}

export default function MemberSection() {
    const router = useRouter();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [groupFilter, setGroupFilter] = useState("all");

    const isMember = typeof window !== "undefined" ? localStorage.getItem("isMember") === "true" : false;
    const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") : "";

    useEffect(() => {
        const fetchAllMembers = async () => {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(`${API_BASE_URL}/members?owner_id=${userId}`);
                if (response.ok) {
                    const data = await response.json();

                    if (isMember) {
                        const currentMember = data.find((m) => m.email?.toLowerCase() === userEmail?.toLowerCase());
                        if (currentMember && currentMember.group_id) {
                            const teammates = data.filter((m) => m.group_id === currentMember.group_id);
                            setMembers(teammates);
                        } else {
                            setMembers(data);
                        }
                    } else {
                        const storedName = localStorage.getItem("userName") || "Admin";
                        const adminMember = {
                            id: "admin",
                            first_name: storedName.split(" ")[0] || storedName,
                            last_name: storedName.split(" ")[1] || "",
                            email: "Admin Email",
                            role: "Club Admin",
                            group_name: "All Groups",
                        };
                        const rosterOnly = (Array.isArray(data) ? data : []).filter((m) =>
                            isTeamRosterRole(m.role)
                        );
                        setMembers([adminMember, ...rosterOnly]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch all members:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllMembers();
    }, [isMember, userEmail]);

    const roleOptions = useMemo(() => {
        const roles = new Set();
        members.forEach((m) => {
            if (m.role) roles.add(m.role);
        });
        return ["all", ...Array.from(roles).sort()];
    }, [members]);

    const groupOptions = useMemo(() => {
        const groups = new Set();
        members.forEach((m) => {
            const g = m.group_name || "Ungrouped";
            groups.add(g);
        });
        return ["all", ...Array.from(groups).sort((a, b) => a.localeCompare(b))];
    }, [members]);

    const handleDeleteMember = async (memberId, memberName) => {
        if (confirm(`Are you sure you want to delete team member "${memberName}"?`)) {
            try {
                const response = await fetch(`${API_BASE_URL}/members/${memberId}`, {
                    method: "DELETE",
                });
                if (response.ok) {
                    setMembers((prev) => prev.filter((m) => m.id !== memberId));
                } else {
                    const err = await response.json().catch(() => ({}));
                    alert(err.detail || "Failed to delete team member");
                }
            } catch (error) {
                console.error("Error deleting member:", error);
                alert("Error deleting team member");
            }
        }
    };

    const filteredMembers = members.filter((m) => {
        const q = search.toLowerCase();
        const groupName = m.group_name || "Ungrouped";
        const matchesSearch =
            (m.first_name || "").toLowerCase().includes(q) ||
            (m.last_name || "").toLowerCase().includes(q) ||
            (m.email || "").toLowerCase().includes(q) ||
            (m.phone || "").toLowerCase().includes(q) ||
            groupName.toLowerCase().includes(q) ||
            (m.role || "").toLowerCase().includes(q);
        const matchesRole = roleFilter === "all" || (m.role || "") === roleFilter;
        const matchesGroup = groupFilter === "all" || groupName === groupFilter;
        return matchesSearch && matchesRole && matchesGroup;
    });

    const groupedMembers = useMemo(() => {
        const map = new Map();
        filteredMembers.forEach((m) => {
            const key = m.group_name || "Ungrouped";
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(m);
        });
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [filteredMembers]);

    const renderMemberRow = (member, index) => (
        <tr
            key={member.id ?? index}
            style={{
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                backgroundColor: "transparent",
            }}
        >
            <td style={{ padding: "16px", color: "#f1f5f9", fontSize: "15px", fontWeight: "500" }}>
                {member.first_name}
            </td>
            <td style={{ padding: "16px", color: "#f1f5f9", fontSize: "15px" }}>{member.last_name || "-"}</td>
            <td style={{ padding: "16px", color: "#94a3b8", fontSize: "15px" }}>{member.email || "-"}</td>
            <td style={{ padding: "16px", color: "#94a3b8", fontSize: "15px" }}>{member.phone || "-"}</td>
            <td style={{ padding: "16px" }}>
                <span
                    style={{
                        fontSize: "13px",
                        padding: "4px 10px",
                        backgroundColor:
                            member.role === "Club Admin" ? "rgba(191, 254, 0, 0.12)" : "rgba(255, 255, 255, 0.06)",
                        color: member.role === "Club Admin" ? "#bffe00" : "#94a3b8",
                        borderRadius: "12px",
                        fontWeight: "500",
                    }}
                >
                    {member.role || "Player"}
                </span>
            </td>
            <td style={{ padding: "16px" }}>
                <span
                    style={{
                        fontSize: "13px",
                        padding: "4px 10px",
                        backgroundColor: "rgba(255, 255, 255, 0.06)",
                        color: "#94a3b8",
                        borderRadius: "12px",
                        fontWeight: "500",
                    }}
                >
                    {member.group_name || "-"}
                </span>
            </td>
            {!isMember && (
                <td style={{ padding: "16px", textAlign: "center" }}>
                    {member.role !== "Club Admin" && (
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
                                }}
                                title="Edit Team Member"
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
                                }}
                                title="Delete Team Member"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                </td>
            )}
        </tr>
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
                <span>Team Members</span>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    {!isMember && (
                        <select
                            value={groupFilter}
                            onChange={(e) => setGroupFilter(e.target.value)}
                            aria-label="Filter by group"
                            style={{
                                backgroundColor: "rgba(255, 255, 255, 0.04)",
                                borderRadius: "10px",
                                padding: "8px 12px",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                color: "#f1f5f9",
                                fontSize: "14px",
                            }}
                        >
                            {groupOptions.map((group) => (
                                <option key={group} value={group}>
                                    {group === "all" ? "All groups" : group}
                                </option>
                            ))}
                        </select>
                    )}
                    {!isMember && (
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            aria-label="Filter by role"
                            style={{
                                backgroundColor: "rgba(255, 255, 255, 0.04)",
                                borderRadius: "10px",
                                padding: "8px 12px",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                color: "#f1f5f9",
                                fontSize: "14px",
                            }}
                        >
                            {roleOptions.map((role) => (
                                <option key={role} value={role}>
                                    {role === "all" ? "All roles" : role}
                                </option>
                            ))}
                        </select>
                    )}
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
                            placeholder="Search team members..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                border: "none",
                                outline: "none",
                                background: "transparent",
                                fontSize: "14px",
                                color: "#f1f5f9",
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
                    Loading team members list...
                </div>
            ) : filteredMembers.length > 0 ? (
                <div style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    {groupedMembers.map(([groupName, groupRows]) => (
                        <div
                            key={groupName}
                            className="members-table-container"
                            style={{
                                width: "100%",
                                backgroundColor: "rgba(15, 15, 26, 0.85)",
                                borderRadius: "12px",
                                border: "1px solid rgba(255, 255, 255, 0.07)",
                                overflow: "visible",
                            }}
                        >
                            <div
                                style={{
                                    padding: "12px 16px",
                                    borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
                                    color: "#bffe00",
                                    fontWeight: 700,
                                    fontSize: "14px",
                                }}
                            >
                                {groupName} ({groupRows.length})
                            </div>
                            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
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
                                        <th style={{ padding: "16px", fontWeight: "600", color: "#94a3b8", fontSize: "14px" }}>
                                            Group
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
                                <tbody>{groupRows.map((member, index) => renderMemberRow(member, index))}</tbody>
                            </table>
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
                    <h2>No team members found</h2>
                    <p>
                        {isMember
                            ? "You have not been assigned to a group squad yet."
                            : "Import groups with team members or add team members manually to see them here."}
                    </p>
                </div>
            )}
        </section>
    );
}
