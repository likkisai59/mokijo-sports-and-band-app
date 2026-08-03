"use client";
import { API_BASE_URL } from "@/lib/api";
import { loginRequest, normalizeToken, persistSportsSession, navigateToDashboard } from "@/lib/sportsLogin";
import { useState } from "react";
import Link from "next/link";
import PasswordField from "@/components/ui/PasswordField";
import {
    AuthShell,
    AuthCard,
    AuthBrand,
    AuthField,
    AuthErrorBanner,
    AuthNavLinks,
    getAuthClasses,
} from "@/components/auth";

const c = getAuthClasses("dark");

export default function MukijoAdminLoginPage() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setError("");
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await loginRequest("/mukijo-admin/login", form);
        if (result.ok) {
            const { data } = result;
            const token = normalizeToken(data);
            if (!token) {
                setError("Login failed: Invalid admin session token received.");
                setLoading(false);
                return;
            }
            persistSportsSession({
                userId: data.adminId,
                userName: data.adminName,
                userRole: "mukijo_admin",
                isMember: "false",
                clubName: "Mukijo Platform",
                accessToken: token,
            });
            navigateToDashboard("/dashboard/venue-verification");
        } else {
            setError(result.detail || "Invalid admin credentials.");
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
                    title="Platform Sign In"
                    subtitle="Welcome back — enter your credentials to continue."
                />

                <form className="block" onSubmit={handleSubmit}>
                    <AuthField variant="dark" label="Admin Email" htmlFor="email" required>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            placeholder="admin@example.com"
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

                <AuthNavLinks variant="dark" showBackHome={false} />
            </AuthCard>
        </AuthShell>
    );
}
