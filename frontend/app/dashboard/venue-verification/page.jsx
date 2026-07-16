"use client";
import { API_BASE_URL } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

const API = API_BASE_URL;

export default function VenueVerificationQueuePage() {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("PENDING_VERIFICATION");

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const statusFilter = filter === "ALL" ? "" : `?verification_status=${filter}`;
            const res = await fetch(`${API}/admin/venues/verification-queue${statusFilter}`);
            if (res.ok) {
                setQueue(await res.json());
            }
        } catch (err) {
            console.error("Failed to load queue", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, [filter]);

    const getStatusStyle = (status) => {
        switch (status) {
            case "VERIFIED":
                return { background: "rgba(34, 197, 94, 0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" };
            case "PENDING_VERIFICATION":
            case "UNDER_REVIEW":
                return { background: "rgba(234, 179, 8, 0.12)", color: "#fbbf24", border: "1px solid rgba(234,179,8,0.2)" };
            case "MORE_INFO_REQUIRED":
                return { background: "rgba(251, 146, 60, 0.12)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.2)" };
            case "REJECTED":
            case "SUSPENDED":
                return { background: "rgba(239, 68, 68, 0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" };
            default:
                return { background: "rgba(255, 255, 255, 0.06)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.1)" };
        }
    };

    return (
        <div style={{ padding: "10px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 }}>Venue Verification Queue</h1>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                        Evaluate and verify venue registration requests to maintain platform security.
                    </p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 12 }}>
                {[
                    { label: "Pending Verification", value: "PENDING_VERIFICATION" },
                    { label: "Under Review", value: "UNDER_REVIEW" },
                    { label: "Verified", value: "VERIFIED" },
                    { label: "Info Requested", value: "MORE_INFO_REQUIRED" },
                    { label: "Suspended", value: "SUSPENDED" },
                    { label: "All Venues", value: "ALL" }
                ].map(t => (
                    <button
                        key={t.value}
                        onClick={() => setFilter(t.value)}
                        style={{
                            padding: "8px 16px",
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            background: filter === t.value ? "rgba(191,254,0,0.1)" : "transparent",
                            color: filter === t.value ? "#bffe00" : "rgba(255,255,255,0.5)",
                            border: filter === t.value ? "1px solid rgba(191,254,0,0.3)" : "1px solid transparent",
                            transition: "all 0.2s"
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Queue List */}
            {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, color: "rgba(255,255,255,0.4)" }}>
                    <span>Loading queue...</span>
                </div>
            ) : queue.length === 0 ? (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "50px 20px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>No venues found</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>There are no venues matching the selected filter.</div>
                </div>
            ) : (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.01)" }}>
                                <th style={{ padding: "14px 20px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Venue</th>
                                <th style={{ padding: "14px 20px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Owner</th>
                                <th style={{ padding: "14px 20px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Submitted At</th>
                                <th style={{ padding: "14px 20px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Status</th>
                                <th style={{ padding: "14px 20px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {queue.map(v => (
                                <tr key={v.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }} className="queue-row">
                                    <td style={{ padding: "16px 20px" }}>
                                        <div style={{ fontWeight: 700, color: "#fff" }}>{v.name}</div>
                                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{v.location}</div>
                                    </td>
                                    <td style={{ padding: "16px 20px" }}>
                                        <div style={{ fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{v.owner_name || "Unknown"}</div>
                                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{v.owner_email}</div>
                                    </td>
                                    <td style={{ padding: "16px 20px", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                                        {v.verification_submitted_at ? new Date(v.verification_submitted_at).toLocaleString() : "—"}
                                    </td>
                                    <td style={{ padding: "16px 20px" }}>
                                        <span style={{
                                            display: "inline-block",
                                            padding: "4px 10px",
                                            borderRadius: 999,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            ...getStatusStyle(v.verification_status)
                                        }}>
                                            {v.verification_status?.replace(/_/g, " ")}
                                        </span>
                                    </td>
                                    <td style={{ padding: "16px 20px" }}>
                                        <Link href={`/dashboard/venue-verification/${v.id}`} style={{
                                            display: "inline-block",
                                            padding: "6px 14px",
                                            borderRadius: 6,
                                            background: "rgba(255,255,255,0.06)",
                                            color: "#fff",
                                            fontSize: 13,
                                            fontWeight: 600,
                                            textDecoration: "none",
                                            border: "1px solid rgba(255,255,255,0.08)"
                                        }}>
                                            Review Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
