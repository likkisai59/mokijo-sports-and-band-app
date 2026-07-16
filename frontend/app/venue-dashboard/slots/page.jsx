"use client";
import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";

const API = API_BASE_URL;

export default function SlotsPage() {
    const [venues, setVenues] = useState([]);
    const [selVenue, setSelVenue] = useState(null);
    const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionMsg, setActionMsg] = useState("");

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

    useEffect(() => {
        if (!selVenue) return;
        setLoading(true);
        fetch(`${API}/venues/${selVenue}/slots?date_str=${date}`)
            .then((r) => (r.ok ? r.json() : []))
            .then(setSlots)
            .catch(() => setSlots([]))
            .finally(() => setLoading(false));
    }, [selVenue, date]);

    const blockAction = async (type) => {
        if (!selVenue) return;
        setActionMsg("");
        const body = JSON.stringify({ start_date: date, end_date: date });
        const url = `${API}/venues/${selVenue}/${type}-slots`;
        const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
        const d = await r.json().catch(() => ({}));
        setActionMsg(d.message || (r.ok ? "Done!" : "Failed."));
        // Reload slots
        const sr = await fetch(`${API}/venues/${selVenue}/slots?date_str=${date}`);
        if (sr.ok) setSlots(await sr.json());
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

            {actionMsg && <p style={{ color: "#bffe00", fontSize: 13, marginBottom: 14 }}>{actionMsg}</p>}

            {loading ? (
                <div className="vd-loading">
                    <div className="vd-spinner" /> Loading slots…
                </div>
            ) : slots.length === 0 ? (
                <div className="vd-card">
                    <div className="vd-empty">
                        <div className="vd-empty-icon">⏳</div>
                        <div className="vd-empty-text">No slots for this date</div>
                        <div className="vd-empty-sub">Slots are auto-generated when someone views availability</div>
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
