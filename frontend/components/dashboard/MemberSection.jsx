"use client";

import { API_BASE_URL } from "@/lib/api";
import { useState, useEffect } from "react";
import { Edit2, Trash2, Users, Search, Filter } from "lucide-react";
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
              setMembers([]);
            }
          } else {
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
    if (confirm(`Are you sure you want to remove member "${memberName}" from the team?`)) {
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

  const membersByGroup = (() => {
    const map = new Map();
    filteredMembers.forEach((m) => {
      const name = (m.group_name || "").trim() || "Ungrouped";
      if (!map.has(name)) map.set(name, []);
      map.get(name).push(m);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  })();

  const getRoleBadgeStyle = (role) => {
    const r = (role || "").toLowerCase();
    if (r === "coach") {
      return { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" };
    }
    if (r === "captain") {
      return { bg: "#fef3c7", text: "#b45309", border: "#fde68a" };
    }
    return { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" };
  };

  return (
    <div style={{ width: "100%", padding: "24px 32px", display: "flex", flexDirection: "column", gap: "28px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* ── TOP HERO HEADER & CONTROLS ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "9999px",
              backgroundColor: "#0a0a0f",
              color: "#c6ff3d",
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              width: "fit-content",
            }}
          >
            <Users size={12} />
            <span>Club Roster & Squads</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em", margin: 0 }}>
            Team Members Directory
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0, fontWeight: 500 }}>
            Manage active club squads, assign member roles, and view player rosters.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "10px 16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search member, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                fontSize: "13px",
                fontWeight: 600,
                color: "#0f172a",
                backgroundColor: "transparent",
                width: "220px",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "6px 14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <Filter size={14} color="#64748b" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                fontSize: "13px",
                fontWeight: 700,
                color: "#0f172a",
                backgroundColor: "transparent",
                cursor: "pointer",
                padding: "4px 0",
              }}
            >
              <option value="All">All Roles</option>
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      {loading ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            padding: "48px",
            textAlign: "center",
            color: "#64748b",
            fontWeight: 600,
            border: "1px solid #e2e8f0",
          }}
        >
          Loading team roster data...
        </div>
      ) : membersByGroup.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {membersByGroup.map(([groupName, groupMembers]) => (
            <div
              key={groupName}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "24px",
                border: "1px solid rgba(10, 10, 15, 0.08)",
                boxShadow: "0 2px 14px rgba(0, 0, 0, 0.02)",
                overflow: "hidden",
              }}
            >
              {/* Group Header Card */}
              <div
                style={{
                  padding: "18px 24px",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#ffffff",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "10px",
                      backgroundColor: "#0a0a0f",
                      color: "#c6ff3d",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "14px",
                    }}
                  >
                    {groupName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                      {groupName}
                    </h3>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                      Active Squad
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    backgroundColor: "#f1f5f9",
                    color: "#0f172a",
                    fontSize: "12px",
                    fontWeight: 800,
                  }}
                >
                  {groupMembers.length} {groupMembers.length === 1 ? "Player" : "Players"}
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                        color: "#64748b",
                        fontSize: "11px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                      }}
                    >
                      <th style={{ padding: "14px 24px" }}>First Name</th>
                      <th style={{ padding: "14px 24px" }}>Last Name</th>
                      <th style={{ padding: "14px 24px" }}>Email</th>
                      <th style={{ padding: "14px 24px" }}>Phone Number</th>
                      <th style={{ padding: "14px 24px" }}>Role</th>
                      {!isMember && (
                        <th style={{ padding: "14px 24px", textAlign: "right" }}>Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {groupMembers.map((member, idx) => {
                      const roleStyle = getRoleBadgeStyle(member.role);
                      return (
                        <tr
                          key={member.id || idx}
                          style={{
                            borderBottom: idx === groupMembers.length - 1 ? "none" : "1px solid #f1f5f9",
                            transition: "background 0.15s ease",
                          }}
                        >
                          <td style={{ padding: "16px 24px", color: "#0f172a", fontWeight: 800, fontSize: "14px" }}>
                            {member.first_name || "-"}
                          </td>
                          <td style={{ padding: "16px 24px", color: "#0f172a", fontWeight: 700, fontSize: "14px" }}>
                            {member.last_name || "-"}
                          </td>
                          <td style={{ padding: "16px 24px", color: "#64748b", fontWeight: 500, fontSize: "13px" }}>
                            {member.email || "-"}
                          </td>
                          <td style={{ padding: "16px 24px", color: "#64748b", fontWeight: 600, fontSize: "13px" }}>
                            {member.phone || "-"}
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "4px 10px",
                                borderRadius: "9999px",
                                backgroundColor: roleStyle.bg,
                                color: roleStyle.text,
                                border: `1px solid ${roleStyle.border}`,
                                fontSize: "11px",
                                fontWeight: 800,
                                textTransform: "capitalize",
                              }}
                            >
                              {member.role || "Player"}
                            </span>
                          </td>
                          {!isMember && (
                            <td style={{ padding: "16px 24px", textAlign: "right" }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                                <button
                                  type="button"
                                  onClick={() => router.push(`/dashboard/members/${member.id}/edit`)}
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "8px",
                                    backgroundColor: "#f8fafc",
                                    border: "1px solid #e2e8f0",
                                    color: "#0f172a",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                  }}
                                  title="Edit Member"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteMember(
                                      member.id,
                                      `${member.first_name} ${member.last_name || ""}`
                                    )
                                  }
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "8px",
                                    backgroundColor: "#fef2f2",
                                    border: "1px solid #fee2e2",
                                    color: "#ef4444",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                  }}
                                  title="Delete Member"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            border: "1px solid #e2e8f0",
            padding: "48px 32px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "16px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
            }}
          >
            <Users size={24} />
          </div>
          <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            No squad members found
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0, maxWidth: "360px" }}>
            {isMember
              ? "You have not been assigned to a club group squad yet."
              : "No members found matching your search or filter."}
          </p>
        </div>
      )}
    </div>
  );
}
