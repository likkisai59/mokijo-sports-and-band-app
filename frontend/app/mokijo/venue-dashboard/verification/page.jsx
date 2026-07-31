"use client";
import { API_BASE_URL } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

const API = API_BASE_URL;

const STATUS_META = {
    VERIFIED: { badge: "green", text: "Verified", desc: "This venue is live and bookable by players." },
    PENDING_VERIFICATION: { badge: "yellow", text: "Pending Verification", desc: "Your submission is in the queue and awaiting review." },
    UNDER_REVIEW: { badge: "yellow", text: "Under Review", desc: "Our team is currently reviewing your submission." },
    MORE_INFO_REQUIRED: { badge: "orange", text: "More Info Required", desc: "Please provide the requested information and resubmit." },
    REJECTED: { badge: "red", text: "Rejected", desc: "This submission was rejected. Review the reason and resubmit." },
    SUSPENDED: { badge: "red", text: "Suspended", desc: "This venue has been suspended and is not accepting new bookings." },
    DRAFT: { badge: "gray", text: "Draft", desc: "Not yet submitted for verification." },
};

function metaFor(status) {
    return STATUS_META[status] || STATUS_META.DRAFT;
}

export default function VerificationStatusPage() {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);

    const ownerId = typeof window !== "undefined" ? localStorage.getItem("venueOwnerId") : null;

    useEffect(() => {
        const load = async () => {
            if (!ownerId) {
                setLoading(false);
                return;
            }
            try {
                const r = await fetch(`${API}/venue-owner/${ownerId}/venues`);
                if (r.ok) setVenues(await r.json());
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [ownerId]);

    return (
        <>
            <h1 className="vd-page-title">Verification Status</h1>
            <p className="vd-page-sub">Track the verification status of every venue you own</p>

            {loading ? (
                <div className="vd-loading">
                    <div className="vd-spinner" /> Loading verification status…
                </div>
            ) : venues.length === 0 ? (
                <div className="vd-card">
                    <div className="vd-empty">
                        <div className="vd-empty-icon">🛡️</div>
                        <div className="vd-empty-text">No venues yet</div>
                        <div className="vd-empty-sub">Register a venue first, then submit it for verification.</div>
                    </div>
                </div>
            ) : (
                <div className="vd-venues-grid">
                    {venues.map((v) => {
                        const status = v.verification_status || "DRAFT";
                        const meta = metaFor(status);
                        return (
                            <div key={v.id} className="vd-card" style={{ padding: 20 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                                    <div style={{ fontSize: 15, fontWeight: 700 }}>{v.name}</div>
                                    <span
                                        className={`vd-badge ${meta.badge === "orange" ? "yellow" : meta.badge}`}
                                        style={meta.badge === "orange" ? { background: "rgba(251, 146, 60, 0.12)", color: "#fb923c" } : {}}
                                    >
                                        {meta.text}
                                    </span>
                                </div>
                                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 12 }}>{meta.desc}</p>

                                {status === "MORE_INFO_REQUIRED" && v.verification_notes && (
                                    <div style={{ fontSize: 12, background: "rgba(251, 146, 60, 0.08)", border: "1px solid rgba(251, 146, 60, 0.2)", borderRadius: 6, padding: "8px 12px", marginBottom: 12, color: "#fb923c" }}>
                                        <strong>Info Required:</strong> {v.verification_notes}
                                    </div>
                                )}
                                {(status === "REJECTED" || status === "SUSPENDED") && v.rejection_reason && (
                                    <div style={{ fontSize: 12, background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 6, padding: "8px 12px", marginBottom: 12, color: "#f87171" }}>
                                        <strong>Reason:</strong> {v.rejection_reason}
                                    </div>
                                )}

                                <div style={{ display: "flex", gap: 8 }}>
                                    {(status === "DRAFT" || status === "REJECTED" || status === "MORE_INFO_REQUIRED") && (
                                        <Link href={`/venue-dashboard/verify/${v.id}`} className="vd-btn-sm primary" style={{ textDecoration: "none" }}>
                                            {status === "DRAFT" ? "Start Verification" : "Update & Resubmit"}
                                        </Link>
                                    )}
                                    <Link href="/venue-dashboard/my-venues" className="vd-btn-sm outline" style={{ textDecoration: "none" }}>
                                        View Venue
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
