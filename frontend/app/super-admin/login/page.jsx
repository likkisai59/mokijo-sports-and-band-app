"use client";

import { useState, useEffect } from "react";
import { loginRequest, persistSportsSession, navigateToDashboard } from "@/lib/sportsLogin";
import { ShieldCheck, Lock, User, AlertCircle } from "lucide-react";

export default function SuperAdminLoginPage() {
    const [username, setUsername] = useState("superadmin");
    const [password, setPassword] = useState("superadmin123");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Auto-redirect if already authenticated as superadmin
    useEffect(() => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("accessToken") || localStorage.getItem("access_token");
            const role = localStorage.getItem("userRole");
            if (token && role === "superadmin") {
                navigateToDashboard("/super-admin/dashboard/overview");
            }
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await loginRequest("/superadmin/login", { username, password });

            if (res.ok) {
                persistSportsSession({
                    accessToken: res.data.accessToken || "superadmin-secret-access-token",
                    userRole: "superadmin",
                    userName: res.data.userName || "Super Admin",
                    userEmail: res.data.userEmail || "superadmin@mukijo.com",
                });
                navigateToDashboard("/super-admin/dashboard/overview");
            } else {
                setError(res.detail || "Invalid SuperAdmin credentials.");
                setLoading(false);
            }
        } catch (err) {
            console.error("SuperAdmin login error:", err);
            setError("Unable to connect to server. Please check backend connection.");
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "#070710",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                fontFamily: "inherit",
                color: "#ffffff",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "420px",
                    backgroundColor: "#0f0f1a",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "16px",
                    padding: "32px 28px",
                    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
                }}
            >
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <div
                        style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            marginBottom: "12px",
                            boxShadow: "0 4px 20px rgba(99, 102, 241, 0.4)",
                        }}
                    >
                        <ShieldCheck size={28} />
                    </div>
                    <h1 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 6px 0" }}>Super Admin Portal</h1>
                    <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>
                        Mukijo Platform Management Portal
                    </p>
                </div>

                {error && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            backgroundColor: "rgba(239, 68, 68, 0.12)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#f87171",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            marginBottom: "20px",
                            fontSize: "13px",
                        }}
                    >
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: "18px" }}>
                        <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>
                            SuperAdmin Username / Email
                        </label>
                        <div style={{ position: "relative" }}>
                            <User size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "#64748b" }} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px 10px 38px",
                                    backgroundColor: "#181826",
                                    border: "1px solid rgba(255, 255, 255, 0.12)",
                                    borderRadius: "8px",
                                    color: "#ffffff",
                                    fontSize: "14px",
                                    outline: "none",
                                    boxSizing: "border-box",
                                }}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                        <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>
                            Password
                        </label>
                        <div style={{ position: "relative" }}>
                            <Lock size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "#64748b" }} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px 10px 38px",
                                    backgroundColor: "#181826",
                                    border: "1px solid rgba(255, 255, 255, 0.12)",
                                    borderRadius: "8px",
                                    color: "#ffffff",
                                    fontSize: "14px",
                                    outline: "none",
                                    boxSizing: "border-box",
                                }}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "12px",
                            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "15px",
                            fontWeight: "600",
                            cursor: "pointer",
                            boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? "Authenticating..." : "Login as Super Admin"}
                    </button>
                </form>
            </div>
        </div>
    );
}
