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

function LoginTrainerContent() {
    const searchParams = useSearchParams();
    const [showSuccess, setShowSuccess] = useState(false);
    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (searchParams.get("registered") === "true") {
            setShowSuccess(true);
        }
    }, [searchParams]);

    const handleChange = (e) => {
        setError("");
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await loginRequest("/trainer/login", form);
        if (result.ok) {
            const { data } = result;
            const token = normalizeToken(data);
            if (!token || !data.trainerId || String(data.trainerId) === "undefined") {
                setError("Login failed: Invalid trainer session received.");
                setLoading(false);
                return;
            }
            persistSportsSession({
                trainerId: data.trainerId,
                trainerName: data.trainerName,
                userRole: "trainer",
                isTrainer: "true",
                accessToken: token,
            });
            navigateToDashboard("/trainer-dashboard");
        } else {
            setError(result.detail || "Login failed.");
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
                            align="center"
                            title="Trainer Sign In"
                            subtitle="Welcome back — enter your credentials to continue."
                        />
                    </div>

                    {showSuccess ? (
                        <div className="w-full max-w-[360px] mb-4">
                            <AuthSuccessBanner variant="light">You can now sign in to your trainer account.</AuthSuccessBanner>
                        </div>
                    ) : null}

                    {/* Centered Form Block */}
                    <form className="block space-y-4 max-w-[360px] w-full text-left" onSubmit={handleSubmit}>
                        <AuthField variant="light" label="Email address" htmlFor="email" required>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="trainer@example.com"
                                    className={c.input}
                                    style={{ paddingLeft: "42px" }}
                                    value={form.email}
                                    onChange={handleChange}
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
                                    value={form.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    required
                                    tone="light"
                                />
                            </div>
                        </AuthField>

                        <AuthErrorBanner variant="light">{error}</AuthErrorBanner>

                        <button
                            type="submit"
                            className={`${c.primaryBtn} flex items-center justify-center gap-2 font-bold tracking-wide transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 !mt-6`}
                            disabled={loading}
                        >
                            <span>{loading ? "Signing in…" : "Sign in →"}</span>
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
                            footerHref="/register-trainer"
                            footerLabel="Create one free"
                        />
                    </div>
                </div>
            </AuthCard>
        </AuthShell>
    );
}

export default function TrainerLoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginTrainerContent />
        </Suspense>
    );
}

