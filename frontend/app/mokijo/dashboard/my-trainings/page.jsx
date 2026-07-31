"use client";

import api, { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import "@/app/styles/venues.css";

export default function MemberMyTrainingsPage() {
    const [trainings, setTrainings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const userId = localStorage.getItem("userId") || localStorage.getItem("memberId") || "0";
        if (!userId || userId === "0") {
            setError("Session expired. Please log in.");
            setLoading(false);
            return;
        }

        api.get(`/users/${userId}/training-registrations`)
            .then((res) => {
                setTrainings(Array.isArray(res.data) ? res.data : []);
            })
            .catch((err) => {
                console.error("Error loading user training registrations:", err);
                const msg = err?.response?.data?.detail || "Failed to load your booked trainings.";
                setError(msg);
            })
            .finally(() => setLoading(false));
    }, []);

    const formatDate = (value) => {
        if (!value) return "—";
        try {
            return new Date(value).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
        } catch {
            return value;
        }
    };

    return (
        <div className="venues-container">
            <header className="venues-header">
                <div>
                    <h1>My Booked Trainings</h1>
                    <p>Booked trainings and academy courses list</p>
                </div>
            </header>

            {loading ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                    <p>Loading booked trainings...</p>
                </div>
            ) : error ? (
                <div className="empty-slots-box" style={{ padding: 40 }}>
                    <p style={{ color: "var(--rose)" }}>{error}</p>
                </div>
            ) : trainings.length === 0 ? (
                <div className="empty-slots-box" style={{ padding: 60 }}>
                    <p>No booked trainings yet.</p>
                    <Link
                        href="/dashboard/courses"
                        className="book-now-text"
                        style={{ marginTop: 12, display: "inline-block" }}
                    >
                        Browse & Book Trainings →
                    </Link>
                </div>
            ) : (
                <div style={{ width: "100%", overflowX: "auto" }}>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            textAlign: "left",
                            fontSize: 14,
                        }}
                    >
                        <thead>
                            <tr>
                                {[
                                    "Training",
                                    "Trainer",
                                    "Contact",
                                    "Category",
                                    "Location",
                                    "Schedule",
                                    "Fee",
                                    "Status",
                                    "",
                                ].map((label) => (
                                    <th
                                        key={label || "action"}
                                        style={{
                                            padding: "12px 14px",
                                            borderBottom: "1px solid var(--border)",
                                            color: "var(--text-secondary)",
                                            fontWeight: 600,
                                            fontSize: 12,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.4px",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {trainings.map((t) => {
                                const payment = (t.payment_status || "unpaid").toLowerCase();
                                const isPaid = payment === "paid" || payment === "waived";
                                const paymentLabel =
                                    payment === "waived" ? "FREE" : payment === "paid" ? "PAID" : "UNPAID";
                                const dateLabel = [formatDate(t.start_date), formatDate(t.end_date)]
                                    .filter((d) => d !== "—")
                                    .join(" – ");
                                const scheduleText = dateLabel || t.schedule || "Scheduled session";
                                const feeText = Number(t.fee || 0) > 0 ? `₹${Number(t.fee).toLocaleString("en-IN")}` : "Free";

                                return (
                                    <tr key={t.id}>
                                        <td
                                            style={{
                                                padding: "14px",
                                                borderBottom: "1px solid var(--border)",
                                                color: "var(--text-primary)",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {t.title}
                                        </td>
                                        <td
                                            style={{
                                                padding: "14px",
                                                borderBottom: "1px solid var(--border)",
                                                color: "var(--text-secondary)",
                                            }}
                                        >
                                            {t.trainer_name || "Trainer Session"}
                                        </td>
                                        <td
                                            style={{
                                                padding: "14px",
                                                borderBottom: "1px solid var(--border)",
                                                color: "var(--text-secondary)",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {t.trainer_phone || "—"}
                                        </td>
                                        <td
                                            style={{
                                                padding: "14px",
                                                borderBottom: "1px solid var(--border)",
                                                color: "var(--text-secondary)",
                                                textTransform: "capitalize",
                                            }}
                                        >
                                            {t.category || "Training"}
                                        </td>
                                        <td
                                            style={{
                                                padding: "14px",
                                                borderBottom: "1px solid var(--border)",
                                                color: "var(--text-secondary)",
                                            }}
                                        >
                                            {t.location || "—"}
                                        </td>
                                        <td
                                            style={{
                                                padding: "14px",
                                                borderBottom: "1px solid var(--border)",
                                                color: "var(--text-secondary)",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {scheduleText}
                                        </td>
                                        <td
                                            style={{
                                                padding: "14px",
                                                borderBottom: "1px solid var(--border)",
                                                color: "var(--text-primary)",
                                                fontWeight: 600,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {feeText}
                                        </td>
                                        <td
                                            style={{
                                                padding: "14px",
                                                borderBottom: "1px solid var(--border)",
                                                color: isPaid ? "#4ade80" : "#fbbf24",
                                                fontWeight: 700,
                                                fontSize: 12,
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            {paymentLabel}
                                        </td>
                                        <td
                                            style={{
                                                padding: "14px",
                                                borderBottom: "1px solid var(--border)",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            <Link
                                                href={`/trainings/${t.course_id}`}
                                                className="book-now-text"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
