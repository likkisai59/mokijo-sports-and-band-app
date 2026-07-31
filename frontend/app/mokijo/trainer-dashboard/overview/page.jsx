"use client";
import { API_BASE_URL } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

const API = API_BASE_URL;

function authHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function StatCard({ icon, value, label, color }) {
    return (
        <div className="vd-stat-card">
            <div className={`vd-stat-icon ${color}`}>{icon}</div>
            <div className="vd-stat-value">{value}</div>
            <div className="vd-stat-label">{label}</div>
        </div>
    );
}

function dateText(value) {
    if (!value) return "Not scheduled";
    return value;
}

export default function TrainerOverviewPage() {
    const [trainings, setTrainings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const trainerId = localStorage.getItem("trainerId");
        if (!trainerId) return;

        const load = async () => {
            try {
                const res = await fetch(`${API}/trainer/${trainerId}/courses`, {
                    headers: { ...authHeaders() },
                });
                const data = res.ok ? await res.json() : [];
                setTrainings(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const openCount = trainings.filter((t) => t.status === "open").length;
    const rescheduledCount = trainings.filter((t) => t.reschedule_reason).length;

    if (loading)
        return (
            <div className="vd-loading">
                <div className="vd-spinner" /> Loading overview…
            </div>
        );

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div>
                    <h1 className="vd-page-title">Overview</h1>
                    <p className="vd-page-sub">Your trainings at a glance</p>
                </div>
                <Link
                    href="/trainer-dashboard/trainings/create"
                    className="vd-btn-primary"
                    style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                >
                    + Create Training
                </Link>
            </div>

            <div className="vd-stats-row">
                <StatCard
                    color="green"
                    value={trainings.length}
                    label="Total Trainings"
                    icon={
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                    }
                />
                <StatCard
                    color="cyan"
                    value={openCount}
                    label="Open Trainings"
                    icon={
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    }
                />
                <StatCard
                    color="orange"
                    value={rescheduledCount}
                    label="Rescheduled"
                    icon={
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10" />
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                    }
                />
            </div>

            <div className="vd-card">
                <div className="vd-card-header">
                    <span className="vd-card-title">Your Trainings</span>
                    <Link href="/trainer-dashboard/trainings" className="vd-card-action">
                        Manage →
                    </Link>
                </div>

                {trainings.length === 0 ? (
                    <div className="vd-empty">
                        <div className="vd-empty-icon">📋</div>
                        <div className="vd-empty-text">No trainings yet — create your first</div>
                        <div className="vd-empty-sub">Use Create Training in the top right to get started.</div>
                    </div>
                ) : (
                    <table className="vd-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Dates</th>
                                <th>Schedule</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Reschedule</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trainings.map((t) => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: 600 }}>{t.title}</td>
                                    <td>
                                        {dateText(t.start_date)}
                                        {t.end_date ? ` → ${dateText(t.end_date)}` : ""}
                                    </td>
                                    <td>{t.schedule || "—"}</td>
                                    <td>{t.location || "—"}</td>
                                    <td>
                                        <span className={`vd-badge ${t.status === "open" ? "green" : "gray"}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td>
                                        {t.reschedule_reason ? (
                                            <span className="vd-badge orange" title={t.reschedule_reason}>
                                                Rescheduled
                                            </span>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}
