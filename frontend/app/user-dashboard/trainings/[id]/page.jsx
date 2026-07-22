"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../../lib/api";

function money(value) {
    return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function UserTrainingDetailPage() {
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
                        alert("Payment successful.");
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
        return (
            <div style={{ minHeight: "100vh", background: "#08080f", color: "#f1f5f9", padding: 24 }}>
                Loading…
            </div>
        );
    }

    if (!training) {
        return (
            <div style={{ minHeight: "100vh", background: "#08080f", color: "#f1f5f9", padding: 24 }}>
                <p>{error || "Training not found."}</p>
                <Link href="/user-dashboard" style={{ color: "#bffe00" }}>
                    Back to dashboard
                </Link>
            </div>
        );
    }

    const needsPay =
        registration &&
        Number(training.fee || 0) > 0 &&
        registration.payment_status !== "paid" &&
        registration.payment_status !== "waived";

    return (
        <div style={{ minHeight: "100vh", background: "#08080f", color: "#f1f5f9", padding: 24, fontFamily: "Outfit, sans-serif" }}>
            <Link href="/user-dashboard" style={{ color: "#bffe00", textDecoration: "none" }}>
                ← Back
            </Link>
            <h1 style={{ marginTop: 16 }}>{training.title}</h1>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>
                {training.trainer_name || training.instructor || "Trainer"} · {training.category}
            </p>
            {error && <div style={{ color: "#f87171", marginBottom: 12 }}>{error}</div>}

            <div
                style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 16,
                    maxWidth: 720,
                }}
            >
                <p>{training.description || "No description."}</p>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 0 }}>
                    Schedule: {training.schedule || "TBD"}
                    <br />
                    Location: {training.location || "TBD"}
                    <br />
                    Dates: {training.start_date || "—"} → {training.end_date || "—"}
                    <br />
                    Seats: {training.registration_count}/{training.capacity} ({training.available_seats} left)
                    <br />
                    Fee: {money(training.fee)} · Status: {training.status}
                </p>
            </div>

            {!registration ? (
                <button
                    type="button"
                    onClick={handleRegister}
                    disabled={busy || training.available_seats <= 0}
                    style={{
                        padding: "12px 20px",
                        borderRadius: 10,
                        border: "none",
                        background: "#bffe00",
                        color: "#08080f",
                        fontWeight: 700,
                        cursor: "pointer",
                    }}
                >
                    {busy ? "Registering…" : "Register"}
                </button>
            ) : (
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14 }}>
                        Registered · Payment: <strong>{registration.payment_status}</strong>
                    </span>
                    {needsPay && (
                        <button
                            type="button"
                            onClick={handlePay}
                            disabled={busy}
                            style={{
                                padding: "12px 20px",
                                borderRadius: 10,
                                border: "none",
                                background: "#16a34a",
                                color: "#fff",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            {busy ? "Processing…" : `Pay ${money(training.fee)}`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
