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
    const [genStart, setGenStart] = useState(() => new Date().toISOString().split("T")[0]);
    const [genEnd, setGenEnd] = useState(() => new Date().toISOString().split("T")[0]);
    const [openTime, setOpenTime] = useState("07:00");
    const [closeTime, setCloseTime] = useState("22:00");
    const [duration, setDuration] = useState(60);
    const [defaultPrice, setDefaultPrice] = useState(800);
    const [generating, setGenerating] = useState(false);
    const [editingSlotId, setEditingSlotId] = useState(null);
    const [editPrice, setEditPrice] = useState("");

    const selectedVenue = venues.find((v) => v.id === selVenue);

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
        if (!selectedVenue) return;
        if (selectedVenue.opening_time) setOpenTime(String(selectedVenue.opening_time).slice(0, 5));
        if (selectedVenue.closing_time) setCloseTime(String(selectedVenue.closing_time).slice(0, 5));
        if (selectedVenue.slot_duration) setDuration(Number(selectedVenue.slot_duration) || 60);
    }, [selectedVenue?.id]);

    const reloadSlots = async () => {
        if (!selVenue) return;
        setLoading(true);
        try {
            const r = await fetch(`${API}/venues/${selVenue}/slots?date_str=${date}`);
            setSlots(r.ok ? await r.json() : []);
        } catch {
            setSlots([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        reloadSlots();
    }, [selVenue, date]);

    const blockAction = async (type) => {
        if (!selVenue) return;
        setActionMsg("");
        const body = JSON.stringify({ start_date: date, end_date: date });
        const url = `${API}/venues/${selVenue}/${type}-slots`;
        const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
        const d = await r.json().catch(() => ({}));
        setActionMsg(d.message || (r.ok ? "Done!" : "Failed."));
        await reloadSlots();
    };

    const generateRange = async () => {
        if (!selVenue) return;
        setGenerating(true);
        setActionMsg("");
        try {
            const start = new Date(`${genStart}T00:00:00`);
            const end = new Date(`${genEnd}T00:00:00`);
            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
                setActionMsg("Invalid date range.");
                return;
            }

            let sports = ["Badminton"];
            try {
                const parsed = JSON.parse(selectedVenue?.sports_supported || "[]");
                if (Array.isArray(parsed) && parsed.length) sports = parsed;
            } catch {
                /* keep default */
            }

            const payload = [];
            const cursorDay = new Date(start);
            while (cursorDay <= end) {
                const dayIso = cursorDay.toISOString().split("T")[0];
                let t = new Date(`${dayIso}T${openTime}:00`);
                const dayClose = new Date(`${dayIso}T${closeTime}:00`);
                let idx = 0;
                while (t.getTime() + duration * 60 * 1000 <= dayClose.getTime()) {
                    const endSlot = new Date(t.getTime() + duration * 60 * 1000);
                    const sport = sports[idx % sports.length];
                    payload.push({
                        venue_id: selVenue,
                        sport,
                        start_time: t.toISOString(),
                        end_time: endSlot.toISOString(),
                        base_price: Number(defaultPrice) || 800,
                        current_price: Number(defaultPrice) || 800,
                        is_blocked: false,
                    });
                    t = endSlot;
                    idx += 1;
                }
                cursorDay.setDate(cursorDay.getDate() + 1);
            }

            if (payload.length === 0) {
                setActionMsg("No slots to generate for that range/hours.");
                return;
            }

            const r = await fetch(`${API}/venues/${selVenue}/slots`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (r.ok) {
                setActionMsg(`Generated ${payload.length} slot(s).`);
                await reloadSlots();
            } else {
                const d = await r.json().catch(() => ({}));
                setActionMsg(d.detail || "Failed to generate slots.");
            }
        } catch (e) {
            console.error(e);
            setActionMsg("Failed to generate slots.");
        } finally {
            setGenerating(false);
        }
    };

    const saveSlotPrice = async (slotId) => {
        const price = Number(editPrice);
        if (!Number.isFinite(price) || price < 0) {
            alert("Enter a valid price");
            return;
        }
        const r = await fetch(`${API}/slots/${slotId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base_price: price, current_price: price }),
        });
        if (r.ok) {
            setEditingSlotId(null);
            await reloadSlots();
        } else {
            const d = await r.json().catch(() => ({}));
            alert(d.detail || "Failed to update slot");
        }
    };

    const toggleSlotBlock = async (slot) => {
        const r = await fetch(`${API}/slots/${slot.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_blocked: !slot.is_blocked }),
        });
        if (r.ok) await reloadSlots();
        else {
            const d = await r.json().catch(() => ({}));
            alert(d.detail || "Failed to update slot");
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

            <div className="vd-card" style={{ marginBottom: 16 }}>
                <div className="vd-card-header">
                    <span className="vd-card-title">Generate slots (date range)</span>
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                        gap: 12,
                        alignItems: "end",
                    }}
                >
                    <div className="vd-field">
                        <label className="vd-label">Start date</label>
                        <input
                            type="date"
                            className="vd-input"
                            value={genStart}
                            onChange={(e) => setGenStart(e.target.value)}
                        />
                    </div>
                    <div className="vd-field">
                        <label className="vd-label">End date</label>
                        <input
                            type="date"
                            className="vd-input"
                            value={genEnd}
                            onChange={(e) => setGenEnd(e.target.value)}
                        />
                    </div>
                    <div className="vd-field">
                        <label className="vd-label">Open</label>
                        <input
                            type="time"
                            className="vd-input"
                            value={openTime}
                            onChange={(e) => setOpenTime(e.target.value)}
                        />
                    </div>
                    <div className="vd-field">
                        <label className="vd-label">Close</label>
                        <input
                            type="time"
                            className="vd-input"
                            value={closeTime}
                            onChange={(e) => setCloseTime(e.target.value)}
                        />
                    </div>
                    <div className="vd-field">
                        <label className="vd-label">Duration (min)</label>
                        <select
                            className="vd-input"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                        >
                            <option value={30}>30</option>
                            <option value={60}>60</option>
                            <option value={90}>90</option>
                            <option value={120}>120</option>
                        </select>
                    </div>
                    <div className="vd-field">
                        <label className="vd-label">Default ₹</label>
                        <input
                            type="number"
                            className="vd-input"
                            min={0}
                            value={defaultPrice}
                            onChange={(e) => setDefaultPrice(Number(e.target.value))}
                        />
                    </div>
                    <button className="vd-btn-primary" onClick={generateRange} disabled={generating || !selVenue}>
                        {generating ? "Generating…" : "Generate"}
                    </button>
                </div>
                <p style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                    Auto-generate on view still works for empty days. This creates slots for a custom range without
                    removing that path.
                </p>
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
                        <div className="vd-empty-sub">
                            Slots auto-generate when availability is viewed, or use Generate above.
                        </div>
                    </div>
                </div>
            ) : (
                <div className="vd-slot-grid">
                    {slots.map((slot) => {
                        const status = slot.is_blocked ? "blocked" : "available";
                        const isEditing = editingSlotId === slot.id;
                        return (
                            <div key={slot.id} className={`vd-slot-tile ${status}`}>
                                <div className="vd-slot-time">
                                    {fmt(slot.start_time)} – {fmt(slot.end_time)}
                                </div>
                                <div className="vd-slot-sport" style={{ textTransform: "capitalize" }}>
                                    {slot.sport}
                                </div>
                                {isEditing ? (
                                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
                                        <input
                                            className="vd-input-sm"
                                            style={{ width: 80 }}
                                            type="number"
                                            min={0}
                                            value={editPrice}
                                            onChange={(e) => setEditPrice(e.target.value)}
                                        />
                                        <button className="vd-btn-sm primary" onClick={() => saveSlotPrice(slot.id)}>
                                            Save
                                        </button>
                                    </div>
                                ) : (
                                    <div className="vd-slot-price">₹{slot.base_price ?? slot.current_price}</div>
                                )}
                                <span
                                    className={`vd-badge ${status === "blocked" ? "red" : "green"}`}
                                    style={{ fontSize: 10, padding: "2px 8px" }}
                                >
                                    {status}
                                </span>
                                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                                    <button
                                        className="vd-btn-sm outline"
                                        onClick={() => {
                                            setEditingSlotId(slot.id);
                                            setEditPrice(String(slot.base_price ?? slot.current_price ?? ""));
                                        }}
                                    >
                                        Price
                                    </button>
                                    <button className="vd-btn-sm outline" onClick={() => toggleSlotBlock(slot)}>
                                        {slot.is_blocked ? "Unblock" : "Block"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
