"use client";

import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Plus, Users, FileSpreadsheet, ChevronDown, ChevronUp, Search, UserCheck } from "lucide-react";
import "@/app/styles/groups.css";

export default function GroupsPage() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [expandedGroupId, setExpandedGroupId] = useState(null);

    useEffect(() => {
        const fetchGroups = async () => {
            const userId = localStorage.getItem("userId");
            const token = localStorage.getItem("accessToken");
            if (!userId) {
                setLoading(false);
                return;
            }
            try {
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await fetch(`${API_BASE_URL}/groups?owner_id=${userId}`, { headers });
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

    const totalMembers = groups.reduce((acc, g) => acc + (g.members?.length || 0), 0);

    return (
        <div className="groups-page-wrapper">
            {/* Control Center Hero Banner */}
            <div className="groups-header">
                <div>
                    <div className="brand-pill-badge">
                        <Sparkles size={13} />
                        <span>MUKIJO • SQUAD & GROUPS CONTROL HUB</span>
                    </div>
                    <h1>Club Squads & Member Groups</h1>
                    <p>Manage team rosters, player age brackets, sport divisions, and member import workflows.</p>
                </div>
                <div className="header-status-chip">
                    <span className="status-live-dot" />
                    <span>{groups.length} Squad Group{groups.length === 1 ? "" : "s"} Active</span>
                </div>
            </div>

            {/* Search Toolbar & Action Launchpad */}
            <div className="groups-toolbar">
                <div className="search-box">
                    <Search size={16} color="#94a3b8" />
                    <input
                        type="text"
                        placeholder="Search by group name, activity, age group..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="toolbar-actions">
                    <Link href="/dashboard/importgroups" className="btn-import-group">
                        <FileSpreadsheet size={15} />
                        <span>Import Excel Members</span>
                    </Link>
                    <Link href="/dashboard/creategroup" className="btn-create-group">
                        <Plus size={15} />
                        <span>+ Create Group</span>
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="groups-empty-card" style={{ padding: "48px 24px" }}>
                    <div
                        className="vd-spinner"
                        style={{ width: "36px", height: "36px", borderWidth: "3px", margin: "0 auto 14px" }}
                    />
                    <p style={{ color: "#64748b", fontSize: "14px", fontWeight: "600" }}>Loading squad directory…</p>
                </div>
            ) : filteredGroups.length > 0 ? (
                <div className="groups-list">
                    {filteredGroups.map((group) => {
                        const members = group.members || [];
                        const isExpanded = expandedGroupId === group.id;
                        return (
                            <div key={group.id} className="group-card">
                                <div className="group-card-header">
                                    <div className="group-info-col">
                                        <div className="group-avatar">
                                            {(group.group_name || "G").charAt(0).toUpperCase()}
                                        </div>
                                        <div className="group-details">
                                            <div className="group-name">{group.group_name}</div>
                                            <div className="group-tags">
                                                {group.activity && (
                                                    <span className="activity-tag">{group.activity}</span>
                                                )}
                                                {group.age_group && (
                                                    <span className="subtag">{group.age_group}</span>
                                                )}
                                                {group.sub_group && (
                                                    <span className="subtag">{group.sub_group}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="group-actions-col">
                                        <div className="member-count-chip">
                                            {members.length} Member{members.length === 1 ? "" : "s"}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleExpand(group.id)}
                                            className="btn-expand-members"
                                        >
                                            {isExpanded ? (
                                                <>
                                                    <span>Hide Members</span>
                                                    <ChevronUp size={14} />
                                                </>
                                            ) : (
                                                <>
                                                    <span>Show Members</span>
                                                    <ChevronDown size={14} />
                                                </>
                                            )}
                                        </button>
                                        <Link
                                            href={`/dashboard/group/${group.id}`}
                                            className="btn-open-group"
                                        >
                                            <span>Open Group</span>
                                            <span>→</span>
                                        </Link>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="members-drawer">
                                        {members.length === 0 ? (
                                            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                                                No members in this squad group yet. Click "Import Excel Members" or open group settings.
                                            </span>
                                        ) : (
                                            members.map((m) => (
                                                <div key={m.id} className="member-row">
                                                    <div className="member-left">
                                                        <div className="member-avatar">
                                                            {(m.first_name || m.email || "?")[0].toUpperCase()}
                                                        </div>
                                                        <span style={{ fontWeight: "600" }}>{memberName(m)}</span>
                                                    </div>
                                                    <span className="member-role-badge">{m.role || "Member"}</span>
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
                <div className="groups-empty-card">
                    <Users size={48} strokeWidth={1.5} />
                    <h2>No Squad Groups Found</h2>
                    <p>Create your first squad group or add members using an Excel import file.</p>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "20px" }}>
                        <Link href="/dashboard/creategroup" className="btn-create-group">
                            <Plus size={15} />
                            <span>+ Create Group</span>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
