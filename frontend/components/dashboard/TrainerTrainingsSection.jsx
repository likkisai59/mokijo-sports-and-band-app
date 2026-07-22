"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

/**
 * Open trainer trainings — same medium card layout as the trainer module.
 */
export default function TrainerTrainingsSection({ detailBase = "/dashboard/trainer-trainings" }) {
    const [trainings, setTrainings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
                const res = await fetch(`${API_BASE_URL}/trainings/public`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (res.ok) {
                    setTrainings((await res.json()) || []);
                }
            } catch (err) {
                console.error("Failed to load trainer trainings:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <section id="trainer-trainings" style={{ marginTop: 28, marginBottom: 8 }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 20, color: "#0f172a" }}>Open Trainings</h2>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "#64748b" }}>
                Trainings from trainers — register and pay from your dashboard.
            </p>

            {loading ? (
                <p style={{ color: "#64748b", fontSize: 14 }}>Loading trainings…</p>
            ) : trainings.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: 14 }}>No open trainings right now.</p>
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
                        <Link
                            key={t.id}
                            href={`${detailBase}/${t.id}`}
                            style={{
                                overflow: "hidden",
                                padding: 0,
                                display: "flex",
                                flexDirection: "column",
                                width: "100%",
                                maxWidth: 300,
                                textDecoration: "none",
                                color: "#f1f5f9",
                                background: "#0f0f1a",
                                border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: 14,
                                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
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
                                <h3 style={{ margin: 0, fontSize: 17, lineHeight: 1.3, color: "#f1f5f9" }}>{t.title}</h3>
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
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
}
