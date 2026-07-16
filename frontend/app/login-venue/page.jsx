"use client";
import { API_BASE_URL } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import styles from "../styles/login.module.css";

export default function VenueOwnerLoginPage() {
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
        try {
            const res = await fetch(`${API_BASE_URL}/venue-owner/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem("venueOwnerId", data.ownerId);
                localStorage.setItem("venueOwnerName", data.ownerName);
                localStorage.setItem("isVenueOwner", "true");
                localStorage.setItem("accessToken", data.access_token);
                window.location.href = "/venue-dashboard";
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
        <div className={styles.pageWrapper}>
            <div className={styles.formPanel}>
                <div className={styles.loginCard}>
                    <div className={styles.header}>
                        <span className={styles.logo}>Mukijo</span>
                        <h1 className={styles.title}>Venue Owner Sign In</h1>
                        <p className={styles.subtitle}>Sign in to manage your sports venues</p>
                    </div>
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="email" className={styles.label}>
                                Email address
                            </label>
                            <div className={styles.inputWrapper}>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="owner@example.com"
                                    className={styles.input}
                                    value={form.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="password" className={styles.label}>
                                Password
                            </label>
                            <div className={styles.inputWrapper}>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className={styles.input}
                                    value={form.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        {error && <div className={styles.errorMsg}>{error}</div>}
                        <button type="submit" className={styles.loginButton} disabled={loading}>
                            {loading ? "Signing in…" : "Sign in →"}
                        </button>
                    </form>
                    <div className={styles.divider}>
                        <span>or</span>
                    </div>
                    <div className={styles.footer}>
                        Don&apos;t have an account?{" "}
                        <Link href="/register-venue" className={styles.signupLink}>
                            Register your venue
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
