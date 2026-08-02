"use client";
import { API_BASE_URL } from "@/lib/api";
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
        try {
            const res = await fetch(`${API_BASE_URL}/trainer/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem("trainerId", data.trainerId);
                localStorage.setItem("trainerName", data.trainerName);
                localStorage.setItem("userRole", "trainer");
                localStorage.setItem("isTrainer", "true");
                localStorage.setItem("accessToken", data.access_token);
                window.location.href = "/trainer-dashboard";
            } else {
                setError(data.detail || "Login failed.");
            }
        } catch {
            setError("Cannot connect to server.");
        } finally {
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
                    title="Trainer Sign In"
                    subtitle="Welcome back — enter your credentials to continue."
                />

                {showSuccess ? (
                    <AuthSuccessBanner variant="dark">You can now sign in to your trainer account.</AuthSuccessBanner>
                ) : null}

                <form className="block" onSubmit={handleSubmit}>
                    <AuthField variant="dark" label="Email address" htmlFor="email" required>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            placeholder="trainer@example.com"
                            className={c.input}
                            value={form.email}
                            onChange={handleChange}
                        />
                    </AuthField>

                    <AuthField variant="dark" label="Password" htmlFor="password" required>
                        <PasswordField
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            className={c.input}
                            value={form.password}
                            onChange={handleChange}
                            autoComplete="current-password"
                            required
                            tone="dark"
                        />
                    </AuthField>

                    <AuthErrorBanner variant="dark">{error}</AuthErrorBanner>

                    <button type="submit" className={c.primaryBtn} disabled={loading}>
                        {loading ? "Signing in…" : "Sign in →"}
                    </button>
                </form>

                <AuthNavLinks
                    variant="dark"
                    showBackHome={false}
                    footerPrompt="Don't have an account?"
                    footerHref="/register-trainer"
                    footerLabel="Create one free"
                />
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
