"use client";
import { API_BASE_URL } from "@/lib/api";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function LoginContent() {
    const searchParams = useSearchParams();
    const [showSuccess, setShowSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showResend, setShowResend] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState("");

    useEffect(() => {
        if (searchParams.get("registered") === "true") {
            setShowSuccess(true);
        }
    }, [searchParams]);

    const [formData, setFormData] = useState({ email: "", password: "" });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setError("");
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleResend = async () => {
        setResendLoading(true);
        setError("");
        setResendSuccess("");
        try {
            const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email }),
            });
            const data = await response.json();
            if (response.ok) {
                setResendSuccess(data.message || "Verification email sent successfully!");
            } else {
                setError(data.detail || "Failed to resend verification email.");
            }
        } catch (err) {
            setError("Server connection failed.");
        } finally {
            setResendLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setShowResend(false);
        setResendSuccess("");
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.removeItem("isMember");
                localStorage.removeItem("memberRole");
                localStorage.removeItem("userEmail");
                localStorage.removeItem("userPhone");
                localStorage.setItem("userName", data.userName);
                localStorage.setItem("userId", data.userId);
                localStorage.setItem("clubName", data.clubName);
                localStorage.setItem("userRole", "admin");
                localStorage.setItem("accessToken", data.accessToken);
                window.location.href = "/dashboard";
            } else {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.detail || "Invalid credentials. Please try again.");
                if (response.status === 403) {
                    setShowResend(true);
                }
            }
        } catch (err) {
            setError("Cannot connect to server. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex justify-center items-center font-sans bg-[#08080f] overflow-hidden relative">
            {/* ── Animated Blur Glow Orbs (Volt + Magenta) ── */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_20%_50%,rgba(198,255,61,0.12)_0%,transparent_60%),radial-gradient(ellipse_60%_60%_at_80%_20%,rgba(217,255,110,0.1)_0%,transparent_50%),radial-gradient(ellipse_50%_50%_at_50%_90%,rgba(217,255,110,0.07)_0%,transparent_50%)] pointer-events-none z-0" aria-hidden="true" />
            
            {/* ── Grid Pattern Overlay ── */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none z-0" aria-hidden="true" />

            {/* ── Form Panel ── */}
            <div className="w-full max-w-[500px] p-6 md:p-8 z-10">
                <div className="bg-[#0e0e19]/45 border border-white/5 rounded-[24px] p-8 md:p-10 flex flex-col gap-8 backdrop-blur-[10px] shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                    <div className="flex flex-col gap-2">
                        <span className="text-3xl font-black italic uppercase tracking-wider bg-gradient-to-r from-[#c6ff3d] to-[#d9ff6e] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(198,255,61,0.45)] mb-2 inline-block">Mukijo</span>
                        <h1 className="text-2xl font-extrabold tracking-tight text-white">Admin Sign In</h1>
                        <p className="text-sm text-white/50">Welcome back — enter your credentials to continue</p>
                    </div>

                    {showSuccess && (
                        <div
                            style={{
                                background: "rgba(16, 185, 129, 0.1)",
                                border: "1px solid rgba(16, 185, 129, 0.3)",
                                color: "#6ee7b7",
                                padding: "12px 16px",
                                borderRadius: "10px",
                                marginBottom: "20px",
                                fontSize: "14px",
                                textAlign: "center",
                            }}
                        >
                            <strong>Registration successful!</strong>
                            <br />
                            A verification link has been sent to your email. Please verify your email before signing in.
                        </div>
                    )}

                    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-white/40">
                                Email address
                            </label>
                            <div className="relative">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-200 focus:outline-none focus:border-[#c6ff3d] focus:bg-white/5"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-white/40">
                                    Password
                                </label>
                                <Link href="/forgot-password" className="text-xs font-semibold text-[#c6ff3d] hover:text-[#b5eb29] hover:underline transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-200 focus:outline-none focus:border-[#c6ff3d] focus:bg-white/5"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {error && <div className="text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl text-center">{error}</div>}

                        {showResend && !resendSuccess && (
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resendLoading}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    background: "rgba(217, 255, 110, 0.1)",
                                    border: "1px solid rgba(217, 255, 110, 0.3)",
                                    borderRadius: "8px",
                                    color: "#d9ff6e",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                    marginTop: "10px",
                                    marginBottom: "15px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                {resendLoading ? "Resending..." : "Resend Verification Link"}
                            </button>
                        )}

                        {resendSuccess && (
                            <div
                                style={{
                                    background: "rgba(198, 255, 61, 0.1)",
                                    border: "1px solid rgba(198, 255, 61, 0.3)",
                                    color: "#c6ff3d",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    marginTop: "10px",
                                    marginBottom: "15px",
                                    fontSize: "14px",
                                    textAlign: "center"
                                }}
                            >
                                {resendSuccess}
                            </div>
                        )}

                        <button type="submit" className="w-full bg-[#c6ff3d] text-[#08080f] font-bold text-sm px-6 py-3.5 rounded-xl transition-all duration-200 hover:bg-[#b5eb29] hover:shadow-[0_0_15px_rgba(198,255,61,0.3)] disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
                            {loading ? "Signing in…" : "Sign in to Dashboard →"}
                        </button>
                    </form>

                    <div className="flex items-center justify-center my-1">
                        <span className="text-[11px] font-bold uppercase text-white/25">or</span>
                    </div>

                    <div className="text-sm text-white/50 text-center">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="font-semibold text-[#c6ff3d] hover:text-[#b5eb29] hover:underline transition-colors">
                            Create one free
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginContent />
        </Suspense>
    );
}
