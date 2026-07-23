"use client";
import { API_BASE_URL } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CoverImageCropper from "@/components/ui/CoverImageCropper";

const API = API_BASE_URL;

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const emptyTraining = {
    title: "",
    code: "",
    category: "Training",
    level: "",
    description: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    days: [],
    location: "",
    capacity: "20",
    fee: "0",
    status: "open",
    cover_image: null,
};

function authHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    return token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };
}

function buildSchedule(days, startTime, endTime) {
    const dayPart = Array.isArray(days) && days.length ? days.join("/") : "";
    let timePart = "";
    if (startTime && endTime) timePart = `${startTime}–${endTime}`;
    else timePart = startTime || endTime || "";
    return [dayPart, timePart].filter(Boolean).join(" · ") || null;
}

export default function CreateTrainingPage() {
    const router = useRouter();
    const [form, setForm] = useState(emptyTraining);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const trainerId = typeof window !== "undefined" ? localStorage.getItem("trainerId") : null;

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const toggleDay = (day) => {
        setForm((prev) => {
            const has = prev.days.includes(day);
            return {
                ...prev,
                days: has ? prev.days.filter((d) => d !== day) : [...prev.days, day],
            };
        });
    };

    const createTraining = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.title.trim()) {
            setError("Training title is required.");
            return;
        }
        if (form.start_time && form.end_time && form.start_time >= form.end_time) {
            setError("End time must be after start time.");
            return;
        }
        if (!trainerId) {
            setError("Trainer session missing. Please sign in again.");
            return;
        }
        setSaving(true);
        try {
            const orderedDays = WEEK_DAYS.filter((d) => form.days.includes(d));
            const schedule = buildSchedule(orderedDays, form.start_time, form.end_time);
            const res = await fetch(`${API}/trainer/${trainerId}/courses`, {
                method: "POST",
                headers: { ...authHeaders() },
                body: JSON.stringify({
                    title: form.title.trim(),
                    code: form.code || null,
                    category: form.category || "Training",
                    level: form.level || null,
                    description: form.description || null,
                    instructor: null,
                    start_date: form.start_date || null,
                    end_date: form.end_date || null,
                    start_time: form.start_time || null,
                    end_time: form.end_time || null,
                    days: orderedDays,
                    schedule,
                    location: form.location || null,
                    capacity: Number(form.capacity || 20),
                    fee: Number(form.fee || 0),
                    status: form.status || "open",
                    cover_image: form.cover_image || null,
                }),
            });
            if (res.ok) {
                router.push("/trainer-dashboard/trainings");
            } else {
                const d = await res.json().catch(() => ({}));
                setError(d.detail || "Could not create training.");
            }
        } catch (err) {
            console.error(err);
            setError("Server connection error.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 8 }}>
                <div>
                    <Link
                        href="/trainer-dashboard/trainings"
                        style={{
                            display: "inline-block",
                            marginBottom: 10,
                            fontSize: 13,
                            color: "rgba(148, 163, 184, 0.85)",
                            textDecoration: "none",
                        }}
                    >
                        ← Back to Trainings
                    </Link>
                    <h1 className="vd-page-title">Create Training</h1>
                    <p className="vd-page-sub">Add a new training session for athletes to discover</p>
                </div>
            </div>

            <div className="vd-card" style={{ maxWidth: 820, padding: 24 }}>
                {error && (
                    <div style={{ color: "#f87171", marginBottom: 16, fontSize: 14 }}>{error}</div>
                )}

                <form onSubmit={createTraining}>
                    <CoverImageCropper
                        value={form.cover_image}
                        onChange={(img) => updateField("cover_image", img)}
                        aspect={16 / 10}
                        label="Cover Photo (shown on training cards)"
                        hint="JPG, PNG — drag to reposition, zoom to crop"
                    />

                    <div className="vd-form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <div className="vd-field">
                            <label className="vd-label">Title *</label>
                            <input
                                className="vd-input"
                                value={form.title}
                                onChange={(e) => updateField("title", e.target.value)}
                                placeholder="Junior cricket foundation"
                            />
                        </div>
                        <div className="vd-field">
                            <label className="vd-label">Code</label>
                            <input
                                className="vd-input"
                                value={form.code}
                                onChange={(e) => updateField("code", e.target.value)}
                                placeholder="TRN-001"
                            />
                        </div>
                        <div className="vd-field">
                            <label className="vd-label">Level</label>
                            <input
                                className="vd-input"
                                value={form.level}
                                onChange={(e) => updateField("level", e.target.value)}
                                placeholder="Beginner / Intermediate"
                            />
                        </div>
                        <div className="vd-field">
                            <label className="vd-label">Location</label>
                            <input
                                className="vd-input"
                                value={form.location}
                                onChange={(e) => updateField("location", e.target.value)}
                                placeholder="Ground / Academy"
                            />
                        </div>
                        <div className="vd-field">
                            <label className="vd-label">Start Date</label>
                            <input
                                type="date"
                                className="vd-input"
                                value={form.start_date}
                                onChange={(e) => updateField("start_date", e.target.value)}
                            />
                        </div>
                        <div className="vd-field">
                            <label className="vd-label">End Date</label>
                            <input
                                type="date"
                                className="vd-input"
                                value={form.end_date}
                                onChange={(e) => updateField("end_date", e.target.value)}
                            />
                        </div>
                        <div className="vd-field">
                            <label className="vd-label">Start Time</label>
                            <input
                                type="time"
                                className="vd-input"
                                value={form.start_time}
                                onChange={(e) => updateField("start_time", e.target.value)}
                            />
                        </div>
                        <div className="vd-field">
                            <label className="vd-label">End Time</label>
                            <input
                                type="time"
                                className="vd-input"
                                value={form.end_time}
                                onChange={(e) => updateField("end_time", e.target.value)}
                            />
                        </div>
                        <div className="vd-field">
                            <label className="vd-label">Capacity</label>
                            <input
                                type="number"
                                className="vd-input"
                                value={form.capacity}
                                onChange={(e) => updateField("capacity", e.target.value)}
                            />
                        </div>
                        <div className="vd-field">
                            <label className="vd-label">Fee (₹)</label>
                            <input
                                type="number"
                                className="vd-input"
                                value={form.fee}
                                onChange={(e) => updateField("fee", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="vd-field" style={{ marginBottom: 18 }}>
                        <label className="vd-label">Training Days</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {WEEK_DAYS.map((day) => {
                                const selected = form.days.includes(day);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        style={{
                                            minWidth: 52,
                                            padding: "8px 12px",
                                            borderRadius: 8,
                                            border: selected
                                                ? "1px solid rgba(198, 255, 61, 0.45)"
                                                : "1px solid rgba(255,255,255,0.12)",
                                            background: selected
                                                ? "rgba(198, 255, 61, 0.15)"
                                                : "rgba(255,255,255,0.03)",
                                            color: selected ? "#c6ff3d" : "rgba(226,232,240,0.85)",
                                            fontWeight: 700,
                                            fontSize: 13,
                                            cursor: "pointer",
                                        }}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                        {(form.days.length > 0 || form.start_time || form.end_time) && (
                            <p style={{ margin: "10px 0 0", fontSize: 12, color: "rgba(148,163,184,0.7)" }}>
                                Schedule preview:{" "}
                                {buildSchedule(
                                    WEEK_DAYS.filter((d) => form.days.includes(d)),
                                    form.start_time,
                                    form.end_time
                                ) || "—"}
                            </p>
                        )}
                    </div>

                    <div className="vd-field" style={{ marginBottom: 20 }}>
                        <label className="vd-label">Description</label>
                        <textarea
                            className="vd-input"
                            rows={4}
                            value={form.description}
                            onChange={(e) => updateField("description", e.target.value)}
                            placeholder="What will athletes learn?"
                            style={{ resize: "vertical" }}
                        />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                        <Link href="/trainer-dashboard/trainings" className="vd-btn-ghost" style={{ textDecoration: "none" }}>
                            Cancel
                        </Link>
                        <button type="submit" className="vd-btn-primary" disabled={saving}>
                            {saving ? "Creating…" : "Create Training"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
