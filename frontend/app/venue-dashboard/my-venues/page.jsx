"use client";
import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8001";
const SPORTS_LIST = ["Cricket","Football","Basketball","Tennis","Badminton","Volleyball","Swimming","Table Tennis","Boxing","Kabaddi","Gym","Squash"];
const AMENITIES_LIST = ["Parking","Changing Rooms","Showers","Cafeteria","First Aid","CCTV","Floodlights","WiFi","Drinking Water","Washrooms","Scoreboard","Seating"];

function toggle(arr, val) { return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]; }

export default function MyVenuesPage() {
    const [venues, setVenues]     = useState([]);
    const [loading, setLoading]   = useState(true);
    const [editVenue, setEditVenue] = useState(null); // venue being edited
    const [saving, setSaving]     = useState(false);
    const [msg, setMsg]           = useState("");

    const ownerId = typeof window !== "undefined" ? localStorage.getItem("venueOwnerId") : null;

    const load = async () => {
        if (!ownerId) return;
        const r = await fetch(`${API}/venue-owner/${ownerId}/venues`);
        if (r.ok) setVenues(await r.json());
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const openEdit = (v) => {
        setEditVenue({
            ...v,
            sports: (() => { try { return JSON.parse(v.sports_supported || "[]"); } catch { return []; } })(),
            amenitiesList: (() => { try { return JSON.parse(v.amenities || "[]"); } catch { return []; } })(),
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

    const sports = (() => { try { return JSON.parse(editVenue?.sports_supported || "[]"); } catch { return []; } })();

    return (
        <>
            <h1 className="vd-page-title">My Venues</h1>
            <p className="vd-page-sub">Manage all your registered sports venues</p>

            {loading ? (
                <div className="vd-loading"><div className="vd-spinner" /> Loading venues…</div>
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
                    {venues.map(v => {
                        const sportsParsed = (() => { try { return JSON.parse(v.sports_supported || "[]"); } catch { return []; } })();
                        return (
                            <div key={v.id} className="vd-venue-card">
                                {v.cover_image ? (
                                    <img src={v.cover_image} alt={v.name} className="vd-venue-cover" />
                                ) : (
                                    <div className="vd-venue-cover-placeholder">🏟️</div>
                                )}
                                <div className="vd-venue-body">
                                    <div className="vd-venue-name">{v.name}</div>
                                    <div className="vd-venue-loc">
                                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                        {v.location}{v.landmark ? ` · ${v.landmark}` : ""}
                                    </div>
                                    <div className="vd-sport-tags">
                                        {sportsParsed.slice(0, 3).map(s => <span key={s} className="vd-sport-tag">{s}</span>)}
                                        {sportsParsed.length > 3 && <span className="vd-sport-tag">+{sportsParsed.length - 3}</span>}
                                    </div>
                                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>
                                        {v.opening_time} – {v.closing_time} · {v.slot_duration}min slots
                                    </div>
                                    <div className="vd-venue-footer">
                                        <button className="vd-btn-sm outline" onClick={() => openEdit(v)}>Edit</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Edit Modal */}
            {editVenue && (
                <div className="vd-modal-overlay" onClick={e => e.target === e.currentTarget && setEditVenue(null)}>
                    <div className="vd-modal">
                        <div className="vd-modal-header">
                            <span className="vd-modal-title">Edit — {editVenue.name}</span>
                            <button className="vd-modal-close" onClick={() => setEditVenue(null)}>×</button>
                        </div>

                        <div className="vd-form-grid">
                            <div className="vd-field">
                                <label className="vd-label">Venue Name *</label>
                                <input className="vd-input" value={editVenue.name}
                                    onChange={e => setEditVenue(p => ({ ...p, name: e.target.value }))} />
                            </div>
                            <div className="vd-field">
                                <label className="vd-label">Location *</label>
                                <input className="vd-input" value={editVenue.location}
                                    onChange={e => setEditVenue(p => ({ ...p, location: e.target.value }))} />
                            </div>
                            <div className="vd-field">
                                <label className="vd-label">Landmark</label>
                                <input className="vd-input" value={editVenue.landmark || ""}
                                    onChange={e => setEditVenue(p => ({ ...p, landmark: e.target.value }))} />
                            </div>
                            <div className="vd-field">
                                <label className="vd-label">Slot Duration</label>
                                <select className="vd-input" value={editVenue.slot_duration}
                                    onChange={e => setEditVenue(p => ({ ...p, slot_duration: Number(e.target.value) }))}>
                                    <option value={30}>30 minutes</option>
                                    <option value={60}>1 hour</option>
                                </select>
                            </div>
                            <div className="vd-field">
                                <label className="vd-label">Opening Time</label>
                                <input type="time" className="vd-input" value={editVenue.opening_time || ""}
                                    onChange={e => setEditVenue(p => ({ ...p, opening_time: e.target.value }))} />
                            </div>
                            <div className="vd-field">
                                <label className="vd-label">Closing Time</label>
                                <input type="time" className="vd-input" value={editVenue.closing_time || ""}
                                    onChange={e => setEditVenue(p => ({ ...p, closing_time: e.target.value }))} />
                            </div>
                        </div>

                        <div className="vd-field" style={{ marginBottom: 16 }}>
                            <label className="vd-label">Sports Offered</label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                                {SPORTS_LIST.map(s => (
                                    <button key={s} type="button"
                                        onClick={() => setEditVenue(p => ({ ...p, sports: toggle(p.sports, s) }))}
                                        style={{
                                            padding: "5px 13px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
                                            border: editVenue.sports.includes(s) ? "1px solid rgba(191,254,0,0.5)" : "1px solid rgba(255,255,255,0.1)",
                                            background: editVenue.sports.includes(s) ? "rgba(191,254,0,0.1)" : "transparent",
                                            color: editVenue.sports.includes(s) ? "#bffe00" : "rgba(255,255,255,0.5)",
                                            fontFamily: "Outfit,sans-serif",
                                        }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {msg && <p style={{ color: msg.includes("uccess") ? "#4ade80" : "#f87171", fontSize: 13, marginBottom: 8 }}>{msg}</p>}

                        <div className="vd-modal-actions">
                            <button className="vd-btn-ghost" onClick={() => setEditVenue(null)}>Cancel</button>
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
