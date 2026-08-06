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

function slotDisplayStatus(slot) {
    const status = (slot.status || "").toUpperCase();
    if (status === "BOOKED") return "booked";
    if (status === "HELD") return "held";
    if (slot.is_blocked || status === "BLOCKED") return "blocked";
    return "available";
}

export default function SlotsPage() {
    const [venues, setVenues] = useState([]);
    const [selVenue, setSelVenue] = useState(null);
    const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionMsg, setActionMsg] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingSlot, setEditingSlot] = useState(null);
    const [newSlot, setNewSlot] = useState(emptyNewSlot());
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");
    const [togglingId, setTogglingId] = useState(null);

    useEffect(() => {
        const ownerId =
            localStorage.getItem("venueOwnerId") ||
            localStorage.getItem("userId") ||
            localStorage.getItem("owner_id") ||
            localStorage.getItem("group_owner_id");

        const fetchUrl = ownerId
            ? `${API}/venue-owner/${ownerId}/venues`
            : `${API}/venues?registered=true`;

        fetch(fetchUrl)
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                const list = Array.isArray(data) ? data : [];
                if (list.length > 0) {
                    setVenues(list);
                    setSelVenue(list[0].id);
                } else {
                    fetch(`${API}/venues?registered=true`)
                        .then((r) => (r.ok ? r.json() : []))
                        .then((allVenues) => {
                            const allList = Array.isArray(allVenues) ? allVenues : [];
                            setVenues(allList);
                            if (allList.length > 0) setSelVenue(allList[0].id);
                        });
                }
            })
            .catch(() => {
                fetch(`${API}/venues?registered=true`)
                    .then((r) => (r.ok ? r.json() : []))
                    .then((allVenues) => {
                        const allList = Array.isArray(allVenues) ? allVenues : [];
                        setVenues(allList);
                        if (allList.length > 0) setSelVenue(allList[0].id);
                    });
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
        setEditingSlot(null);
        setCreateError("");
        setActionMsg("");
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

    const toggleSlotBlock = async (slot) => {
        if (!selVenue || togglingId) return;
        const display = slotDisplayStatus(slot);
        if (display === "booked" || display === "held") {
            setActionMsg(
                display === "booked"
                    ? "This slot is booked and cannot be blocked or unblocked."
                    : "This slot is on hold and cannot be blocked or unblocked."
            );
            return;
        }

        const action = display === "blocked" ? "unblock" : "block";
        setActionMsg("");
        setTogglingId(slot.id);
        try {
            const r = await fetch(`${API}/venues/${selVenue}/slots/${slot.id}/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const d = await r.json().catch(() => ({}));
            if (r.ok) {
                setSlots((prev) =>
                    prev.map((s) =>
                        s.id === slot.id
                            ? {
                                  ...s,
                                  is_blocked: action === "block",
                                  status: action === "block" ? "BLOCKED" : "AVAILABLE",
                              }
                            : s
                    )
                );
                setActionMsg(
                    action === "block"
                        ? "Slot blocked — bookers will see it as unavailable."
                        : "Slot unblocked — bookers can book it again."
                );
            } else {
                setActionMsg(d.detail || `Failed to ${action} slot.`);
            }
        } catch {
            setActionMsg("Cannot connect to server.");
        } finally {
            setTogglingId(null);
        }
    };

    const openEditExistingSlot = (slot) => {
        setEditingSlot(slot);
        let startStr = "07:00";
        let endStr = "08:00";
        try {
            if (slot.start_time) startStr = new Date(slot.start_time).toISOString().substring(11, 16);
            if (slot.end_time) endStr = new Date(slot.end_time).toISOString().substring(11, 16);
        } catch (e) {}

        setNewSlot({
            sport: slot.sport || venueSports[0],
            start_time: startStr,
            end_time: endStr,
            base_price: slot.current_price || slot.base_price || 1000,
        });
        setCreateError("");
        setShowForm(true);
    };

    const saveOrUpdateSlot = async () => {
        setCreateError("");
        const targetVenueId = selVenue || (venues.length > 0 ? venues[0].id : null);
        if (!targetVenueId) {
            setCreateError("No venue selected or registered. Please register a venue first.");
            return;
        }
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
            const cleanTime = (t) => {
                if (!t) return "00:00:00";
                const parts = t.split(":");
                const h = (parts[0] || "00").padStart(2, "0");
                const m = (parts[1] || "00").padStart(2, "0");
                return `${h}:${m}:00`;
            };

            const dateOnly = date ? date.split("T")[0] : new Date().toISOString().split("T")[0];
            const startISO = `${dateOnly}T${cleanTime(newSlot.start_time)}`;
            const endISO = `${dateOnly}T${cleanTime(newSlot.end_time)}`;

            if (editingSlot) {
                const r = await fetch(`${API}/venues/${targetVenueId}/slots/${editingSlot.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sport: newSlot.sport,
                        start_time: startISO,
                        end_time: endISO,
                        base_price: price,
                        current_price: price,
                    }),
                });
                if (r.ok) {
                    setShowForm(false);
                    setEditingSlot(null);
                    setNewSlot(emptyNewSlot(venueSports[0]));
                    loadSlots();
                } else {
                    const d = await r.json().catch(() => ({}));
                    const msg = typeof d.detail === "string" ? d.detail : (Array.isArray(d.detail) ? d.detail.map(e => e.msg || JSON.stringify(e)).join(", ") : "Failed to update slot.");
                    setCreateError(msg);
                }
            } else {
                const payload = [
                    {
                        venue_id: targetVenueId,
                        sport: newSlot.sport,
                        start_time: startISO,
                        end_time: endISO,
                        base_price: price,
                        current_price: price,
                        is_blocked: false,
                    },
                ];
                const r = await fetch(`${API}/venues/${targetVenueId}/slots`, {
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
                    const msg = typeof d.detail === "string" ? d.detail : (Array.isArray(d.detail) ? d.detail.map(e => e.msg || JSON.stringify(e)).join(", ") : "Failed to create slot.");
                    setCreateError(msg);
                }
            }
        } catch (err) {
            setCreateError("Cannot connect to server.");
        } finally {
            setCreating(false);
        }
    };

    const deleteSlot = async (slotId) => {
        if (!confirm("Are you sure you want to delete this slot?")) return;
        try {
            const r = await fetch(`${API}/venues/${selVenue}/slots/${slotId}`, { method: "DELETE" });
            if (r.ok) {
                loadSlots();
            } else {
                setActionMsg("Failed to delete slot.");
            }
        } catch {
            setActionMsg("Error deleting slot.");
        }
    };

    const fmt = (iso) => {
        if (!iso) return "";
        const d = new Date(iso);
        return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    };

    const badgeClass = {
        available: "green",
        blocked: "red",
        booked: "blue",
        held: "yellow",
    };

    return (
        <>
            <h1 className="vd-page-title">Slots &amp; Availability</h1>
            <p className="vd-page-sub">View and manage time slots for each venue. Edit details, block, unblock or add slots anytime.</p>

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
                    type="button"
                    className="vd-btn-primary"
                    onClick={() => {
                        setEditingSlot(null);
                        setNewSlot(emptyNewSlot(venueSports[0]));
                        setCreateError("");
                        setShowForm((s) => !s);
                    }}
                >
                    {showForm ? "Cancel" : "+ Add Slot"}
                </button>
                <button
                    type="button"
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
                    type="button"
                    className="vd-btn-primary"
                    style={{
                        background: "rgba(198,255,61,0.15)",
                        color: "#c6ff3d",
                        border: "1px solid rgba(198,255,61,0.3)",
                    }}
                    onClick={() => blockAction("unblock")}
                >
                    Unblock All Day
                </button>
            </div>

            {actionMsg && <p style={{ color: "#c6ff3d", fontSize: 13, marginBottom: 14 }}>{actionMsg}</p>}

            {showForm && (
                <form
                    className="vd-card"
                    style={{ marginBottom: 20 }}
                    onSubmit={(e) => {
                        e.preventDefault();
                        saveOrUpdateSlot();
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            marginBottom: 14,
                        }}
                    >
                        <div style={{ fontSize: 14, fontWeight: 700 }}>
                            {editingSlot ? `Edit Slot Details (#${editingSlot.id})` : `Create Slot for ${date}`}
                        </div>
                        <button
                            type="submit"
                            className="vd-btn-primary"
                            disabled={creating}
                            style={{ flexShrink: 0 }}
                        >
                            {creating ? "Saving…" : editingSlot ? "Update Slot" : "Create Slot"}
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
                </form>
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
                        const status = slotDisplayStatus(slot);
                        const canToggle = status === "available" || status === "blocked";
                        const busy = togglingId === slot.id;
                        return (
                            <div key={slot.id} className={`vd-slot-tile ${status}`} style={{ position: "relative" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                                    <div className="vd-slot-time">
                                        {fmt(slot.start_time)} – {fmt(slot.end_time)}
                                    </div>
                                    <div style={{ display: "flex", gap: "4px" }}>
                                        <button
                                            type="button"
                                            title="Edit Slot"
                                            onClick={() => openEditExistingSlot(slot)}
                                            style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: "4px", padding: "2px 6px", fontSize: "11px", cursor: "pointer" }}
                                        >
                                            ✎
                                        </button>
                                        <button
                                            type="button"
                                            title="Delete Slot"
                                            onClick={() => deleteSlot(slot.id)}
                                            style={{ background: "rgba(239,68,68,0.25)", border: "none", color: "#f87171", borderRadius: "4px", padding: "2px 6px", fontSize: "11px", cursor: "pointer" }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                                <div className="vd-slot-sport" style={{ textTransform: "capitalize" }}>
                                    {slot.sport}
                                </div>
                                <div className="vd-slot-price">₹{slot.base_price}</div>
                                <span
                                    className={`vd-badge ${badgeClass[status] || "gray"}`}
                                    style={{ fontSize: 10, padding: "2px 8px" }}
                                >
                                    {status}
                                </span>
                                {canToggle ? (
                                    <button
                                        type="button"
                                        className={`vd-slot-action ${status === "blocked" ? "unblock" : "block"}`}
                                        disabled={busy || !!togglingId}
                                        onClick={() => toggleSlotBlock(slot)}
                                    >
                                        {busy ? "Updating…" : status === "blocked" ? "Unblock" : "Block"}
                                    </button>
                                ) : (
                                    <div className="vd-slot-action locked">
                                        {status === "booked" ? "Booked" : "On hold"}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
