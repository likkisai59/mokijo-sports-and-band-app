"use client";
import { useCallback, useEffect, useState } from "react";
import api from "../../../lib/api";

export default function TrainerCandidatesPage() {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const trainerId = typeof window !== "undefined" ? localStorage.getItem("trainerId") : null;

    const load = useCallback(async () => {
        if (!trainerId) {
            setLoading(false);
            return;
        }
        try {
            const res = await api.get(`/trainer/${trainerId}/candidates`);
            setCandidates(res.data || []);
        } catch (err) {
            setError(err?.response?.data?.detail || "Could not load candidates.");
        } finally {
            setLoading(false);
        }
    }, [trainerId]);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = candidates.filter((c) => {
        const q = search.toLowerCase();
        if (!q) return true;
        return (
            (c.participant_name || "").toLowerCase().includes(q) ||
            (c.participant_email || "").toLowerCase().includes(q) ||
            (c.course_title || "").toLowerCase().includes(q)
        );
    });

    return (
        <div className="vd-page">
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ margin: 0, fontSize: 28 }}>Candidates</h1>
                <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.45)" }}>
                    People registered for your trainings ({candidates.length})
                </p>
            </div>

            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or training…"
                style={{
                    width: "100%",
                    maxWidth: 420,
                    marginBottom: 16,
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    color: "#fff",
                }}
            />

            {error && <div style={{ color: "#f87171", marginBottom: 12 }}>{error}</div>}

            {loading ? (
                <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading…</p>
            ) : filtered.length === 0 ? (
                <div className="vd-card" style={{ padding: 24 }}>
                    <p style={{ margin: 0, color: "rgba(255,255,255,0.5)" }}>No candidates found.</p>
                </div>
            ) : (
                <div style={{ display: "grid", gap: 10 }}>
                    {filtered.map((c) => (
                        <div key={c.id} className="vd-card" style={{ padding: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{c.participant_name}</div>
                                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
                                        {c.course_title || "Training"} · {c.participant_email || "—"} · {c.participant_phone || "—"}
                                    </div>
                                </div>
                                <div style={{ textAlign: "right", fontSize: 13 }}>
                                    <div>{c.status}</div>
                                    <div style={{ color: c.payment_status === "paid" ? "#bffe00" : "rgba(255,255,255,0.55)" }}>
                                        {c.payment_status}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
