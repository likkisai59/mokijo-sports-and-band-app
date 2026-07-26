"use client";
import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    Award,
    User,
    Phone,
    Loader2,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";

function loadRazorpayCheckout() {
    if (typeof window === "undefined") return Promise.resolve();
    if (window.Razorpay) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(
            "script[src='https://checkout.razorpay.com/v1/checkout.js']"
        );
        if (existingScript) {
            existingScript.addEventListener("load", () => resolve(), { once: true });
            existingScript.addEventListener(
                "error",
                () => reject(new Error("Could not load Razorpay Checkout.")),
                { once: true }
            );
            return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Could not load Razorpay Checkout."));
        document.body.appendChild(script);
    });
}

function authHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    return token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };
}

export default function TrainingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const trainingId = params?.id;

    const [training, setTraining] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [paying, setPaying] = useState(false);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [dashboardUrl, setDashboardUrl] = useState("/user-dashboard");

    useEffect(() => {
        const isMember = localStorage.getItem("isMember") === "true";
        const role = (localStorage.getItem("userRole") || "").toLowerCase();
        if (isMember || role === "team_member" || role === "club_admin") {
            setDashboardUrl("/dashboard/my-trainings");
        } else {
            setDashboardUrl("/user-dashboard");
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        const isUser = localStorage.getItem("isUser") === "true";
        if (!token) {
            router.replace(`/login-user?next=/trainings/${trainingId}`);
            return;
        }
        if (!isUser && localStorage.getItem("userRole") !== "user") {
            // Allow club/member tokens too if they have accessToken; detail API allows multiple roles
        }
        loadDetail();
    }, [trainingId]);

    const loadDetail = async () => {
        if (!trainingId) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE_URL}/courses/trainer-trainings/${trainingId}`, {
                headers: { ...authHeaders() },
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.detail || "Could not load training.");
            }
            setTraining(await res.json());
        } catch (err) {
            console.error(err);
            setError(err.message || "Could not load training.");
        } finally {
            setLoading(false);
        }
    };

    const handleEnrollAndPay = async () => {
        if (!training || paying || success) return;
        setPaying(true);
        setError("");
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                router.push(`/login-user?next=/trainings/${trainingId}`);
                return;
            }

            const orderRes = await fetch(
                `${API_BASE_URL}/courses/trainer-trainings/${trainingId}/enroll/order`,
                {
                    method: "POST",
                    headers: { ...authHeaders() },
                }
            );
            const order = await orderRes.json().catch(() => ({}));
            if (!orderRes.ok) {
                setError(order.detail || "Could not start enrollment.");
                setPaying(false);
                return;
            }

            if (order.free) {
                setSuccessMessage("You are registered for this free training.");
                setSuccess(true);
                setPaying(false);
                return;
            }

            await loadRazorpayCheckout();
            if (!window.Razorpay) {
                throw new Error("Razorpay Checkout failed to load.");
            }

            const checkout = new window.Razorpay({
                key: order.key_id,
                amount: order.amount,
                currency: order.currency || "INR",
                name: order.name || "Mukijo Trainings",
                description: order.description || training.title,
                order_id: order.razorpay_order_id,
                prefill: {
                    name: order.prefill_name || "",
                    email: order.prefill_email || "",
                    contact: order.prefill_contact || "",
                },
                theme: { color: "#c6ff3d" },
                handler: async (response) => {
                    try {
                        const verifyRes = await fetch(
                            `${API_BASE_URL}/courses/trainer-trainings/${trainingId}/enroll/verify`,
                            {
                                method: "POST",
                                headers: { ...authHeaders() },
                                body: JSON.stringify({
                                    registration_id: order.registration_id,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                }),
                            }
                        );
                        if (!verifyRes.ok) {
                            const errorData = await verifyRes.json().catch(() => ({}));
                            setError(errorData.detail || "Payment verification failed.");
                            setPaying(false);
                            return;
                        }
                        setSuccessMessage("Payment successful. You are registered for this training.");
                        setSuccess(true);
                    } catch (verifyErr) {
                        console.error(verifyErr);
                        setError("Payment completed but verification failed. Contact support with your payment ID.");
                    } finally {
                        setPaying(false);
                    }
                },
                modal: {
                    ondismiss: () => setPaying(false),
                },
            });

            checkout.open();
        } catch (err) {
            console.error(err);
            setError(err.message || "Could not complete enrollment.");
            setPaying(false);
        }
    };

    const trainer = training?.trainer;
    const trainerName = trainer
        ? `${trainer.first_name || ""} ${trainer.last_name || ""}`.trim()
        : training?.trainer_name || training?.instructor || "Trainer";
    const fee = Number(training?.fee || 0);
    const daysLabel = Array.isArray(training?.days) && training.days.length
        ? training.days.join(", ")
        : null;

    if (loading) {
        return (
            <div style={styles.page}>
                <div style={styles.centerBox}>
                    <Loader2 size={32} style={{ color: "#c6ff3d", animation: "spin 1s linear infinite" }} />
                    <p style={{ marginTop: 12, color: "rgba(148,163,184,0.7)" }}>Loading training…</p>
                </div>
            </div>
        );
    }

    if (!training) {
        return (
            <div style={styles.page}>
                <div style={styles.centerBox}>
                    <h2 style={{ color: "#f4f4f5" }}>Training not found</h2>
                    <p style={{ color: "rgba(148,163,184,0.6)", marginBottom: 16 }}>{error || "This session may have been removed."}</p>
                    <Link href={dashboardUrl} style={styles.backLink}>
                        ← Back to dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.topbar}>
                <Link href={dashboardUrl} style={styles.backLink}>
                    <ArrowLeft size={16} /> Back
                </Link>
                <strong style={styles.logo}>Mukijo</strong>
            </div>

            <main style={styles.main}>
                <div style={styles.coverWrap}>
                    <img
                        src={
                            training.cover_image ||
                            "https://images.unsplash.com/photo-1517649763962-0c6238842e77?q=80&w=1200&auto=format&fit=crop"
                        }
                        alt={training.title}
                        style={styles.coverImg}
                    />
                    <span style={styles.statusBadge}>{training.status || "open"}</span>
                </div>

                <div style={styles.content}>
                    <h1 style={styles.title}>{training.title}</h1>
                    <p style={styles.subtitle}>
                        {training.description || "No description added for this training."}
                    </p>

                    {error && <div style={styles.errorBox}>{error}</div>}

                    {success ? (
                        <div style={styles.successBox}>
                            <CheckCircle2 size={22} color="#6ee7b7" />
                            <div>
                                <strong>Registration complete</strong>
                                <p style={{ margin: "4px 0 0", fontSize: 14 }}>{successMessage}</p>
                            </div>
                        </div>
                    ) : null}

                    <section style={styles.section}>
                        <h2 style={styles.sectionTitle}>Training details</h2>
                        <div style={styles.detailGrid}>
                            <div style={styles.detailItem}>
                                <Calendar size={16} />
                                <span>
                                    {training.start_date || "Not scheduled"}
                                    {training.end_date ? ` → ${training.end_date}` : ""}
                                </span>
                            </div>
                            <div style={styles.detailItem}>
                                <Clock size={16} />
                                <span>
                                    {training.start_time && training.end_time
                                        ? `${training.start_time} – ${training.end_time}`
                                        : training.schedule || "Schedule TBA"}
                                </span>
                            </div>
                            {daysLabel && (
                                <div style={styles.detailItem}>
                                    <Award size={16} />
                                    <span>{daysLabel}</span>
                                </div>
                            )}
                            <div style={styles.detailItem}>
                                <MapPin size={16} />
                                <span>{training.location || "Location TBA"}</span>
                            </div>
                            {training.level && (
                                <div style={styles.detailItem}>
                                    <Award size={16} />
                                    <span>{training.level}</span>
                                </div>
                            )}
                            <div style={styles.detailItem}>
                                <span style={{ fontWeight: 700, color: "#c6ff3d" }}>
                                    {fee > 0 ? `₹${fee.toLocaleString("en-IN")}` : "Free"}
                                </span>
                                <span style={{ color: "rgba(148,163,184,0.7)", fontSize: 13 }}>
                                    {training.available_seats != null
                                        ? `${training.available_seats} seats left`
                                        : training.capacity
                                          ? `Capacity ${training.capacity}`
                                          : ""}
                                </span>
                            </div>
                        </div>
                    </section>

                    <section style={styles.section}>
                        <h2 style={styles.sectionTitle}>Trainer</h2>
                        <div style={styles.trainerCard}>
                            <div style={styles.trainerAvatar}>
                                <User size={22} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={styles.trainerName}>{trainerName}</h3>
                                {trainer?.specialization && (
                                    <p style={styles.trainerMeta}>{trainer.specialization}</p>
                                )}
                                {trainer?.experience && (
                                    <p style={styles.trainerMeta}>Experience: {trainer.experience}</p>
                                )}
                                {Array.isArray(trainer?.sports) && trainer.sports.length > 0 && (
                                    <div style={styles.chipRow}>
                                        {trainer.sports.map((sport) => (
                                            <span key={sport} style={styles.chip}>
                                                {sport}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {trainer?.phone && (
                                    <p style={{ ...styles.trainerMeta, display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                                        <Phone size={14} /> {trainer.phone}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {error && (
                        <div
                            style={{
                                background: "rgba(239, 68, 68, 0.1)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                borderRadius: "10px",
                                padding: "14px 18px",
                                color: "#f87171",
                                fontSize: "14px",
                                fontWeight: "600",
                                marginBottom: "16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "12px",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                                <span>{error}</span>
                            </div>
                            {(error.toLowerCase().includes("already") ||
                                error.toLowerCase().includes("registered") ||
                                error.toLowerCase().includes("paid")) && (
                                <Link
                                    href={dashboardUrl}
                                    style={{
                                        color: "#c6ff3d",
                                        fontSize: "13px",
                                        fontWeight: "700",
                                        textDecoration: "underline",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    My Trainings →
                                </Link>
                            )}
                        </div>
                    )}

                    {!success && (
                        <button
                            type="button"
                            style={styles.payBtn}
                            onClick={handleEnrollAndPay}
                            disabled={paying || training.status === "closed" || training.status === "completed"}
                        >
                            {paying
                                ? "Processing…"
                                : fee > 0
                                  ? "Register & Pay"
                                  : "Register"}
                        </button>
                    )}

                    {success && (
                        <Link href={dashboardUrl} style={{ ...styles.payBtn, textAlign: "center", textDecoration: "none" }}>
                            Back to dashboard
                        </Link>
                    )}
                </div>
            </main>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#08080f",
        color: "#f4f4f5",
        fontFamily: "'Outfit', sans-serif",
    },
    topbar: {
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: "#000",
    },
    logo: {
        fontSize: 20,
        fontWeight: 900,
        fontStyle: "italic",
        textTransform: "uppercase",
    },
    backLink: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color: "rgba(148,163,184,0.85)",
        textDecoration: "none",
        fontSize: 14,
    },
    main: {
        maxWidth: 880,
        margin: "0 auto",
        padding: "24px 20px 48px",
    },
    coverWrap: {
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        height: 260,
        background: "rgba(255,255,255,0.04)",
        marginBottom: 24,
    },
    coverImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
    },
    statusBadge: {
        position: "absolute",
        top: 14,
        right: 14,
        background: "rgba(198,255,61,0.15)",
        border: "1px solid rgba(198,255,61,0.35)",
        color: "#c6ff3d",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "6px 10px",
        borderRadius: 999,
    },
    content: {},
    title: {
        fontSize: 28,
        fontWeight: 800,
        margin: "0 0 10px",
    },
    subtitle: {
        margin: "0 0 24px",
        color: "rgba(226,232,240,0.75)",
        lineHeight: 1.55,
        fontSize: 15,
    },
    section: {
        marginBottom: 28,
        padding: 20,
        borderRadius: 14,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
    },
    sectionTitle: {
        margin: "0 0 14px",
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "rgba(198,255,61,0.9)",
    },
    detailGrid: {
        display: "grid",
        gap: 12,
    },
    detailItem: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 14,
        color: "rgba(226,232,240,0.9)",
    },
    trainerCard: {
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
    },
    trainerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 12,
        background: "rgba(198,255,61,0.12)",
        color: "#c6ff3d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    trainerName: {
        margin: 0,
        fontSize: 18,
        fontWeight: 700,
    },
    trainerMeta: {
        margin: "4px 0 0",
        fontSize: 13,
        color: "rgba(148,163,184,0.8)",
    },
    chipRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 8,
    },
    chip: {
        fontSize: 11,
        fontWeight: 700,
        padding: "4px 8px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(226,232,240,0.85)",
    },
    payBtn: {
        width: "100%",
        border: "none",
        borderRadius: 12,
        padding: "14px 18px",
        background: "#c6ff3d",
        color: "#0a0a12",
        fontWeight: 800,
        fontSize: 15,
        cursor: "pointer",
        boxShadow: "0 8px 24px rgba(198,255,61,0.25)",
    },
    errorBox: {
        background: "rgba(248,113,113,0.1)",
        border: "1px solid rgba(248,113,113,0.3)",
        color: "#fca5a5",
        padding: "12px 14px",
        borderRadius: 10,
        marginBottom: 16,
        fontSize: 14,
    },
    successBox: {
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        background: "rgba(16,185,129,0.1)",
        border: "1px solid rgba(16,185,129,0.3)",
        color: "#6ee7b7",
        padding: "14px 16px",
        borderRadius: 12,
        marginBottom: 20,
    },
    centerBox: {
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
    },
};
