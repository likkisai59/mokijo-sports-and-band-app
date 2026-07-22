"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "../../../lib/api";

export default function TrainerOverviewPage() {
    const [stats, setStats] = useState(null);
    const [trainings, setTrainings] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const trainerId = typeof window !== "undefined" ? localStorage.getItem("trainerId") : null;

    const load = useCallback(async () => {
        if (!trainerId) {
            setLoading(false);
            setError("Please sign in as a trainer.");
            return;
        }
        try {
            const [statsRes, coursesRes, candsRes] = await Promise.all([
                api.get(`/trainer/${trainerId}/stats`),
                api.get(`/trainer/${trainerId}/courses`),
                api.get(`/trainer/${trainerId}/candidates`),
            ]);
            setStats(statsRes.data);
            setTrainings(coursesRes.data || []);
            setCandidates((candsRes.data || []).slice(0, 8));
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.detail || "Could not load dashboard.");
        } finally {
            setLoading(false);
        }
    }, [trainerId]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return <div className="vd-page"><p style={{ color: "rgba(255,255,255,0.5)" }}>Loading…</p></div>;
    }

    return (
        <div className="vd-page">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 28 }}>Overview</h1>
                    <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.45)" }}>Your trainings and candidates at a glance</p>
                </div>
                <Link href="/trainer-dashboard/trainings/create" className="vd-btn-primary" style={{ textDecoration: "none" }}>
                    + Create Training
                </Link>
            </div>

            {error && <div className="vd-alert vd-alert-error" style={{ marginBottom: 16 }}>{error}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 28 }}>
                {[
                    { label: "Trainings", value: stats?.total_trainings ?? 0 },
                    { label: "Open", value: stats?.open_trainings ?? 0 },
                    { label: "Registered", value: stats?.total_registered ?? 0 },
                    { label: "Seats left", value: stats?.seats_left ?? 0 },
                ].map((card) => (
                    <div key={card.label} className="vd-card" style={{ padding: 16 }}>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 0.5 }}>{card.label}</div>
                        <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{card.value}</div>
                    </div>
                ))}
            </div>

            <h2 style={{ fontSize: 18, marginBottom: 12 }}>Your trainings</h2>
            {trainings.length === 0 ? (
                <div className="vd-card" style={{ padding: 24, marginBottom: 28 }}>
                    <p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>No trainings yet — create your first.</p>
                </div>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 260px))",
                        gap: 16,
                        marginBottom: 28,
                    }}
                >
                    {trainings.slice(0, 6).map((t) => (
                        <div
                            key={t.id}
                            className="vd-card"
                            style={{ overflow: "hidden", padding: 0, maxWidth: 260 }}
                        >
                            <div style={{ height: 120, background: "#1a1a2e" }}>
                                {t.cover_image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={t.cover_image}
                                        alt={t.title}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                ) : null}
                            </div>
                            <div style={{ padding: 12 }}>
                                <div style={{ fontWeight: 600 }}>{t.title}</div>
                                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
                                    {t.schedule || "No schedule"} · {t.registration_count}/{t.capacity}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h2 style={{ fontSize: 18, margin: 0 }}>Recent candidates</h2>
                <Link href="/trainer-dashboard/candidates" style={{ color: "#bffe00", fontSize: 14 }}>View all</Link>
            </div>
            {candidates.length === 0 ? (
                <div className="vd-card" style={{ padding: 24 }}>
                    <p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>No candidates registered yet.</p>
                </div>
            ) : (
                <div style={{ display: "grid", gap: 8 }}>
                    {candidates.map((c) => (
                        <div key={c.id} className="vd-card" style={{ padding: 14, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>{c.participant_name}</div>
                                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{c.course_title} · {c.participant_email || "—"}</div>
                            </div>
                            <div style={{ fontSize: 12, alignSelf: "center" }}>
                                {c.payment_status}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
