"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { CheckCircle2, XCircle, Clock, AlertCircle, Building2 } from "lucide-react";

export default function PendingApprovalsPage() {
    const [pendingClubs, setPendingClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const fetchPendingClubs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/superadmin/pending-clubs`);
            if (res.ok) {
                const data = await res.json();
                setPendingClubs(data || []);
            } else {
                setErrorMessage("Failed to load pending club registration requests.");
            }
        } catch (err) {
            console.error("Error fetching pending clubs:", err);
            setErrorMessage("Could not connect to server to fetch pending clubs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingClubs();
    }, []);

    const handleApprove = async (userId, clubName) => {
        if (!confirm(`Are you sure you want to approve "${clubName}"? The Club Admin will gain immediate login access.`)) {
            return;
        }

        setActionId(userId);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const res = await fetch(`${API_BASE_URL}/superadmin/approve-club/${userId}`, {
                method: "POST",
            });

            if (res.ok) {
                // Dynamically remove approved club from pending list
                setPendingClubs((prev) => prev.filter((c) => c.id !== userId));
                setSuccessMessage(`Successfully approved "${clubName}". Details moved to Approved Clubs.`);
                setTimeout(() => setSuccessMessage(""), 4500);
            } else {
                const errData = await res.json().catch(() => ({}));
                setErrorMessage(errData.detail || "Failed to approve club.");
            }
        } catch (err) {
            console.error("Error approving club:", err);
            setErrorMessage("Server error while approving club.");
        } finally {
            setActionId(null);
        }
    };

    const handleReject = async (userId, clubName) => {
        const reason = prompt(`Enter rejection reason for "${clubName}" (optional):`);
        if (reason === null) return; // User cancelled prompt

        setActionId(userId);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const res = await fetch(`${API_BASE_URL}/superadmin/reject-club/${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason }),
            });

            if (res.ok) {
                // Dynamically remove rejected club from pending list
                setPendingClubs((prev) => prev.filter((c) => c.id !== userId));
                setSuccessMessage(`Registration for "${clubName}" has been rejected.`);
                setTimeout(() => setSuccessMessage(""), 4500);
            } else {
                const errData = await res.json().catch(() => ({}));
                setErrorMessage(errData.detail || "Failed to reject club.");
            }
        } catch (err) {
            console.error("Error rejecting club:", err);
            setErrorMessage("Server error while rejecting club.");
        } finally {
            setActionId(null);
        }
    };

    return (
        <div style={{ padding: "8px 0", color: "#f8fafc" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 6px 0", color: "#ffffff", display: "flex", alignItems: "center", gap: "10px" }}>
                        <Clock size={24} style={{ color: "#fbbf24" }} />
                        <span>Pending Club Approvals</span>
                    </h1>
                    <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>
                        Review new sports club registration requests. Once accepted, the club will move to Approved Clubs.
                    </p>
                </div>
                <div
                    style={{
                        background: "rgba(251, 191, 36, 0.15)",
                        border: "1px solid rgba(251, 191, 36, 0.3)",
                        color: "#fbbf24",
                        padding: "6px 16px",
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: "600",
                    }}
                >
                    {pendingClubs.length} Pending
                </div>
            </div>

            {/* Notifications */}
            {successMessage && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        backgroundColor: "rgba(34, 197, 94, 0.12)",
                        border: "1px solid rgba(34, 197, 94, 0.3)",
                        color: "#4ade80",
                        padding: "12px 18px",
                        borderRadius: "10px",
                        marginBottom: "20px",
                        fontSize: "14px",
                    }}
                >
                    <CheckCircle2 size={18} />
                    <span>{successMessage}</span>
                </div>
            )}

            {errorMessage && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        backgroundColor: "rgba(239, 68, 68, 0.12)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        color: "#f87171",
                        padding: "12px 18px",
                        borderRadius: "10px",
                        marginBottom: "20px",
                        fontSize: "14px",
                    }}
                >
                    <AlertCircle size={18} />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Data Table Container */}
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
                        Loading pending club registrations...
                    </div>
                ) : pendingClubs.length === 0 ? (
                    <div style={{ padding: "60px 20px", textAlign: "center" }}>
                        <Building2 size={48} style={{ color: "#334155", marginBottom: "12px" }} />
                        <h3 style={{ fontSize: "17px", color: "#f1f5f9", margin: "0 0 6px 0" }}>No Pending Approvals</h3>
                        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                            All club registration requests have been reviewed!
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
                                    <th style={{ padding: "14px 18px" }}>Capacity</th>
                                    <th style={{ padding: "14px 18px", textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingClubs.map((club) => (
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
                                        <td style={{ padding: "16px 18px" }}>
                                            <div style={{ color: "#f1f5f9" }}>{club.first_name} {club.last_name}</div>
                                            <div style={{ fontSize: "12px", color: "#94a3b8" }}>{club.email}</div>
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
                                        <td style={{ padding: "16px 18px", color: "#94a3b8" }}>
                                            {club.member_count || "N/A"}
                                        </td>
                                        <td style={{ padding: "16px 18px", textAlign: "right" }}>
                                            <div style={{ display: "inline-flex", gap: "8px" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleApprove(club.id, club.club_name)}
                                                    disabled={actionId === club.id}
                                                    style={{
                                                        background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                                                        color: "#ffffff",
                                                        border: "none",
                                                        padding: "8px 14px",
                                                        borderRadius: "6px",
                                                        fontSize: "13px",
                                                        fontWeight: "600",
                                                        cursor: "pointer",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "4px",
                                                        boxShadow: "0 2px 8px rgba(34, 197, 94, 0.3)",
                                                    }}
                                                >
                                                    <CheckCircle2 size={15} />
                                                    <span>{actionId === club.id ? "Approving..." : "Approve"}</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleReject(club.id, club.club_name)}
                                                    disabled={actionId === club.id}
                                                    style={{
                                                        background: "rgba(239, 68, 68, 0.15)",
                                                        color: "#f87171",
                                                        border: "1px solid rgba(239, 68, 68, 0.3)",
                                                        padding: "8px 14px",
                                                        borderRadius: "6px",
                                                        fontSize: "13px",
                                                        fontWeight: "600",
                                                        cursor: "pointer",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "4px",
                                                    }}
                                                >
                                                    <XCircle size={15} />
                                                    <span>Reject</span>
                                                </button>
                                            </div>
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
