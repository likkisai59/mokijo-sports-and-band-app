"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { Building2, Search, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function AllClubsPage() {
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [errorMessage, setErrorMessage] = useState("");

    const fetchAllClubs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/superadmin/all-clubs`);
            if (res.ok) {
                const data = await res.json();
                setClubs(data || []);
            } else {
                setErrorMessage("Failed to load clubs directory.");
            }
        } catch (err) {
            console.error("Error fetching all clubs:", err);
            setErrorMessage("Could not connect to server to fetch clubs directory.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllClubs();
    }, []);

    const filteredClubs = clubs.filter((club) => {
        const query = searchTerm.toLowerCase();
        const matchesSearch =
            (club.club_name || "").toLowerCase().includes(query) ||
            (club.first_name || "").toLowerCase().includes(query) ||
            (club.last_name || "").toLowerCase().includes(query) ||
            (club.email || "").toLowerCase().includes(query) ||
            (club.sport || "").toLowerCase().includes(query);

        const status = club.approval_status || "APPROVED";
        if (filterStatus === "pending") return matchesSearch && status === "PENDING_APPROVAL";
        if (filterStatus === "approved") return matchesSearch && (status === "APPROVED" || status === "");
        if (filterStatus === "rejected") return matchesSearch && status === "REJECTED";
        return matchesSearch;
    });

    const getStatusBadge = (status) => {
        const st = status || "APPROVED";
        if (st === "PENDING_APPROVAL") {
            return (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", padding: "4px 10px", borderRadius: "14px", fontSize: "12px", fontWeight: "600" }}>
                    <Clock size={14} /> Pending Approval
                </span>
            );
        }
        if (st === "REJECTED") {
            return (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(239, 68, 68, 0.15)", color: "#f87171", padding: "4px 10px", borderRadius: "14px", fontSize: "12px", fontWeight: "600" }}>
                    <XCircle size={14} /> Rejected
                </span>
            );
        }
        return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", padding: "4px 10px", borderRadius: "14px", fontSize: "12px", fontWeight: "600" }}>
                <CheckCircle2 size={14} /> Active
            </span>
        );
    };

    return (
        <div style={{ padding: "8px 0", color: "#f8fafc" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 6px 0", color: "#ffffff", display: "flex", alignItems: "center", gap: "10px" }}>
                        <Building2 size={24} style={{ color: "#818cf8" }} />
                        <span>All Sports Clubs Directory</span>
                    </h1>
                    <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>
                        Complete platform directory of all registered sports clubs and their admin status.
                    </p>
                </div>
                <div
                    style={{
                        background: "rgba(99, 102, 241, 0.15)",
                        border: "1px solid rgba(99, 102, 241, 0.3)",
                        color: "#a5b4fc",
                        padding: "6px 16px",
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: "600",
                    }}
                >
                    {clubs.length} Total Registered
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "260px", position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: "14px", top: "12px", color: "#64748b" }} />
                    <input
                        type="text"
                        placeholder="Search by club, admin, email, or sport..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "10px 14px 10px 40px",
                            backgroundColor: "#0f0f1a",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "8px",
                            color: "#ffffff",
                            fontSize: "14px",
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                    {["all", "pending", "approved", "rejected"].map((st) => (
                        <button
                            key={st}
                            type="button"
                            onClick={() => setFilterStatus(st)}
                            style={{
                                padding: "8px 14px",
                                borderRadius: "8px",
                                border: filterStatus === st ? "1px solid #6366f1" : "1px solid rgba(255, 255, 255, 0.1)",
                                background: filterStatus === st ? "rgba(99, 102, 241, 0.2)" : "#0f0f1a",
                                color: filterStatus === st ? "#818cf8" : "#94a3b8",
                                fontSize: "13px",
                                fontWeight: "600",
                                cursor: "pointer",
                                textTransform: "capitalize",
                            }}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </div>

            {errorMessage && (
                <div
                    style={{
                        backgroundColor: "rgba(239, 68, 68, 0.12)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        color: "#f87171",
                        padding: "12px 18px",
                        borderRadius: "10px",
                        marginBottom: "20px",
                        fontSize: "14px",
                    }}
                >
                    {errorMessage}
                </div>
            )}

            {/* Data Table */}
            <div
                style={{
                    background: "#0f0f1a",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    overflow: "hidden",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
                }}
            >
                {loading ? (
                    <div style={{ padding: "50px", textAlign: "center", color: "#94a3b8" }}>
                        Loading clubs directory...
                    </div>
                ) : filteredClubs.length === 0 ? (
                    <div style={{ padding: "60px 20px", textAlign: "center" }}>
                        <Building2 size={48} style={{ color: "#334155", marginBottom: "12px" }} />
                        <h3 style={{ fontSize: "17px", color: "#f1f5f9", margin: "0 0 6px 0" }}>No Clubs Found</h3>
                        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                            No clubs matched your search or status filter.
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#161624", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#94a3b8" }}>
                                    <th style={{ padding: "14px 18px" }}>Club Name</th>
                                    <th style={{ padding: "14px 18px" }}>Admin Contact</th>
                                    <th style={{ padding: "14px 18px" }}>Sport</th>
                                    <th style={{ padding: "14px 18px" }}>Location</th>
                                    <th style={{ padding: "14px 18px" }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClubs.map((club) => (
                                    <tr
                                        key={club.id}
                                        style={{
                                            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                                            transition: "background 0.2s",
                                        }}
                                    >
                                        <td style={{ padding: "16px 18px", fontWeight: "600", color: "#ffffff" }}>
                                            <div>{club.club_name || "Unnamed Club"}</div>
                                            <span style={{ fontSize: "12px", color: "#64748b" }}>ID: MKJ-{club.id}</span>
                                        </td>
                                        <td style={{ padding: "16px 18px", color: "#f1f5f9" }}>
                                            <div>{club.first_name} {club.last_name}</div>
                                            <div style={{ fontSize: "12px", color: "#94a3b8" }}>{club.email}</div>
                                        </td>
                                        <td style={{ padding: "16px 18px", color: "#a5b4fc" }}>
                                            <span style={{ background: "rgba(99, 102, 241, 0.15)", padding: "3px 10px", borderRadius: "12px", fontSize: "13px" }}>
                                                {club.sport || "N/A"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "16px 18px", color: "#94a3b8" }}>
                                            {club.state || "N/A"}, {club.country || "N/A"}
                                        </td>
                                        <td style={{ padding: "16px 18px" }}>
                                            {getStatusBadge(club.approval_status)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
