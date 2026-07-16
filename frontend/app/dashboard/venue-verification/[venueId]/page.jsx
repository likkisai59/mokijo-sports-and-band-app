"use client";
import { API_BASE_URL } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API = API_BASE_URL;

export default function VenueVerificationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const venueId = params.venueId;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionMsg, setActionMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [notes, setNotes] = useState("");
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Checklist state
    const [checklist, setChecklist] = useState({
        gps_matched: false,
        photos_valid: false,
        documents_legible: false,
        contact_verified: false
    });

    const fetchDetail = async () => {
        try {
            const res = await fetch(`${API}/admin/venues/${venueId}/review`);
            if (res.ok) {
                setData(await res.json());
            } else {
                setErrorMsg("Venue details could not be found.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("Connection error.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (venueId) {
            fetchDetail();
        }
    }, [venueId]);

    const handleAction = async (endpoint, payload) => {
        setSubmitting(true);
        setErrorMsg("");
        setActionMsg("");
        try {
            const res = await fetch(`${API}/admin/venues/${venueId}/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const resData = await res.json();
            if (res.ok) {
                setActionMsg(resData.message || "Action processed successfully.");
                setNotes("");
                setReason("");
                // Reload data
                await fetchDetail();
            } else {
                setErrorMsg(resData.detail || "Action failed.");
            }
        } catch (err) {
            setErrorMsg("Network error.");
        } finally {
            setSubmitting(false);
        }
    };

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

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, color: "rgba(255,255,255,0.4)" }}>
                <span>Loading review details...</span>
            </div>
        );
    }

    if (errorMsg && !data) {
        return (
            <div style={{ padding: 20, color: "#f87171" }}>
                <h2>Error</h2>
                <p>{errorMsg}</p>
                <button onClick={() => router.push("/dashboard/venue-verification")} style={{ marginTop: 14, padding: "8px 16px", borderRadius: 8, background: "#fff", color: "#000", border: "none", cursor: "pointer" }}>
                    Back to Queue
                </button>
            </div>
        );
    }

    const { venue, documents, audit_log } = data;
    const sportsParsed = (() => {
        try {
            return JSON.parse(venue.sports_supported || "[]");
        } catch {
            return [];
        }
    })();
    const photosParsed = (() => {
        try {
            return JSON.parse(venue.venue_images || "[]");
        } catch {
            return [];
        }
    })();

    return (
        <div style={{ padding: "10px 0", maxWidth: 1100, margin: "0 auto" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 20 }}>
                <div>
                    <button onClick={() => router.push("/dashboard/venue-verification")} style={{ background: "none", border: "none", color: "var(--vd-brand)", cursor: "pointer", fontSize: 13, fontWeight: 700, padding: 0, marginBottom: 8, display: "block" }}>
                        ← Back to Queue
                    </button>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 }}>Reviewing: {venue.name}</h1>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                        <span style={{
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            ...getStatusStyle(venue.verification_status)
                        }}>
                            {venue.verification_status?.replace(/_/g, " ")}
                        </span>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                            Submitted by {venue.owner_name} ({venue.owner_email})
                        </span>
                    </div>
                </div>

                {venue.verification_status === "PENDING_VERIFICATION" && (
                    <button
                        className="vd-btn-primary"
                        onClick={() => handleAction("start-review", { notes: "Review session started" })}
                        disabled={submitting}
                        style={{ padding: "10px 22px", fontSize: 13 }}
                    >
                        {submitting ? "Processing..." : "Start Reviewing"}
                    </button>
                )}
            </div>

            {actionMsg && (
                <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: 14, color: "#4ade80", fontSize: 13, marginBottom: 20 }}>
                    ✓ {actionMsg}
                </div>
            )}
            {errorMsg && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: 14, color: "#f87171", fontSize: 13, marginBottom: 20 }}>
                    ⚠️ {errorMsg}
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
                {/* Left Column: Details & Uploads */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    
                    {/* General & Contact Details */}
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: "#fff" }}>Venue & Contact Info</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            <div>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Contact Phone</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginTop: 2 }}>{venue.contact_phone || "Not specified"}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Contact Email</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginTop: 2 }}>{venue.contact_email || "Not specified"}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>City / State / Pin</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginTop: 2 }}>
                                    {venue.city ? `${venue.city}, ${venue.state_name || ""} ${venue.postal_code || ""}` : "Not specified"}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Location Landmark</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginTop: 2 }}>{venue.location} {venue.landmark ? `(Landmark: ${venue.landmark})` : ""}</div>
                            </div>
                        </div>

                        {venue.description && (
                            <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Description / Guidelines</div>
                                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4, lineHeight: 1.5 }}>{venue.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Geolocation Details */}
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: "#fff" }}>GPS Coordinates Verification</h3>
                        {venue.gps_latitude ? (
                            <div>
                                <div style={{ display: "flex", gap: 20 }}>
                                    <div>
                                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Latitude</span>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginTop: 2 }}>{venue.gps_latitude}</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Longitude</span>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginTop: 2 }}>{venue.gps_longitude}</div>
                                    </div>
                                    {venue.gps_captured_at && (
                                        <div>
                                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Captured At</span>
                                            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{new Date(venue.gps_captured_at).toLocaleString()}</div>
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginTop: 14, height: 160, width: "100%", background: "rgba(255,255,255,0.04)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)" }}>
                                    <div style={{ textAlign: "center" }}>
                                        <span style={{ fontSize: 24 }}>📍</span>
                                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                                            Leaflet Map Simulation (Latitude: {venue.gps_latitude}, Longitude: {venue.gps_longitude})
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ fontSize: 13, color: "#fb923c" }}>⚠️ GPS Geolocation coordinates were not supplied for this venue.</div>
                        )}
                    </div>

                    {/* Photos Preview */}
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: "#fff" }}>Venue Photos ({photosParsed.length})</h3>
                        {photosParsed.length === 0 ? (
                            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>No photos uploaded.</div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                                {photosParsed.map((p, idx) => (
                                    <a key={idx} href={p} target="_blank" rel="noreferrer" style={{ borderRadius: 8, overflow: "hidden", height: 120, border: "1px solid rgba(255,255,255,0.08)", display: "block" }}>
                                        <img src={p} alt="Venue upload" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Documents List */}
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: "#fff" }}>Verification Documents ({documents.length})</h3>
                        {documents.length === 0 ? (
                            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>No documents supplied.</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {documents.map(d => (
                                    <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 14 }}>
                                        <div>
                                            <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{d.original_filename || "Document"}</div>
                                            <div style={{ fontSize: 11, color: "var(--vd-brand)", marginTop: 2 }}>{d.document_type.replace(/_/g, " ")} {d.document_label ? `(${d.document_label})` : ""}</div>
                                        </div>
                                        <a href={d.file_path} download={d.original_filename} style={{
                                            padding: "6px 12px",
                                            background: "rgba(255,255,255,0.08)",
                                            color: "#fff",
                                            fontSize: 12,
                                            fontWeight: 600,
                                            borderRadius: 6,
                                            textDecoration: "none"
                                        }}>
                                            Download
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Actions & Log */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                    {/* Verification Checklist */}
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: "#fff" }}>Evaluation Checklist</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {Object.keys(checklist).map(key => (
                                <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                                    <input
                                        type="checkbox"
                                        checked={checklist[key]}
                                        onChange={() => setChecklist(prev => ({ ...prev, [key]: !prev[key] }))}
                                        style={{ accentColor: "var(--vd-brand)", cursor: "pointer" }}
                                    />
                                    {key === "gps_matched" && "GPS coordinates match location"}
                                    {key === "photos_valid" && "Min 3 valid venue photos"}
                                    {key === "documents_legible" && "Min 1 valid legal document"}
                                    {key === "contact_verified" && "Contact info appears valid"}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Admin Decisions */}
                    {venue.verification_status !== "VERIFIED" && venue.verification_status !== "SUSPENDED" ? (
                        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: "#fff" }}>Decision Control</h3>
                            
                            <div className="vd-field" style={{ marginBottom: 12 }}>
                                <label className="vd-label">Audit Log Notes / Comments *</label>
                                <textarea
                                    className="vd-input"
                                    placeholder="Enter administrative notes about this decision..."
                                    style={{ minHeight: 80 }}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <div className="vd-field" style={{ marginBottom: 14 }}>
                                <label className="vd-label">Rejection / Hold Reason (Only if rejecting/requesting info)</label>
                                <input
                                    className="vd-input"
                                    placeholder="e.g. Legal document has expired"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <button
                                    onClick={() => handleAction("approve", { notes })}
                                    disabled={submitting || !notes}
                                    className="vd-btn-primary"
                                    style={{ width: "100%" }}
                                >
                                    Approve & Publish Venue
                                </button>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        onClick={() => handleAction("reject", { reason, notes })}
                                        disabled={submitting || !notes || !reason}
                                        style={{ flex: 1, padding: "9px 0", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleAction("request-info", { notes })}
                                        disabled={submitting || !notes}
                                        style={{ flex: 1, padding: "9px 0", background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.3)", color: "#fb923c", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                                    >
                                        Request Info
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        venue.verification_status === "VERIFIED" && (
                            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: "#fff" }}>Suspend Venue</h3>
                                <div className="vd-field" style={{ marginBottom: 14 }}>
                                    <label className="vd-label">Reason for Suspension *</label>
                                    <input
                                        className="vd-input"
                                        placeholder="e.g. Violation of court guidelines"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => handleAction("suspend", { reason })}
                                    disabled={submitting || !reason}
                                    style={{ width: "100%", padding: "10px 0", background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                                >
                                    Suspend Venue
                                </button>
                            </div>
                        )
                    )}

                    {/* Audit Logs */}
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: "#fff" }}>Audit Log History</h3>
                        {audit_log.length === 0 ? (
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>No actions logged yet.</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {audit_log.map(log => (
                                    <div key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: 8 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--vd-brand)" }}>{log.action}</span>
                                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{new Date(log.created_at).toLocaleString()}</span>
                                        </div>
                                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
                                            By {log.actor_name} ({log.actor_role})
                                        </div>
                                        {log.notes && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Note: {log.notes}</div>}
                                        {log.reason && <div style={{ fontSize: 11, color: "#f87171", marginTop: 2 }}>Reason: {log.reason}</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
