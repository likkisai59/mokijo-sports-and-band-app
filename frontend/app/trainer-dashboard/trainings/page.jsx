"use client";
import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";

const API = API_BASE_URL;

function authHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    return token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };
}

function dateText(value) {
    if (!value) return "Not scheduled";
    return value;
}

export default function TrainerTrainingsPage() {
    const [trainings, setTrainings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [rescheduleTarget, setRescheduleTarget] = useState(null);
    const [rescheduleForm, setRescheduleForm] = useState({
        start_date: "",
        end_date: "",
        schedule: "",
        reason: "",
    });

    const trainerId = typeof window !== "undefined" ? localStorage.getItem("trainerId") : null;

    const load = async () => {
        if (!trainerId) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`${API}/trainer/${trainerId}/courses`, {
                headers: { ...authHeaders() },
            });
            if (res.ok) setTrainings(await res.json());
            else setTrainings([]);
        } catch (e) {
            console.error(e);
            setError("Could not load trainings.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const openReschedule = (training) => {
        setRescheduleTarget(training);
        setRescheduleForm({
            start_date: training.start_date || "",
            end_date: training.end_date || "",
            schedule: training.schedule || "",
            reason: "",
        });
        setError("");
    };

    const submitReschedule = async (e) => {
        e.preventDefault();
        setError("");
        if (!String(rescheduleForm.reason || "").trim()) {
            setError("Reschedule reason is required (e.g. Rain, Venue unavailable).");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(
                `${API}/trainer/${trainerId}/courses/${rescheduleTarget.id}/reschedule`,
                {
                    method: "POST",
                    headers: { ...authHeaders() },
                    body: JSON.stringify({
                        start_date: rescheduleForm.start_date || null,
                        end_date: rescheduleForm.end_date || null,
                        schedule: rescheduleForm.schedule || null,
                        reason: rescheduleForm.reason.trim(),
                    }),
                }
            );
            if (res.ok) {
                setRescheduleTarget(null);
                await load();
            } else {
                const d = await res.json().catch(() => ({}));
                setError(d.detail || "Could not reschedule training.");
            }
        } catch (err) {
            console.error(err);
            setError("Server connection error.");
        } finally {
            setSaving(false);
        }
    };

    const deleteTraining = async (training) => {
        if (!window.confirm(`Delete training "${training.title}"?`)) return;
        try {
            const res = await fetch(`${API}/trainer/${trainerId}/courses/${training.id}`, {
                method: "DELETE",
                headers: { ...authHeaders() },
            });
            if (res.ok) await load();
            else {
                const d = await res.json().catch(() => ({}));
                setError(d.detail || "Could not delete training.");
            }
        } catch (err) {
            console.error(err);
            setError("Server connection error.");
        }
    };

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div>
                    <h1 className="vd-page-title">Trainings</h1>
                    <p className="vd-page-sub">Create, list, and reschedule your training sessions</p>
                </div>
                <Link href="/trainer-dashboard/trainings/create" className="vd-btn-primary" style={{ textDecoration: "none" }}>
                    + Create Training
                </Link>
            </div>

            {error && !rescheduleTarget && (
                <div style={{ color: "#f87171", marginBottom: 12, fontSize: 14 }}>{error}</div>
            )}

            {loading ? (
                <div className="vd-loading">
                    <div className="vd-spinner" /> Loading trainings…
                </div>
            ) : trainings.length === 0 ? (
                <div className="vd-card">
                    <div className="vd-empty">
                        <div className="vd-empty-icon">📋</div>
                        <div className="vd-empty-text">No trainings yet — create your first</div>
                        <div className="vd-empty-sub">Use Create Training in the top right to get started.</div>
                        <Link
                            href="/trainer-dashboard/trainings/create"
                            className="vd-btn-primary"
                            style={{ textDecoration: "none", marginTop: 16, display: "inline-block" }}
                        >
                            + Create Training
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="vd-card">
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                            gap: 16,
                            padding: 4,
                        }}
                    >
                        {trainings.map((t) => (
                            <div
                                key={t.id}
                                style={{
                                    background: "rgba(255,255,255,0.02)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    borderRadius: 14,
                                    overflow: "hidden",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <div style={{ height: 140, background: "rgba(255,255,255,0.04)" }}>
                                    <img
                                        src={
                                            t.cover_image ||
                                            "https://images.unsplash.com/photo-1517649763962-0c6238842e77?q=80&w=600&auto=format&fit=crop"
                                        }
                                        alt={t.title}
                                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                    />
                                </div>
                                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                                        <div style={{ fontWeight: 700, fontSize: 15 }}>{t.title}</div>
                                        <span className={`vd-badge ${t.status === "open" ? "green" : "gray"}`}>
                                            {t.status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                                        <div>
                                            {dateText(t.start_date)}
                                            {t.end_date ? ` → ${dateText(t.end_date)}` : ""}
                                        </div>
                                        <div>{t.schedule || "Schedule TBA"}</div>
                                        <div>{t.location || "Location TBA"}</div>
                                    </div>
                                    {t.reschedule_reason && (
                                        <div style={{ fontSize: 12, color: "#fb923c" }}>
                                            Rescheduled: {t.reschedule_reason}
                                        </div>
                                    )}
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: "auto", paddingTop: 8 }}>
                                        <button className="vd-btn-sm primary" onClick={() => openReschedule(t)}>
                                            Reschedule
                                        </button>
                                        <button className="vd-btn-sm outline" onClick={() => deleteTraining(t)}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {rescheduleTarget && (
                <div
                    className="vd-modal-overlay"
                    onClick={(e) => e.target === e.currentTarget && setRescheduleTarget(null)}
                >
                    <div className="vd-modal" style={{ maxWidth: 560 }}>
                        <div className="vd-modal-header">
                            <span className="vd-modal-title">Reschedule — {rescheduleTarget.title}</span>
                            <button className="vd-modal-close" onClick={() => setRescheduleTarget(null)}>
                                ×
                            </button>
                        </div>

                        {error && (
                            <div style={{ color: "#f87171", marginBottom: 12, fontSize: 14 }}>{error}</div>
                        )}

                        <form onSubmit={submitReschedule}>
                            <div className="vd-form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                                <div className="vd-field">
                                    <label className="vd-label">New Start Date</label>
                                    <input
                                        type="date"
                                        className="vd-input"
                                        value={rescheduleForm.start_date}
                                        onChange={(e) =>
                                            setRescheduleForm((p) => ({ ...p, start_date: e.target.value }))
                                        }
                                    />
                                </div>
                                <div className="vd-field">
                                    <label className="vd-label">New End Date</label>
                                    <input
                                        type="date"
                                        className="vd-input"
                                        value={rescheduleForm.end_date}
                                        onChange={(e) =>
                                            setRescheduleForm((p) => ({ ...p, end_date: e.target.value }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="vd-field" style={{ marginBottom: 14 }}>
                                <label className="vd-label">New Schedule</label>
                                <input
                                    className="vd-input"
                                    value={rescheduleForm.schedule}
                                    onChange={(e) =>
                                        setRescheduleForm((p) => ({ ...p, schedule: e.target.value }))
                                    }
                                    placeholder="Tue/Thu 7–9 PM"
                                />
                            </div>

                            <div className="vd-field" style={{ marginBottom: 14 }}>
                                <label className="vd-label">Reason *</label>
                                <input
                                    className="vd-input"
                                    value={rescheduleForm.reason}
                                    onChange={(e) =>
                                        setRescheduleForm((p) => ({ ...p, reason: e.target.value }))
                                    }
                                    placeholder="Rain, Venue unavailable, …"
                                    list="reschedule-reasons"
                                />
                                <datalist id="reschedule-reasons">
                                    <option value="Rain" />
                                    <option value="Venue unavailable" />
                                    <option value="Instructor unavailable" />
                                    <option value="Other" />
                                </datalist>
                            </div>

                            <div className="vd-modal-actions">
                                <button
                                    type="button"
                                    className="vd-btn-ghost"
                                    onClick={() => setRescheduleTarget(null)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="vd-btn-primary" disabled={saving}>
                                    {saving ? "Saving…" : "Confirm Reschedule"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
