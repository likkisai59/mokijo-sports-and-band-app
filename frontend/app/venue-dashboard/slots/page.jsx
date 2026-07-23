"use client";
import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";

const API = API_BASE_URL;

function parseSports(venue) {
    try {
        const parsed = JSON.parse(venue?.sports_supported || "[]");
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : ["badminton"];
    } catch {
        return ["badminton"];
    }
}

const emptyNewSlot = (sport) => ({
    sport: sport || "badminton",
    start_time: "07:00",
    end_time: "08:00",
    base_price: 1000,
});

export default function SlotsPage() {
    const [venues, setVenues] = useState([]);
    const [selVenue, setSelVenue] = useState(null);
    const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionMsg, setActionMsg] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [newSlot, setNewSlot] = useState(emptyNewSlot());
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    useEffect(() => {
        const ownerId = localStorage.getItem("venueOwnerId");
        if (!ownerId) return;
        fetch(`${API}/venue-owner/${ownerId}/venues`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                setVenues(data);
                if (data.length > 0) setSelVenue(data[0].id);
            });
    }, []);

    const currentVenue = venues.find((v) => v.id === selVenue) || null;
    const venueSports = parseSports(currentVenue);

    const loadSlots = () => {
        if (!selVenue) return;
        setLoading(true);
        fetch(`${API}/venues/${selVenue}/slots?date_str=${date}`)
            .then((r) => (r.ok ? r.json() : []))
            .then(setSlots)
            .catch(() => setSlots([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadSlots();
        setShowForm(false);
        setCreateError("");
    }, [selVenue, date]);

    useEffect(() => {
        setNewSlot(emptyNewSlot(venueSports[0]));
    }, [selVenue]);

    const blockAction = async (type) => {
        if (!selVenue) return;
        setActionMsg("");
        const body = JSON.stringify({ start_date: date, end_date: date });
        const url = `${API}/venues/${selVenue}/${type}-slots`;
        const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
        const d = await r.json().catch(() => ({}));
        setActionMsg(d.message || (r.ok ? "Done!" : "Failed."));
        loadSlots();
    };

    const createSlot = async () => {
        if (!selVenue) return;
        setCreateError("");
        if (!newSlot.start_time || !newSlot.end_time) {
            setCreateError("Please provide both a start and end time.");
            return;
        }
        if (newSlot.end_time <= newSlot.start_time) {
            setCreateError("End time must be after start time.");
            return;
        }
        const price = Number(newSlot.base_price);
        if (!price || price <= 0) {
            setCreateError("Please enter a valid price greater than 0.");
            return;
        }

        setCreating(true);
        try {
            const payload = [
                {
                    venue_id: selVenue,
                    sport: newSlot.sport,
                    start_time: `${date}T${newSlot.start_time}:00`,
                    end_time: `${date}T${newSlot.end_time}:00`,
                    base_price: price,
                    current_price: price,
                    is_blocked: false,
                },
            ];
            const r = await fetch(`${API}/venues/${selVenue}/slots`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (r.ok) {
                setShowForm(false);
                setNewSlot(emptyNewSlot(venueSports[0]));
                loadSlots();
            } else {
                const d = await r.json().catch(() => ({}));
                setCreateError(d.detail || "Failed to create slot.");
            }
        } catch {
            setCreateError("Cannot connect to server.");
        } finally {
            setCreating(false);
        }
    };

    const fmt = (iso) => {
        if (!iso) return "";
        const d = new Date(iso);
        return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <>
            <h1 className="vd-page-title">Slots &amp; Availability</h1>
            <p className="vd-page-sub">View and manage time slots for each venue</p>

            <div className="vd-controls">
                <select
                    className="vd-select"
                    value={selVenue || ""}
                    onChange={(e) => setSelVenue(Number(e.target.value))}
                >
                    {venues.map((v) => (
                        <option key={v.id} value={v.id}>
                            {v.name}
                        </option>
                    ))}
                </select>
                <input type="date" className="vd-input-sm" value={date} onChange={(e) => setDate(e.target.value)} />
                <button
                    className="vd-btn-primary"
                    disabled={!selVenue}
                    onClick={() => {
                        setCreateError("");
                        setShowForm((s) => !s);
                    }}
                >
                    {showForm ? "Cancel" : "+ Add Slot"}
                </button>
                <button
                    className="vd-btn-primary"
                    style={{
                        background: "rgba(239,68,68,0.15)",
                        color: "#f87171",
                        border: "1px solid rgba(239,68,68,0.3)",
                    }}
                    onClick={() => blockAction("block")}
                >
                    Block All Day
                </button>
                <button
                    className="vd-btn-primary"
                    style={{
                        background: "rgba(34,197,94,0.1)",
                        color: "#4ade80",
                        border: "1px solid rgba(34,197,94,0.3)",
                    }}
                    onClick={() => blockAction("unblock")}
                >
                    Unblock All Day
                </button>
            </div>

            {actionMsg && <p style={{ color: "#c6ff3d", fontSize: 13, marginBottom: 14 }}>{actionMsg}</p>}

            {showForm && (
                <div className="vd-card" style={{ marginBottom: 20 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            marginBottom: 14,
                        }}
                    >
                        <div style={{ fontSize: 14, fontWeight: 700 }}>Create a new slot for {date}</div>
                        <button
                            className="vd-btn-primary"
                            onClick={createSlot}
                            disabled={creating}
                            style={{ flexShrink: 0 }}
                        >
                            {creating ? "Creating…" : "Create Slot"}
                        </button>
                    </div>
                    <div className="vd-form-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <div className="vd-field">
                            <label className="vd-label">Sport</label>
                            <select
                                className="vd-input"
                                value={newSlot.sport}
                                onChange={(e) => setNewSlot((p) => ({ ...p, sport: e.target.value }))}
                            >
                                {venueSports.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="vd-field">
                            <label className="vd-label">Start Time</label>
                            <input
                                type="time"
                                className="vd-input"
                                value={newSlot.start_time}
                                onChange={(e) => setNewSlot((p) => ({ ...p, start_time: e.target.value }))}
                            />
                        </div>
                        <div className="vd-field">
                            <label className="vd-label">End Time</label>
                            <input
                                type="time"
                                className="vd-input"
                                value={newSlot.end_time}
                                onChange={(e) => setNewSlot((p) => ({ ...p, end_time: e.target.value }))}
                            />
                        </div>
                        <div className="vd-field">
                            <label className="vd-label">Price (₹)</label>
                            <input
                                type="number"
                                min="1"
                                className="vd-input"
                                value={newSlot.base_price}
                                onChange={(e) => setNewSlot((p) => ({ ...p, base_price: e.target.value }))}
                            />
                        </div>
                    </div>
                    {createError && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 0 }}>{createError}</p>}
                </div>
            )}

            {loading ? (
                <div className="vd-loading">
                    <div className="vd-spinner" /> Loading slots…
                </div>
            ) : slots.length === 0 ? (
                <div className="vd-card">
                    <div className="vd-empty">
                        <div className="vd-empty-icon">⏳</div>
                        <div className="vd-empty-text">No slots for this date</div>
                        <div className="vd-empty-sub">
                            Use &ldquo;+ Add Slot&rdquo; above to create availability for this venue and date.
                        </div>
                    </div>
                </div>
            ) : (
                <div className="vd-slot-grid">
                    {slots.map((slot) => {
                        const status = slot.is_blocked ? "blocked" : "available";
                        return (
                            <div key={slot.id} className={`vd-slot-tile ${status}`}>
                                <div className="vd-slot-time">
                                    {fmt(slot.start_time)} – {fmt(slot.end_time)}
                                </div>
                                <div className="vd-slot-sport" style={{ textTransform: "capitalize" }}>
                                    {slot.sport}
                                </div>
                                <div className="vd-slot-price">₹{slot.base_price}</div>
                                <span
                                    className={`vd-badge ${status === "blocked" ? "red" : "green"}`}
                                    style={{ fontSize: 10, padding: "2px 8px" }}
                                >
                                    {status}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
