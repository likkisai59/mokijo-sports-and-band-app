"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "../../../lib/api";

export default function TrainerTrainingsPage() {
    const [trainings, setTrainings] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const trainerId = typeof window !== "undefined" ? localStorage.getItem("trainerId") : null;

    const load = useCallback(async () => {
        if (!trainerId) {
            setLoading(false);
            return;
        }
        try {
            const res = await api.get(`/trainer/${trainerId}/courses`);
            setTrainings(res.data || []);
        } catch (err) {
            setError(err?.response?.data?.detail || "Could not load trainings.");
        } finally {
            setLoading(false);
        }
    }, [trainerId]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="vd-page">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 28 }}>My Trainings</h1>
                    <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.45)" }}>Create and manage your training programs</p>
                </div>
                <Link href="/trainer-dashboard/trainings/create" className="vd-btn-primary" style={{ textDecoration: "none" }}>
                    + Create Training
                </Link>
            </div>

            {error && <div style={{ color: "#f87171", marginBottom: 12 }}>{error}</div>}

            {loading ? (
                <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading…</p>
            ) : trainings.length === 0 ? (
                <div className="vd-card" style={{ padding: 28 }}>
                    <p style={{ margin: 0, color: "rgba(255,255,255,0.5)" }}>
                        No trainings yet.{" "}
                        <Link href="/trainer-dashboard/trainings/create" style={{ color: "#bffe00" }}>
                            Create your first training
                        </Link>
                        .
                    </p>
                </div>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 300px))",
                        gap: 20,
                        justifyContent: "start",
                    }}
                >
                    {trainings.map((t) => (
                        <div
                            key={t.id}
                            className="vd-card"
                            style={{
                                overflow: "hidden",
                                padding: 0,
                                display: "flex",
                                flexDirection: "column",
                                width: "100%",
                                maxWidth: 300,
                            }}
                        >
                            <div
                                style={{
                                    height: 160,
                                    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                                    position: "relative",
                                    overflow: "hidden",
                                }}
                            >
                                {t.cover_image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={t.cover_image}
                                        alt={t.title}
                                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "rgba(255,255,255,0.25)",
                                            fontSize: 13,
                                            letterSpacing: 0.04,
                                        }}
                                    >
                                        No cover photo
                                    </div>
                                )}
                            </div>
                            <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column" }}>
                                <h3 style={{ margin: 0, fontSize: 17, lineHeight: 1.3 }}>{t.title}</h3>
                                <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
                                    {t.level ? `${t.level} · ` : ""}
                                    {t.location || "Location TBD"}
                                </p>
                                {t.schedule && (
                                    <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                                        {t.schedule}
                                    </p>
                                )}
                                <p style={{ margin: "10px 0 0", fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
                                    Rs. {t.fee || 0} · {t.registration_count}/{t.capacity} seats
                                </p>
                                {t.description && (
                                    <p
                                        style={{
                                            margin: "10px 0 0",
                                            fontSize: 13,
                                            color: "rgba(255,255,255,0.55)",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {t.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
