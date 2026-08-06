"use client";
import { API_BASE_URL } from "@/lib/api";
import { loginRequest, normalizeToken, persistSportsSession, navigateToDashboard } from "@/lib/sportsLogin";
import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PasswordField from "@/components/ui/PasswordField";
import {
    AuthShell,
    AuthCard,
    AuthBrand,
    AuthField,
    AuthErrorBanner,
    AuthSuccessBanner,
    AuthNavLinks,
    getAuthClasses,
} from "@/components/auth";
import { Mail, Lock, ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";

const c = getAuthClasses("light");

function LoginContent() {
    const searchParams = useSearchParams();
    const [showSuccess, setShowSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showResend, setShowResend] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState("");
    const [formData, setFormData] = useState({ email: "", password: "" });

    useEffect(() => {
        if (searchParams.get("registered") === "true") {
            setShowSuccess(true);
        }
    }, [searchParams]);

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
        } catch {
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

        const result = await loginRequest("/login", formData);
        if (result.ok) {
            const { data } = result;
            const token = normalizeToken(data);
            if (!token) {
                setError("Login failed: Invalid session token received.");
                setLoading(false);
                return;
            }
            localStorage.removeItem("isMember");
            localStorage.removeItem("memberRole");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userPhone");
            persistSportsSession({
                userName: data.userName,
                userId: data.userId,
                clubName: data.clubName,
                userRole: "admin",
                accessToken: token,
            });
            navigateToDashboard("/dashboard");
        } else {
            setError(result.detail || "Invalid credentials. Please try again.");
            if (result.status === 403) {
                setShowResend(true);
            }
            setLoading(false);
        }
    };

    return (
        <AuthShell variant="light">
            <AuthCard variant="light">
                <div className="flex flex-col items-center justify-center w-full">
                    {/* Back to Home Link */}
                    <div className="w-full flex justify-start mb-4">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-xs font-semibold text-[#5c5c66] hover:text-[#0a0a0f] transition-colors group"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                            <span>Back to Home</span>
                        </Link>
                    </div>

                    {/* Title */}
                    <div className="flex flex-col items-center text-center mb-6">
                        <AuthBrand
                            variant="light"
                            title="Admin Sign In"
                        />
                    </div>

                    {showSuccess ? (
                        <div className="w-full max-w-[360px] mb-4">
                            <AuthSuccessBanner variant="light">
                                Your club has been registered successfully. You can now sign in below.
                            </AuthSuccessBanner>
                        </div>
                    ) : null}

                    {/* Centered Form Block */}
                    <form className="block space-y-4 max-w-[360px] w-full text-left" onSubmit={handleSubmit}>
                        <AuthField variant="light" label="Email Address" htmlFor="email" required>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="admin@example.com"
                                    className={c.input}
                                    style={{ paddingLeft: "42px" }}
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </AuthField>

                        <AuthField
                            variant="light"
                            label="Password"
                            htmlFor="password"
                            required
                            labelRight={
                                <Link href="/forgot-password" className={`text-[13px] ${c.accentLink}`}>
                                    Forgot password?
                                </Link>
                            }
                        >
                            <div className="relative">
                                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                <PasswordField
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    className={c.input}
                                    inputStyle={{ paddingLeft: "42px" }}
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    required
                                    tone="light"
                                />
                            </div>
                        </AuthField>

                        <AuthErrorBanner variant="light">{error}</AuthErrorBanner>

                        {showResend && !resendSuccess ? (
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resendLoading}
                                className="w-full py-2.5 bg-[#c6ff3d]/20 border border-[#c6ff3d] rounded-[10px] text-[#0a0a0f] font-semibold text-sm disabled:opacity-50 hover:bg-[#c6ff3d]/30 transition-all"
                            >
                                {resendLoading ? "Resending..." : "Resend Verification Link"}
                            </button>
                        ) : null}

                        {resendSuccess ? (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-[14px] py-3 rounded-[10px] text-[13px] text-center font-medium">
                                {resendSuccess}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            className={`${c.primaryBtn} flex items-center justify-center gap-2 font-bold tracking-wide transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 !mt-6`}
                            disabled={loading}
                        >
                            <span>{loading ? "Signing in…" : "Sign in to Dashboard"}</span>
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1.5 font-medium">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
                                256-Bit Encrypted
                            </span>
                            <span>Mokijo Sports v1.0</span>
                        </div>
                    </form>

                    <div className="w-full max-w-[360px]">
                        <AuthNavLinks
                            variant="light"
                            showBackHome={false}
                            footerPrompt="Don't have an account?"
                            footerHref="/register"
                            footerLabel="Create one free"
                        />
                    </div>
                </div>
            </AuthCard>
        </AuthShell>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginContent />
        </Suspense>
    );
}


