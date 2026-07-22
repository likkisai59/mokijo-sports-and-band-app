"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../../../lib/api";

const emptyForm = {
    title: "",
    level: "",
    description: "",
    start_date: "",
    end_date: "",
    location: "",
    capacity: "20",
    fee: "0",
    time: "",
    days: [],
    cover_image: null,
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
};

function buildSchedule(days, time) {
    const dayPart = (days || []).join(", ");
    if (dayPart && time) return `${dayPart} at ${time}`;
    if (dayPart) return dayPart;
    if (time) return `at ${time}`;
    return null;
}

export default function CreateTrainingPage() {
    const router = useRouter();
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const trainerId = typeof window !== "undefined" ? localStorage.getItem("trainerId") : null;

    const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const toggleDay = (day) => {
        setForm((prev) => ({
            ...prev,
            days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
        }));
    };

    const handleCoverChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setError("Please choose an image file for the cover photo.");
            return;
        }
        // Keep uploads reasonably small for base64 storage
        if (file.size > 2 * 1024 * 1024) {
            setError("Cover photo must be under 2 MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            update("cover_image", reader.result);
            setError("");
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!trainerId) {
            setError("Please sign in as a trainer.");
            return;
        }
        if (!form.title.trim()) {
            setError("Title is required.");
            return;
        }

        setSaving(true);
        setError("");
        try {
            await api.post(`/trainer/${trainerId}/courses`, {
                title: form.title.trim(),
                category: "Training",
                level: form.level || null,
                description: form.description || null,
                start_date: form.start_date || null,
                end_date: form.end_date || null,
                schedule: buildSchedule(form.days, form.time),
                location: form.location || null,
                capacity: Number(form.capacity) || 20,
                fee: Number(form.fee) || 0,
                status: "open",
                cover_image: form.cover_image || null,
            });
            router.push("/trainer-dashboard/trainings");
        } catch (err) {
            setError(err?.response?.data?.detail || "Could not create training.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="vd-page"
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "calc(100vh - 120px)",
            }}
        >
            <div style={{ width: "100%", maxWidth: 640, marginBottom: 24 }}>
                <Link
                    href="/trainer-dashboard/trainings"
                    style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: 14 }}
                >
                    ← Back to My Trainings
                </Link>
                <h1 style={{ margin: "12px 0 0", fontSize: 28 }}>Create Training</h1>
                <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.45)" }}>
                    Fill in the details for your new training program
                </p>
            </div>

            {error && (
                <div style={{ color: "#f87171", marginBottom: 16, width: "100%", maxWidth: 640 }}>{error}</div>
            )}

            <form className="vd-card" onSubmit={handleSubmit} style={{ padding: 24, width: "100%", maxWidth: 640 }}>
                <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Cover photo</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                        style={{ ...inputStyle, padding: 8 }}
                    />
                    {form.cover_image && (
                        <div
                            style={{
                                marginTop: 12,
                                borderRadius: 10,
                                overflow: "hidden",
                                height: 160,
                                border: "1px solid rgba(255,255,255,0.1)",
                            }}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={form.cover_image}
                                alt="Cover preview"
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
                        Title <span style={{ color: "#f87171" }}>*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={form.title}
                        onChange={(e) => update("title", e.target.value)}
                        placeholder="e.g. Beginner Football Skills"
                        style={inputStyle}
                    />
                </div>

                <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Level</label>
                    <input
                        type="text"
                        value={form.level}
                        onChange={(e) => update("level", e.target.value)}
                        placeholder="e.g. Beginner, Intermediate"
                        style={inputStyle}
                    />
                </div>

                <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Location</label>
                    <input
                        type="text"
                        value={form.location}
                        onChange={(e) => update("location", e.target.value)}
                        placeholder="Venue or area"
                        style={inputStyle}
                    />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                    <div>
                        <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Start date</label>
                        <input
                            type="date"
                            value={form.start_date}
                            onChange={(e) => update("start_date", e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>End date</label>
                        <input
                            type="date"
                            value={form.end_date}
                            onChange={(e) => update("end_date", e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 8 }}>Days</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {DAYS.map((day) => {
                            const selected = form.days.includes(day);
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleDay(day)}
                                    style={{
                                        padding: "8px 12px",
                                        borderRadius: 8,
                                        border: selected
                                            ? "1px solid #bffe00"
                                            : "1px solid rgba(255,255,255,0.12)",
                                        background: selected ? "rgba(191,254,0,0.15)" : "rgba(255,255,255,0.04)",
                                        color: selected ? "#bffe00" : "#fff",
                                        cursor: "pointer",
                                        fontSize: 13,
                                        fontWeight: selected ? 600 : 400,
                                    }}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Time</label>
                    <input
                        type="time"
                        value={form.time}
                        onChange={(e) => update("time", e.target.value)}
                        style={inputStyle}
                    />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                    <div>
                        <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Capacity</label>
                        <input
                            type="number"
                            min="1"
                            value={form.capacity}
                            onChange={(e) => update("capacity", e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Fee (Rs.)</label>
                        <input
                            type="number"
                            min="0"
                            value={form.fee}
                            onChange={(e) => update("fee", e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Description</label>
                    <textarea
                        value={form.description}
                        onChange={(e) => update("description", e.target.value)}
                        rows={4}
                        placeholder="What will candidates learn?"
                        style={{ ...inputStyle, resize: "vertical" }}
                    />
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <Link
                        href="/trainer-dashboard/trainings"
                        style={{
                            padding: "10px 16px",
                            borderRadius: 8,
                            border: "1px solid rgba(255,255,255,0.2)",
                            color: "#fff",
                            textDecoration: "none",
                            fontSize: 14,
                        }}
                    >
                        Cancel
                    </Link>
                    <button type="submit" className="vd-btn-primary" disabled={saving}>
                        {saving ? "Creating…" : "Create Training"}
                    </button>
                </div>
            </form>
        </div>
    );
}
