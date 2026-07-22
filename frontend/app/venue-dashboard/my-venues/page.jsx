"use client";
import { API_BASE_URL } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

const API = API_BASE_URL;
const SPORTS_LIST = [
    "Cricket",
    "Football",
    "Basketball",
    "Tennis",
    "Badminton",
    "Volleyball",
    "Swimming",
    "Table Tennis",
    "Boxing",
    "Kabaddi",
    "Gym",
    "Squash",
];
const AMENITIES_LIST = [
    "Parking",
    "Changing Rooms",
    "Showers",
    "Cafeteria",
    "First Aid",
    "CCTV",
    "Floodlights",
    "WiFi",
    "Drinking Water",
    "Washrooms",
    "Scoreboard",
    "Seating",
];

function toggle(arr, val) {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

export default function MyVenuesPage() {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editVenue, setEditVenue] = useState(null); // venue being edited
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");

    const ownerId = typeof window !== "undefined" ? localStorage.getItem("venueOwnerId") : null;

    const load = async () => {
        if (!ownerId) return;
        const r = await fetch(`${API}/venue-owner/${ownerId}/venues`);
        if (r.ok) setVenues(await r.json());
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const openEdit = (v) => {
        setEditVenue({
            ...v,
            sports: (() => {
                try {
                    return JSON.parse(v.sports_supported || "[]");
                } catch {
                    return [];
                }
            })(),
            amenitiesList: (() => {
                try {
                    return JSON.parse(v.amenities || "[]");
                } catch {
                    return [];
                }
            })(),
            contact_phone: v.contact_phone || "",
            contact_email: v.contact_email || "",
            city: v.city || "",
            state_name: v.state_name || "",
            postal_code: v.postal_code || "",
        });
        setMsg("");
    };

    const saveEdit = async () => {
        setSaving(true);
        const body = {
            name: editVenue.name,
            location: editVenue.location,
            landmark: editVenue.landmark || null,
            sports_supported: JSON.stringify(editVenue.sports),
            amenities: JSON.stringify(editVenue.amenitiesList),
            cover_image: editVenue.cover_image || null,
            venue_images: editVenue.venue_images || null,
            opening_time: editVenue.opening_time || null,
            closing_time: editVenue.closing_time || null,
            days_open: editVenue.days_open || null,
            slot_duration: editVenue.slot_duration || 60,
            contact_phone: editVenue.contact_phone || null,
            contact_email: editVenue.contact_email || null,
            city: editVenue.city || null,
            state_name: editVenue.state_name || null,
            postal_code: editVenue.postal_code || null,
        };
        const r = await fetch(`${API}/venues/${editVenue.id}?owner_id=${ownerId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (r.ok) {
            setMsg("Saved successfully!");
            await load();
            setTimeout(() => setEditVenue(null), 800);
        } else {
            const d = await r.json().catch(() => ({}));
            setMsg(d.detail || "Save failed.");
        }
        setSaving(false);
    };

    const sports = (() => {
        try {
            return JSON.parse(editVenue?.sports_supported || "[]");
        } catch {
            return [];
        }
    })();

    return (
        <>
            <h1 className="vd-page-title">My Venues</h1>
            <p className="vd-page-sub">Manage all your registered sports venues</p>

            {loading ? (
                <div className="vd-loading">
                    <div className="vd-spinner" /> Loading venues…
                </div>
            ) : venues.length === 0 ? (
                <div className="vd-card">
                    <div className="vd-empty">
                        <div className="vd-empty-icon">🏟️</div>
                        <div className="vd-empty-text">No venues yet</div>
                        <div className="vd-empty-sub">Register your first venue to get started.</div>
                    </div>
                </div>
            ) : (
                <div className="vd-venues-grid">
                    {venues.map((v) => {
                        const sportsParsed = (() => {
                            try {
                                return JSON.parse(v.sports_supported || "[]");
                            } catch {
                                return [];
                            }
                        })();
                        return (
                            <div key={v.id} className="vd-venue-card">
                                {v.cover_image ? (
                                    <img src={v.cover_image} alt={v.name} className="vd-venue-cover" />
                                ) : (
                                    <div className="vd-venue-cover-placeholder">🏟️</div>
                                )}
                                <div className="vd-venue-body">
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                                        <div className="vd-venue-name" style={{ margin: 0 }}>{v.name}</div>
                                        <span className={`vd-badge ${
                                            v.verification_status === "VERIFIED" ? "green" :
                                            v.verification_status === "PENDING_VERIFICATION" || v.verification_status === "UNDER_REVIEW" ? "yellow" :
                                            v.verification_status === "MORE_INFO_REQUIRED" ? "yellow" :
                                            v.verification_status === "REJECTED" || v.verification_status === "SUSPENDED" ? "red" : "gray"
                                        }`}
                                        style={v.verification_status === "MORE_INFO_REQUIRED" ? { background: "rgba(251, 146, 60, 0.12)", color: "#fb923c" } : {}}
                                        >
                                            {v.verification_status?.replace(/_/g, " ") || "DRAFT"}
                                        </span>
                                    </div>

                                    {v.verification_status === "MORE_INFO_REQUIRED" && (
                                        <div style={{ fontSize: 11, background: "rgba(251, 146, 60, 0.08)", border: "1px solid rgba(251, 146, 60, 0.2)", borderRadius: 6, padding: "6px 10px", margin: "8px 0", color: "#fb923c" }}>
                                            <strong>Info Required:</strong> {v.verification_notes}
                                        </div>
                                    )}
                                    {v.verification_status === "REJECTED" && (
                                        <div style={{ fontSize: 11, background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 6, padding: "6px 10px", margin: "8px 0", color: "#f87171" }}>
                                            <strong>Rejected:</strong> {v.rejection_reason}
                                        </div>
                                    )}
                                    {v.verification_status === "SUSPENDED" && (
                                        <div style={{ fontSize: 11, background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 6, padding: "6px 10px", margin: "8px 0", color: "#f87171" }}>
                                            <strong>Suspended:</strong> {v.rejection_reason || "Violation of platform policies."}
                                        </div>
                                    )}

                                    <div className="vd-venue-loc">
                                        <svg
                                            viewBox="0 0 24 24"
                                            width="12"
                                            height="12"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        {v.location}
                                        {v.landmark ? ` · ${v.landmark}` : ""}
                                    </div>
                                    <div className="vd-sport-tags">
                                        {sportsParsed.slice(0, 3).map((s) => (
                                            <span key={s} className="vd-sport-tag">
                                                {s}
                                            </span>
                                        ))}
                                        {sportsParsed.length > 3 && (
                                            <span className="vd-sport-tag">+{sportsParsed.length - 3}</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>
                                        {v.opening_time} – {v.closing_time} · {v.slot_duration}min slots
                                    </div>
                                    <div className="vd-venue-footer" style={{ display: "flex", gap: 8 }}>
                                        <button className="vd-btn-sm outline" onClick={() => openEdit(v)}>
                                            Edit Details
                                        </button>
                                        {(v.verification_status === "DRAFT" || v.verification_status === "REJECTED" || v.verification_status === "MORE_INFO_REQUIRED") && (
                                            <Link href={`/venue-dashboard/verify/${v.id}`} className="vd-btn-sm primary" style={{ textDecoration: "none" }}>
                                                {v.verification_status === "DRAFT" ? "Verify Venue" : "Update & Resubmit"}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Edit Modal */}
            {editVenue && (
                <div className="vd-modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditVenue(null)}>
                    <div className="vd-modal" style={{ maxWidth: 750 }}>
                        <div className="vd-modal-header">
                            <span className="vd-modal-title">Edit — {editVenue.name}</span>
                            <button className="vd-modal-close" onClick={() => setEditVenue(null)}>
                                ×
                            </button>
                        </div>

                        <div className="vd-form-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                            <div className="vd-field">
                                <label className="vd-label">Venue Name *</label>
                                <input
                                    className="vd-input"
                                    value={editVenue.name}
                                    onChange={(e) => setEditVenue((p) => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div className="vd-field">
                                <label className="vd-label">Location *</label>
                                <input
                                    className="vd-input"
                                    value={editVenue.location}
                                    onChange={(e) => setEditVenue((p) => ({ ...p, location: e.target.value }))}
                                />
                            </div>
                            <div className="vd-field">
                                <label className="vd-label">Landmark</label>
                                <input
                                    className="vd-input"
                                    value={editVenue.landmark || ""}
                                    onChange={(e) => setEditVenue((p) => ({ ...p, landmark: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="vd-form-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                            <div className="vd-field">
                                <label className="vd-label">Contact Phone</label>
                                <input
                                    className="vd-input"
                                    placeholder="+91 99999 99999"
                                    value={editVenue.contact_phone || ""}
                                    onChange={(e) => setEditVenue((p) => ({ ...p, contact_phone: e.target.value }))}
                                />
                            </div>
                            <div className="vd-field">
                                <label className="vd-label">Contact Email</label>
                                <input
                                    className="vd-input"
                                    placeholder="contact@venue.com"
                                    type="email"
                                    value={editVenue.contact_email || ""}
                                    onChange={(e) => setEditVenue((p) => ({ ...p, contact_email: e.target.value }))}
                                />
                            </div>
                            <div className="vd-field">
                                <label className="vd-label">Slot Duration</label>
                                <select
                                    className="vd-input"
                                    value={editVenue.slot_duration}
                                    onChange={(e) =>
                                        setEditVenue((p) => ({ ...p, slot_duration: Number(e.target.value) }))
                                    }
                                >
                                    <option value={30}>30 minutes</option>
                                    <option value={60}>1 hour</option>
                                </select>
                            </div>
                        </div>

                        <div className="vd-form-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                            <div className="vd-field">
                                <label className="vd-label">City</label>
                                <input
                                    className="vd-input"
                                    placeholder="City"
                                    value={editVenue.city || ""}
                                    onChange={(e) => setEditVenue((p) => ({ ...p, city: e.target.value }))}
                                />
                            </div>
                            <div className="vd-field">
                                <label className="vd-label">State</label>
                                <input
                                    className="vd-input"
                                    placeholder="State"
                                    value={editVenue.state_name || ""}
                                    onChange={(e) => setEditVenue((p) => ({ ...p, state_name: e.target.value }))}
                                />
                            </div>
                            <div className="vd-field">
                                <label className="vd-label">Postal Code</label>
                                <input
                                    className="vd-input"
                                    placeholder="Pincode"
                                    value={editVenue.postal_code || ""}
                                    onChange={(e) => setEditVenue((p) => ({ ...p, postal_code: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="vd-form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                            <div className="vd-field">
                                <label className="vd-label">Opening Time</label>
                                <input
                                    type="time"
                                    className="vd-input"
                                    value={editVenue.opening_time || ""}
                                    onChange={(e) => setEditVenue((p) => ({ ...p, opening_time: e.target.value }))}
                                />
                            </div>
                            <div className="vd-field">
                                <label className="vd-label">Closing Time</label>
                                <input
                                    type="time"
                                    className="vd-input"
                                    value={editVenue.closing_time || ""}
                                    onChange={(e) => setEditVenue((p) => ({ ...p, closing_time: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="vd-field" style={{ marginBottom: 16 }}>
                            <label className="vd-label">Sports Offered</label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                                {SPORTS_LIST.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setEditVenue((p) => ({ ...p, sports: toggle(p.sports, s) }))}
                                        style={{
                                            padding: "5px 13px",
                                            borderRadius: 999,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            border: editVenue.sports.includes(s)
                                                ? "1px solid rgba(198, 255, 61,0.5)"
                                                : "1px solid rgba(255,255,255,0.1)",
                                            background: editVenue.sports.includes(s)
                                                ? "rgba(198, 255, 61,0.1)"
                                                : "transparent",
                                            color: editVenue.sports.includes(s) ? "#c6ff3d" : "rgba(255,255,255,0.5)",
                                            fontFamily: "Outfit,sans-serif",
                                        }}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {msg && (
                            <p
                                style={{
                                    color: msg.includes("uccess") ? "#4ade80" : "#f87171",
                                    fontSize: 13,
                                    marginBottom: 8,
                                }}
                            >
                                {msg}
                            </p>
                        )}

                        <div className="vd-modal-actions">
                            <button className="vd-btn-ghost" onClick={() => setEditVenue(null)}>
                                Cancel
                            </button>
                            <button className="vd-btn-primary" onClick={saveEdit} disabled={saving}>
                                {saving ? "Saving…" : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
