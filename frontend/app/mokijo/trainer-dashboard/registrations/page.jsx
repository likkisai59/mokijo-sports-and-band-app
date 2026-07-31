"use client";
import { API_BASE_URL } from "@/lib/api";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const API = API_BASE_URL;

function authHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    return token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };
}

const PAYMENT_LABELS = {
    paid: "Paid",
    unpaid: "Unpaid",
    waived: "Waived",
};

const TYPE_LABELS = {
    user: "User",
    club_admin: "Club admin",
    club_member: "Club member",
    guest: "Guest",
};

function formatDate(value) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return value;
    }
}

function paymentBadgeClass(status) {
    if (status === "paid") return "green";
    if (status === "waived") return "blue";
    return "yellow";
}

function RegistrationsContent() {
    const searchParams = useSearchParams();
    const courseIdParam = searchParams.get("course_id") || "";

    const [registrations, setRegistrations] = useState([]);
    const [trainings, setTrainings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [courseFilter, setCourseFilter] = useState(courseIdParam);

    const trainerId = typeof window !== "undefined" ? localStorage.getItem("trainerId") : null;

    useEffect(() => {
        if (courseIdParam) setCourseFilter(courseIdParam);
    }, [courseIdParam]);

    useEffect(() => {
        const load = async () => {
            if (!trainerId) {
                setLoading(false);
                setError("Please log in as a trainer.");
                return;
            }
            setLoading(true);
            setError("");
            try {
                const coursesRes = await fetch(`${API}/trainer/${trainerId}/courses`, {
                    headers: { ...authHeaders() },
                });
                const coursesData = coursesRes.ok ? await coursesRes.json() : [];
                setTrainings(Array.isArray(coursesData) ? coursesData : []);

                const qs = courseFilter ? `?course_id=${encodeURIComponent(courseFilter)}` : "";
                const regsRes = await fetch(`${API}/trainer/${trainerId}/registrations${qs}`, {
                    headers: { ...authHeaders() },
                });
                if (!regsRes.ok) {
                    setRegistrations([]);
                    setError("Could not load registrations.");
                } else {
                    const regsData = await regsRes.json();
                    setRegistrations(Array.isArray(regsData) ? regsData : []);
                }
            } catch (e) {
                console.error(e);
                setError("Could not load registrations.");
                setRegistrations([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [trainerId, courseFilter]);

    const filtered = useMemo(() => {
        if (paymentFilter === "all") return registrations;
        return registrations.filter((r) => (r.payment_status || "").toLowerCase() === paymentFilter);
    }, [registrations, paymentFilter]);

    return (
        <>
            <h1 className="vd-page-title">Registrations</h1>
            <p className="vd-page-sub">People registered for your trainings — paid and unpaid</p>

            <div className="vd-controls">
                <select
                    className="vd-select"
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                >
                    <option value="">All trainings</option>
                    {trainings.map((t) => (
                        <option key={t.id} value={String(t.id)}>
                            {t.title}
                        </option>
                    ))}
                </select>
                <select
                    className="vd-select"
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                >
                    <option value="all">All</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                </select>
            </div>

            {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 14 }}>{error}</p>}

            {loading ? (
                <div className="vd-loading">
                    <div className="vd-spinner" /> Loading registrations…
                </div>
            ) : filtered.length === 0 ? (
                <div className="vd-card">
                    <div className="vd-empty">
                        <div className="vd-empty-text">No registrations yet</div>
                        <div className="vd-empty-sub">
                            When users, club admins, or club members enroll in your trainings, they will appear here.
                        </div>
                    </div>
                </div>
            ) : (
                <div className="vd-card" style={{ padding: 0, overflow: "hidden" }}>
                    <div className="vd-table-wrap">
                        <table className="vd-table">
                            <thead>
                                <tr>
                                    <th>Training</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Payment</th>
                                    <th>Registered</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r) => (
                                    <tr key={r.id}>
                                        <td>{r.course_title || `Training #${r.course_id}`}</td>
                                        <td>{r.participant_name || "—"}</td>
                                        <td>{r.participant_email || "—"}</td>
                                        <td>{r.participant_phone || "—"}</td>
                                        <td>
                                            {TYPE_LABELS[r.registrant_type] ||
                                                r.registrant_type ||
                                                "—"}
                                        </td>
                                        <td style={{ textTransform: "capitalize" }}>{r.status || "—"}</td>
                                        <td>
                                            <span
                                                className={`vd-badge ${paymentBadgeClass(r.payment_status)}`}
                                            >
                                                {PAYMENT_LABELS[r.payment_status] ||
                                                    r.payment_status ||
                                                    "—"}
                                            </span>
                                        </td>
                                        <td>{formatDate(r.registered_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
}

export default function TrainerRegistrationsPage() {
    return (
        <Suspense
            fallback={
                <div className="vd-loading">
                    <div className="vd-spinner" /> Loading…
                </div>
            }
        >
            <RegistrationsContent />
        </Suspense>
    );
}
