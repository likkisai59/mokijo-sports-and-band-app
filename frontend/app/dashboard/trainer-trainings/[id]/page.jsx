"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CalendarDays, Clock, MapPin, Users, IndianRupee, CheckCircle2, ArrowLeft } from "lucide-react";
import api from "../../../../lib/api";

function money(value) {
    return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function TrainerTrainingDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [training, setTraining] = useState(null);
    const [registration, setRegistration] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [gatewayConfig, setGatewayConfig] = useState({ configured: false });

    const loadRazorpayCheckout = () =>
        new Promise((resolve, reject) => {
            if (typeof window === "undefined") return reject(new Error("No window"));
            if (window.Razorpay) return resolve();
            const existing = document.querySelector("script[src='https://checkout.razorpay.com/v1/checkout.js']");
            if (existing) {
                existing.addEventListener("load", () => resolve());
                return;
            }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Razorpay"));
            document.body.appendChild(script);
        });

    const load = useCallback(async () => {
        try {
            const [trainingRes, regRes, gatewayRes] = await Promise.all([
                api.get(`/trainings/${id}`),
                api.get(`/trainings/${id}/my-registration`).catch(() => ({ data: null })),
                api.get("/payments/razorpay/config").catch(() => ({ data: { configured: false } })),
            ]);
            setTraining(trainingRes.data);
            setRegistration(regRes.data);
            setGatewayConfig(gatewayRes.data || { configured: false });
        } catch (err) {
            setError(err?.response?.data?.detail || "Could not load training.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const handleRegister = async () => {
        setBusy(true);
        setError("");
        try {
            const res = await api.post(`/trainings/${id}/register`, {});
            setRegistration(res.data);
        } catch (err) {
            setError(err?.response?.data?.detail || "Registration failed.");
        } finally {
            setBusy(false);
        }
    };

    const handlePay = async () => {
        if (!registration || !training) return;
        if (!gatewayConfig.configured) {
            setError("Online payments are not configured right now.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            const paymentRes = await api.post("/trainings/payments/create", {
                registration_id: registration.id,
            });
            const payment = paymentRes.data;
            const orderRes = await api.post("/payments/razorpay/order", {
                payment_id: payment.id,
                owner_id: payment.owner_id,
            });
            const order = orderRes.data;
            await loadRazorpayCheckout();

            const checkout = new window.Razorpay({
                key: order.key_id,
                amount: order.amount,
                currency: order.currency,
                name: order.name || "Mukijo",
                description: order.description || training.title,
                order_id: order.razorpay_order_id,
                prefill: {
                    name: order.prefill_name || registration.participant_name || "",
                    email: order.prefill_email || registration.participant_email || "",
                    contact: order.prefill_contact || registration.participant_phone || "",
                },
                handler: async (response) => {
                    try {
                        await api.post("/payments/razorpay/verify", {
                            payment_id: payment.id,
                            owner_id: payment.owner_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        await load();
                    } catch (verifyErr) {
                        setError(verifyErr?.response?.data?.detail || "Payment verification failed.");
                    } finally {
                        setBusy(false);
                    }
                },
                modal: { ondismiss: () => setBusy(false) },
            });
            checkout.on("payment.failed", (response) => {
                setError(response?.error?.description || "Payment failed.");
                setBusy(false);
            });
            checkout.open();
        } catch (err) {
            setError(err?.response?.data?.detail || "Could not start payment.");
            setBusy(false);
        }
    };

    if (loading) {
        return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading training…</div>;
    }

    if (!training) {
        return (
            <div style={{ padding: 40, maxWidth: 560, margin: "0 auto" }}>
                <p style={{ color: "#dc2626" }}>{error || "Training not found."}</p>
                <button
                    type="button"
                    onClick={() => router.back()}
                    style={{
                        marginTop: 12,
                        padding: "10px 16px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        background: "#fff",
                        cursor: "pointer",
                    }}
                >
                    Go back
                </button>
            </div>
        );
    }

    const fee = Number(training.fee || 0);
    const isPaid =
        registration &&
        (registration.payment_status === "paid" || registration.payment_status === "waived" || fee <= 0);
    const needsPay = registration && fee > 0 && !isPaid;

    return (
        <div style={{ padding: "28px 24px 48px", maxWidth: 1100, margin: "0 auto" }}>
            <style>{`
                .tt-detail-layout { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.8fr); gap: 24px; align-items: start; }
                @media (max-width: 900px) {
                    .tt-detail-layout { grid-template-columns: 1fr; }
                    .tt-pay-aside { position: static !important; }
                }
            `}</style>

            <button
                type="button"
                onClick={() => router.back()}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 20,
                    background: "transparent",
                    border: "none",
                    color: "#2563eb",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    padding: 0,
                }}
            >
                <ArrowLeft size={16} /> Back to dashboard
            </button>

            <div className="tt-detail-layout">
                <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
                    <div
                        style={{
                            width: "100%",
                            height: 300,
                            borderRadius: 16,
                            overflow: "hidden",
                            background: "linear-gradient(135deg, #1e293b, #334155)",
                        }}
                    >
                        {training.cover_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={training.cover_image}
                                alt={training.title}
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
                                    color: "rgba(255,255,255,0.45)",
                                    fontSize: 14,
                                }}
                            >
                                No cover photo
                            </div>
                        )}
                    </div>

                    <div
                        style={{
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 16,
                            padding: "24px 28px",
                            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
                        }}
                    >
                        <h1
                            style={{
                                margin: 0,
                                fontSize: 28,
                                fontWeight: 800,
                                color: "#0f172a",
                                lineHeight: 1.25,
                                textTransform: "capitalize",
                            }}
                        >
                            {training.title}
                        </h1>
                        <p style={{ margin: "8px 0 0", fontSize: 15, color: "#64748b" }}>
                            by <strong>{training.trainer_name || training.instructor || "Trainer"}</strong>
                            {training.level ? ` · ${training.level}` : ""}
                        </p>

                        {training.description && (
                            <p style={{ margin: "16px 0 0", fontSize: 15, color: "#334155", lineHeight: 1.6 }}>
                                {training.description}
                            </p>
                        )}

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 16,
                                marginTop: 24,
                                paddingTop: 20,
                                borderTop: "1px solid #e2e8f0",
                            }}
                        >
                            {[
                                { icon: <Clock size={18} color="#2563eb" />, label: "Schedule", value: training.schedule || "TBD" },
                                { icon: <MapPin size={18} color="#2563eb" />, label: "Location", value: training.location || "TBD" },
                                {
                                    icon: <CalendarDays size={18} color="#2563eb" />,
                                    label: "Dates",
                                    value: `${training.start_date || "—"} → ${training.end_date || "—"}`,
                                },
                                {
                                    icon: <Users size={18} color="#2563eb" />,
                                    label: "Seats",
                                    value: `${training.registration_count}/${training.capacity} filled · ${training.available_seats} left`,
                                },
                            ].map((item) => (
                                <div key={item.label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                    {item.icon}
                                    <div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: "#94a3b8",
                                                fontWeight: 600,
                                                textTransform: "uppercase",
                                                letterSpacing: 0.04,
                                                marginBottom: 2,
                                            }}
                                        >
                                            {item.label}
                                        </div>
                                        <div style={{ fontSize: 14, color: "#0f172a", fontWeight: 600 }}>{item.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <aside className="tt-pay-aside" style={{ position: "sticky", top: 16 }}>
                    <div
                        style={{
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 16,
                            overflow: "hidden",
                            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                        }}
                    >
                        <div
                            style={{
                                padding: "22px 22px 16px",
                                background: "linear-gradient(180deg, #f8fafc 0%, #fff 100%)",
                                borderBottom: "1px solid #e2e8f0",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "#64748b",
                                    textTransform: "uppercase",
                                    letterSpacing: 0.06,
                                }}
                            >
                                Training fee
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, color: "#0f172a" }}>
                                <IndianRupee size={22} />
                                <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: -0.5 }}>
                                    {fee.toLocaleString("en-IN")}
                                </span>
                            </div>
                            {fee <= 0 && (
                                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#16a34a" }}>
                                    Free training — no payment needed
                                </p>
                            )}
                        </div>

                        {error && (
                            <div
                                style={{
                                    margin: "12px 22px 0",
                                    padding: "10px 12px",
                                    borderRadius: 10,
                                    background: "#fef2f2",
                                    color: "#dc2626",
                                    fontSize: 13,
                                }}
                            >
                                {error}
                            </div>
                        )}

                        {!registration && (
                            <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
                                <p style={{ margin: 0, fontSize: 14, color: "#64748b", lineHeight: 1.5 }}>
                                    Register as a candidate to secure your seat
                                    {fee > 0 ? ", then complete payment." : "."}
                                </p>
                                <button
                                    type="button"
                                    onClick={handleRegister}
                                    disabled={busy || training.available_seats <= 0}
                                    style={{
                                        width: "100%",
                                        padding: "14px 18px",
                                        borderRadius: 12,
                                        border: "none",
                                        background: training.available_seats <= 0 ? "#94a3b8" : "#2563eb",
                                        color: "#fff",
                                        fontWeight: 700,
                                        fontSize: 15,
                                        cursor: training.available_seats <= 0 ? "not-allowed" : "pointer",
                                    }}
                                >
                                    {busy
                                        ? "Registering…"
                                        : training.available_seats <= 0
                                          ? "Full — no seats"
                                          : "Register as candidate"}
                                </button>
                            </div>
                        )}

                        {registration && needsPay && (
                            <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
                                <div
                                    style={{
                                        display: "inline-flex",
                                        alignSelf: "flex-start",
                                        padding: "6px 12px",
                                        borderRadius: 999,
                                        background: "#fff7ed",
                                        color: "#c2410c",
                                        fontSize: 12,
                                        fontWeight: 700,
                                    }}
                                >
                                    Seat reserved · Payment pending
                                </div>
                                <p style={{ margin: 0, fontSize: 14, color: "#64748b", lineHeight: 1.5 }}>
                                    Complete payment to confirm your registration for this training.
                                </p>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: 14,
                                        color: "#64748b",
                                        padding: "8px 0",
                                        borderBottom: "1px solid #f1f5f9",
                                    }}
                                >
                                    <span>Candidate</span>
                                    <strong style={{ color: "#0f172a" }}>{registration.participant_name}</strong>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: 14,
                                        color: "#64748b",
                                        padding: "8px 0",
                                        borderBottom: "1px solid #f1f5f9",
                                    }}
                                >
                                    <span>Amount due</span>
                                    <strong style={{ color: "#0f172a" }}>{money(fee)}</strong>
                                </div>
                                <button
                                    type="button"
                                    onClick={handlePay}
                                    disabled={busy}
                                    style={{
                                        width: "100%",
                                        padding: "14px 18px",
                                        borderRadius: 12,
                                        border: "none",
                                        background: "#16a34a",
                                        color: "#fff",
                                        fontWeight: 700,
                                        fontSize: 15,
                                        cursor: "pointer",
                                        marginTop: 4,
                                    }}
                                >
                                    {busy ? "Opening checkout…" : `Pay ${money(fee)} with Razorpay`}
                                </button>
                            </div>
                        )}

                        {registration && isPaid && (
                            <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
                                <div
                                    style={{
                                        textAlign: "center",
                                        padding: "8px 0 4px",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
                                    <CheckCircle2 size={44} color="#16a34a" />
                                    <h3 style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>You&apos;re registered</h3>
                                    <p style={{ margin: 0, fontSize: 14, color: "#64748b", lineHeight: 1.5 }}>
                                        Payment confirmed. You&apos;re all set for this training.
                                    </p>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: 14,
                                        color: "#64748b",
                                        padding: "8px 0",
                                        borderBottom: "1px solid #f1f5f9",
                                    }}
                                >
                                    <span>Candidate</span>
                                    <strong style={{ color: "#0f172a" }}>{registration.participant_name}</strong>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: 14,
                                        color: "#64748b",
                                        padding: "8px 0",
                                        borderBottom: "1px solid #f1f5f9",
                                    }}
                                >
                                    <span>Payment</span>
                                    <strong style={{ color: "#16a34a" }}>{fee <= 0 ? "Waived" : "Paid"}</strong>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: 14,
                                        color: "#64748b",
                                        padding: "8px 0",
                                    }}
                                >
                                    <span>Amount</span>
                                    <strong style={{ color: "#0f172a" }}>{money(fee)}</strong>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
