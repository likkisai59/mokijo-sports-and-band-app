"use client";
import { API_BASE_URL } from "@/lib/api";
import { useState } from "react";
import styles from "../styles/login.module.css";

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
        try {
            const res = await fetch(`${API_BASE_URL}/mukijo-admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem("userId", data.adminId);
                localStorage.setItem("userName", data.adminName);
                localStorage.setItem("userRole", "mukijo_admin");
                localStorage.setItem("isMember", "false");
                localStorage.setItem("accessToken", data.access_token);
                localStorage.setItem("clubName", "Mukijo Platform");
                window.location.href = "/dashboard/venue-verification";
            } else {
                setError(data.detail || "Invalid admin credentials.");
            }
        } catch {
            setError("Cannot connect to admin server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.pageWrapper} style={{ background: "#06060c" }}>
            <div className={styles.formPanel}>
                <div className={styles.loginCard} style={{ background: "#0e0e16", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className={styles.header}>
                        <span className={styles.logo} style={{ color: "#bffe00" }}>Mukijo Admin</span>
                        <h1 className={styles.title}>Platform Sign In</h1>
                        <p className={styles.subtitle}>Enter your administrative credentials to manage verifications</p>
                    </div>
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="email" className={styles.label}>
                                Admin Email
                            </label>
                            <div className={styles.inputWrapper}>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="admin@mukijo.com"
                                    className={styles.input}
                                    style={{ background: "rgba(255,255,255,0.03)", color: "#fff", borderColor: "rgba(255,255,255,0.08)" }}
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
                                    style={{ background: "rgba(255,255,255,0.03)", color: "#fff", borderColor: "rgba(255,255,255,0.08)" }}
                                    value={form.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        {error && <div className={styles.errorMsg}>{error}</div>}
                        <button type="submit" className={styles.loginButton} style={{ background: "#bffe00", color: "#000" }} disabled={loading}>
                            {loading ? "Authenticating…" : "Authenticate →"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
