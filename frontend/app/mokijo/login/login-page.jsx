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

const c = getAuthClasses("dark");

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
        <AuthShell variant="dark">
            <AuthCard variant="dark">
                <Link href="/" className={c.backLink}>
                    ← Back to Home
                </Link>

                <AuthBrand
                    variant="dark"
                    title="Admin Sign In"
                    subtitle="Welcome back — enter your credentials to continue."
                />

                {showSuccess ? (
                    <AuthSuccessBanner variant="dark">
                        A verification link has been sent to your email. Please verify your email before signing in.
                    </AuthSuccessBanner>
                ) : null}

                <form className="block" onSubmit={handleSubmit}>
                    <AuthField variant="dark" label="Email address" htmlFor="email" required>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="name@example.com"
                            className={c.input}
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </AuthField>

                    <AuthField
                        variant="dark"
                        label="Password"
                        htmlFor="password"
                        required
                        labelRight={
                            <Link href="/forgot-password" className={`text-[13px] ${c.accentLink}`}>
                                Forgot password?
                            </Link>
                        }
                    >
                        <PasswordField
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            className={c.input}
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="current-password"
                            required
                            tone="dark"
                        />
                    </AuthField>

                    <AuthErrorBanner variant="dark">{error}</AuthErrorBanner>

                    {showResend && !resendSuccess ? (
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={resendLoading}
                            className="w-full py-2.5 bg-[rgba(198,255,61,0.1)] border border-[rgba(198,255,61,0.35)] rounded-[10px] text-[#d9ff6e] font-semibold text-sm disabled:opacity-50"
                        >
                            {resendLoading ? "Resending..." : "Resend Verification Link"}
                        </button>
                    ) : null}

                    {resendSuccess ? (
                        <div className="bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.3)] text-[#6ee7b7] px-[14px] py-3 rounded-[10px] text-[13px] text-center">
                            {resendSuccess}
                        </div>
                    ) : null}

                    <button type="submit" className={c.primaryBtn} disabled={loading}>
                        {loading ? "Signing in…" : "Sign in →"}
                    </button>
                </form>

                <AuthNavLinks
                    variant="dark"
                    showBackHome={false}
                    footerPrompt="Don't have an account?"
                    footerHref="/register"
                    footerLabel="Create one free"
                />
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
