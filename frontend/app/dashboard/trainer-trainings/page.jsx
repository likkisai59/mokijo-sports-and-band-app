"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "../../../lib/api";

function money(value) {
    return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function TrainerTrainingsBrowsePage() {
    const [trainings, setTrainings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            const res = await api.get("/trainings/public");
            setTrainings(res.data || []);
        } catch (err) {
            setError(err?.response?.data?.detail || "Could not load trainer trainings.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div style={{ padding: "24px" }}>
            <h1 style={{ marginTop: 0 }}>Trainer Trainings</h1>
            <p style={{ color: "#64748b", marginBottom: 20 }}>
                Open trainings offered by independent trainers. Register and pay online.
            </p>

            {error && <div style={{ color: "#dc2626", marginBottom: 12 }}>{error}</div>}
            {loading ? (
                <p>Loading…</p>
            ) : trainings.length === 0 ? (
                <p style={{ color: "#64748b" }}>No open trainer trainings right now.</p>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 300px))",
                        gap: 20,
                    }}
                >
                    {trainings.map((t) => (
                        <Link
                            key={t.id}
                            href={`/dashboard/trainer-trainings/${t.id}`}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                textDecoration: "none",
                                color: "inherit",
                                border: "1px solid #e2e8f0",
                                borderRadius: 12,
                                overflow: "hidden",
                                background: "#fff",
                                maxWidth: 300,
                            }}
                        >
                            <div style={{ height: 160, background: "#e2e8f0" }}>
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
                                            color: "#94a3b8",
                                            fontSize: 13,
                                        }}
                                    >
                                        No cover photo
                                    </div>
                                )}
                            </div>
                            <div style={{ padding: 14 }}>
                                <div style={{ fontWeight: 700, fontSize: 16 }}>{t.title}</div>
                                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                                    {t.trainer_name || t.instructor || "Trainer"}
                                    {t.schedule ? ` · ${t.schedule}` : ""}
                                </div>
                                <div style={{ fontSize: 13, color: "#475569", marginTop: 8 }}>
                                    {money(t.fee)} · {t.available_seats} seats left
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
