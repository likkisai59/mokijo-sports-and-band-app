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

function LoginUserContent() {
    const searchParams = useSearchParams();
    const [showSuccess, setShowSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const response = await fetch(`${API_BASE_URL}/user/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.removeItem("isMember");
                localStorage.removeItem("memberRole");
                localStorage.removeItem("clubName");
                localStorage.removeItem("userPhone");
                localStorage.setItem("userName", data.userName);
                localStorage.setItem("userId", data.userId);
                localStorage.setItem("userEmail", data.userEmail);
                localStorage.setItem("isUser", "true");
                localStorage.setItem("accessToken", data.accessToken);
                window.location.href = "/user-dashboard";
            } else {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.detail || "Invalid credentials. Please try again.");
            }
        } catch {
            setError("Cannot connect to server. Is the backend running?");
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
                    title="User Sign In"
                    subtitle="Welcome back — enter your credentials to continue."
                />

                {showSuccess ? (
                    <AuthSuccessBanner variant="dark">You can now sign in to your account.</AuthSuccessBanner>
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

                    <AuthField variant="dark" label="Password" htmlFor="password" required>
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

                    <button type="submit" className={c.primaryBtn} disabled={loading}>
                        {loading ? "Signing in…" : "Sign in →"}
                    </button>
                </form>

                <AuthNavLinks
                    variant="dark"
                    showBackHome={false}
                    footerPrompt="Don't have an account?"
                    footerHref="/register-user"
                    footerLabel="Create one free"
                />
            </AuthCard>
        </AuthShell>
    );
}

export default function LoginUserPage() {
    return (
        <Suspense fallback={null}>
            <LoginUserContent />
        </Suspense>
    );
}
