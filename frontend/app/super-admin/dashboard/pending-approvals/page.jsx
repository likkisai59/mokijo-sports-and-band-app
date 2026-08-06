"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { CheckCircle2, XCircle, Clock, AlertCircle, Building2, MapPin, ShieldCheck, UserCheck } from "lucide-react";

export default function PendingApprovalsPage() {
    const [activeTab, setActiveTab] = useState("clubs"); // 'clubs' | 'venue_owners'
    const [pendingClubs, setPendingClubs] = useState([]);
    const [pendingVenueOwners, setPendingVenueOwners] = useState([]);
    const [loadingClubs, setLoadingClubs] = useState(true);
    const [loadingVenueOwners, setLoadingVenueOwners] = useState(true);
    const [actionId, setActionId] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const fetchPendingClubs = async () => {
        setLoadingClubs(true);
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
            setLoadingClubs(false);
        }
    };

    const fetchPendingVenueOwners = async () => {
        setLoadingVenueOwners(true);
        try {
            const res = await fetch(`${API_BASE_URL}/superadmin/pending-venue-owners`);
            if (res.ok) {
                const data = await res.json();
                setPendingVenueOwners(data || []);
            } else {
                setErrorMessage("Failed to load pending venue owner requests.");
            }
        } catch (err) {
            console.error("Error fetching pending venue owners:", err);
            setErrorMessage("Could not connect to server to fetch pending venue owners.");
        } finally {
            setLoadingVenueOwners(false);
        }
    };

    useEffect(() => {
        fetchPendingClubs();
        fetchPendingVenueOwners();
    }, []);

    const handleApproveClub = async (userId, clubName) => {
        if (!confirm(`Are you sure you want to approve "${clubName}"? The Club Admin will gain immediate login access.`)) {
            return;
        }

        setActionId(`club_${userId}`);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const res = await fetch(`${API_BASE_URL}/superadmin/approve-club/${userId}`, {
                method: "POST",
            });

            if (res.ok) {
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

    const handleRejectClub = async (userId, clubName) => {
        const reason = prompt(`Enter rejection reason for "${clubName}" (optional):`);
        if (reason === null) return;

        setActionId(`club_${userId}`);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const res = await fetch(`${API_BASE_URL}/superadmin/reject-club/${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason }),
            });

            if (res.ok) {
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

    const handleApproveVenueOwner = async (ownerId, ownerName) => {
        if (!confirm(`Are you sure you want to approve Venue Owner "${ownerName}"? Account and venues will be activated.`)) {
            return;
        }

        setActionId(`owner_${ownerId}`);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const res = await fetch(`${API_BASE_URL}/superadmin/approve-venue-owner/${ownerId}`, {
                method: "POST",
            });

            if (res.ok) {
                setPendingVenueOwners((prev) => prev.filter((o) => o.id !== ownerId));
                setSuccessMessage(`Successfully approved Venue Owner "${ownerName}".`);
                setTimeout(() => setSuccessMessage(""), 4500);
            } else {
                const errData = await res.json().catch(() => ({}));
                setErrorMessage(errData.detail || "Failed to approve venue owner.");
            }
        } catch (err) {
            console.error("Error approving venue owner:", err);
            setErrorMessage("Server error while approving venue owner.");
        } finally {
            setActionId(null);
        }
    };

    const handleRejectVenueOwner = async (ownerId, ownerName) => {
        const reason = prompt(`Enter rejection reason for Venue Owner "${ownerName}" (optional):`);
        if (reason === null) return;

        setActionId(`owner_${ownerId}`);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const res = await fetch(`${API_BASE_URL}/superadmin/reject-venue-owner/${ownerId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason }),
            });

            if (res.ok) {
                setPendingVenueOwners((prev) => prev.filter((o) => o.id !== ownerId));
                setSuccessMessage(`Registration for Venue Owner "${ownerName}" has been rejected.`);
                setTimeout(() => setSuccessMessage(""), 4500);
            } else {
                const errData = await res.json().catch(() => ({}));
                setErrorMessage(errData.detail || "Failed to reject venue owner.");
            }
        } catch (err) {
            console.error("Error rejecting venue owner:", err);
            setErrorMessage("Server error while rejecting venue owner.");
        } finally {
            setActionId(null);
        }
    };

    const totalPending = pendingClubs.length + pendingVenueOwners.length;

    return (
        <div style={{ padding: "8px 0", color: "#f8fafc" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 6px 0", color: "#ffffff", display: "flex", alignItems: "center", gap: "10px" }}>
                        <Clock size={24} style={{ color: "#fbbf24" }} />
                        <span>Pending Approvals</span>
                    </h1>
                    <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>
                        Review registration requests for Club Admins and Venue Owners before granting platform access.
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
                    {totalPending} Total Pending
                </div>
            </div>

            {/* Sub-Nav Tabs */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "12px" }}>
                <button
                    type="button"
                    onClick={() => setActiveTab("clubs")}
                    style={{
                        background: activeTab === "clubs" ? "rgba(99, 102, 241, 0.2)" : "transparent",
                        color: activeTab === "clubs" ? "#818cf8" : "#94a3b8",
                        border: activeTab === "clubs" ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid transparent",
                        padding: "8px 18px",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <Building2 size={16} />
                    <span>Club Admins ({pendingClubs.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("venue_owners")}
                    style={{
                        background: activeTab === "venue_owners" ? "rgba(198, 255, 61, 0.15)" : "transparent",
                        color: activeTab === "venue_owners" ? "#c6ff3d" : "#94a3b8",
                        border: activeTab === "venue_owners" ? "1px solid rgba(198, 255, 61, 0.3)" : "1px solid transparent",
                        padding: "8px 18px",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <MapPin size={16} />
                    <span>Venue Owners ({pendingVenueOwners.length})</span>
                </button>
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

            {/* TAB 1: CLUB ADMINS */}
            {activeTab === "clubs" && (
                <div
                    style={{
                        background: "#0f0f1a",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "14px",
                        overflow: "hidden",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
                    }}
                >
                    {loadingClubs ? (
                        <div style={{ padding: "50px", textAlign: "center", color: "#94a3b8" }}>
                            Loading pending club registrations...
                        </div>
                    ) : pendingClubs.length === 0 ? (
                        <div style={{ padding: "60px 20px", textAlign: "center" }}>
                            <Building2 size={48} style={{ color: "#334155", marginBottom: "12px" }} />
                            <h3 style={{ fontSize: "17px", color: "#f1f5f9", margin: "0 0 6px 0" }}>No Pending Club Approvals</h3>
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
                                                        onClick={() => handleApproveClub(club.id, club.club_name)}
                                                        disabled={actionId === `club_${club.id}`}
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
                                                        }}
                                                    >
                                                        <CheckCircle2 size={15} />
                                                        <span>{actionId === `club_${club.id}` ? "Approving..." : "Approve"}</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleRejectClub(club.id, club.club_name)}
                                                        disabled={actionId === `club_${club.id}`}
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
            )}

            {/* TAB 2: VENUE OWNERS */}
            {activeTab === "venue_owners" && (
                <div
                    style={{
                        background: "#0f0f1a",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "14px",
                        overflow: "hidden",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
                    }}
                >
                    {loadingVenueOwners ? (
                        <div style={{ padding: "50px", textAlign: "center", color: "#94a3b8" }}>
                            Loading pending venue owner applications...
                        </div>
                    ) : pendingVenueOwners.length === 0 ? (
                        <div style={{ padding: "60px 20px", textAlign: "center" }}>
                            <MapPin size={48} style={{ color: "#334155", marginBottom: "12px" }} />
                            <h3 style={{ fontSize: "17px", color: "#f1f5f9", margin: "0 0 6px 0" }}>No Pending Venue Owner Approvals</h3>
                            <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                                All venue owner applications have been reviewed!
                            </p>
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#161624", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#94a3b8" }}>
                                        <th style={{ padding: "14px 18px" }}>Owner Name</th>
                                        <th style={{ padding: "14px 18px" }}>Contact Information</th>
                                        <th style={{ padding: "14px 18px" }}>Aadhar / Identity</th>
                                        <th style={{ padding: "14px 18px" }}>Venues Registered</th>
                                        <th style={{ padding: "14px 18px", textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingVenueOwners.map((owner) => (
                                        <tr
                                            key={owner.id}
                                            style={{
                                                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                                                transition: "background 0.2s",
                                            }}
                                        >
                                            <td style={{ padding: "16px 18px", fontWeight: "600", color: "#ffffff" }}>
                                                <div>{owner.full_name || "Unnamed Owner"}</div>
                                                <span style={{ fontSize: "12px", color: "#64748b" }}>ID: VO-{owner.id}</span>
                                            </td>
                                            <td style={{ padding: "16px 18px" }}>
                                                <div style={{ color: "#f1f5f9" }}>{owner.email}</div>
                                                <div style={{ fontSize: "12px", color: "#64748b" }}>{owner.phone}</div>
                                            </td>
                                            <td style={{ padding: "16px 18px", color: "#c6ff3d" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <ShieldCheck size={16} />
                                                    <span>{owner.aadhar_number || "Verified ID"}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: "16px 18px", color: "#94a3b8" }}>
                                                {owner.venues && owner.venues.length > 0 ? (
                                                    <div>
                                                        {owner.venues.map((v) => (
                                                            <div key={v.id} style={{ marginBottom: "4px" }}>
                                                                <strong style={{ color: "#ffffff" }}>{v.name}</strong> ({v.location})
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: "#64748b" }}>No venues attached</span>
                                                )}
                                            </td>
                                            <td style={{ padding: "16px 18px", textAlign: "right" }}>
                                                <div style={{ display: "inline-flex", gap: "8px" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApproveVenueOwner(owner.id, owner.full_name)}
                                                        disabled={actionId === `owner_${owner.id}`}
                                                        style={{
                                                            background: "linear-gradient(135deg, #c6ff3d 0%, #a3e635 100%)",
                                                            color: "#0f172a",
                                                            border: "none",
                                                            padding: "8px 14px",
                                                            borderRadius: "6px",
                                                            fontSize: "13px",
                                                            fontWeight: "700",
                                                            cursor: "pointer",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "4px",
                                                            boxShadow: "0 2px 8px rgba(198, 255, 61, 0.3)",
                                                        }}
                                                    >
                                                        <UserCheck size={15} />
                                                        <span>{actionId === `owner_${owner.id}` ? "Approving..." : "Approve Owner"}</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleRejectVenueOwner(owner.id, owner.full_name)}
                                                        disabled={actionId === `owner_${owner.id}`}
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
            )}
        </div>
    );
}
