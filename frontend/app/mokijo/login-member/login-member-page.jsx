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

function LoginMemberContent() {
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
            const response = await fetch(`${API_BASE_URL}/login-member`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password.trim(),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("userName", data.userName);
                localStorage.setItem("userId", data.userId);
                localStorage.setItem("clubName", data.clubName);
                localStorage.setItem("isMember", "true");
                localStorage.setItem("memberRole", data.memberRole || "Member");
                localStorage.setItem("memberId", data.memberId || "");
                localStorage.setItem("userEmail", data.userEmail || formData.email);
                localStorage.setItem("userPhone", data.userPhone || "");
                localStorage.setItem("memberGroupName", data.groupName || "");
                localStorage.setItem("approvalStatus", data.approvalStatus || "accepted");
                localStorage.setItem("userRole", "team_member");
                localStorage.setItem("accessToken", data.accessToken);
                window.location.href = "/dashboard";
            } else {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.detail || "Login failed. Make sure your application has been approved.");
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
                    title="Member Sign In"
                    subtitle="Welcome back — enter your credentials to continue."
                />

                {showSuccess ? (
                    <AuthSuccessBanner variant="dark">
                        Your application was submitted. Sign in after the club admin approves it.
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
                    footerHref="/register-member"
                    footerLabel="Create one free"
                />
            </AuthCard>
        </AuthShell>
    );
}

export default function LoginMemberPage() {
    return (
        <Suspense fallback={null}>
            <LoginMemberContent />
        </Suspense>
    );
}
