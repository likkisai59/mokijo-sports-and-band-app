"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { CheckCircle2, Building2, Search, ShieldCheck } from "lucide-react";

export default function ApprovedClubsPage() {
    const [approvedClubs, setApprovedClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const fetchApprovedClubs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/superadmin/approved-clubs`);
            if (res.ok) {
                const data = await res.json();
                setApprovedClubs(data || []);
            } else {
                setErrorMessage("Failed to load approved clubs.");
            }
        } catch (err) {
            console.error("Error fetching approved clubs:", err);
            setErrorMessage("Could not connect to server to fetch approved clubs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovedClubs();
    }, []);

    const filteredClubs = approvedClubs.filter((club) => {
        const query = searchTerm.toLowerCase();
        return (
            (club.club_name || "").toLowerCase().includes(query) ||
            (club.first_name || "").toLowerCase().includes(query) ||
            (club.last_name || "").toLowerCase().includes(query) ||
            (club.email || "").toLowerCase().includes(query) ||
            (club.sport || "").toLowerCase().includes(query)
        );
    });

    return (
        <div style={{ padding: "8px 0", color: "#f8fafc" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 6px 0", color: "#ffffff", display: "flex", alignItems: "center", gap: "10px" }}>
                        <CheckCircle2 size={24} style={{ color: "#4ade80" }} />
                        <span>Approved Clubs</span>
                    </h1>
                    <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>
                        Active sports clubs approved by Super Admin. These Club Admins have full access to log in and manage members.
                    </p>
                </div>
                <div
                    style={{
                        background: "rgba(34, 197, 94, 0.15)",
                        border: "1px solid rgba(34, 197, 94, 0.3)",
                        color: "#4ade80",
                        padding: "6px 16px",
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: "600",
                    }}
                >
                    {approvedClubs.length} Active Clubs
                </div>
            </div>

            {/* Search Input */}
            <div style={{ marginBottom: "20px", maxWidth: "380px", position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: "14px", top: "12px", color: "#64748b" }} />
                <input
                    type="text"
                    placeholder="Search by club name, admin, email, or sport..."
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
                        Loading approved clubs...
                    </div>
                ) : filteredClubs.length === 0 ? (
                    <div style={{ padding: "60px 20px", textAlign: "center" }}>
                        <Building2 size={48} style={{ color: "#334155", marginBottom: "12px" }} />
                        <h3 style={{ fontSize: "17px", color: "#f1f5f9", margin: "0 0 6px 0" }}>No Approved Clubs Found</h3>
                        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                            {searchTerm ? "No clubs match your search query." : "Approved clubs will appear here once accepted."}
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#161624", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#94a3b8" }}>
                                    <th style={{ padding: "14px 18px" }}>Club Name</th>
                                    <th style={{ padding: "14px 18px" }}>Admin Name</th>
                                    <th style={{ padding: "14px 18px" }}>Contact Email</th>
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
                                            {club.first_name} {club.last_name}
                                        </td>
                                        <td style={{ padding: "16px 18px", color: "#94a3b8" }}>
                                            <div>{club.email}</div>
                                            <div style={{ fontSize: "12px", color: "#64748b" }}>{club.phone}</div>
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
                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                    background: "rgba(34, 197, 94, 0.15)",
                                                    color: "#4ade80",
                                                    padding: "4px 10px",
                                                    borderRadius: "14px",
                                                    fontSize: "12px",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                <ShieldCheck size={14} /> Active
                                            </span>
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
