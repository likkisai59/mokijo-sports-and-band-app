"use client";
import { API_BASE_URL } from "@/lib/api";

import { useState } from "react";
import Link from "next/link";
import styles from "../styles/signup.module.css";

export default function RegisterUserPage() {
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        dob: "",
        email: "",
        password: "",
        phone: "",
        aadharNumber: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setError(null);
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Simple validation
        if (
            !formData.firstName ||
            !formData.lastName ||
            !formData.dob ||
            !formData.email ||
            !formData.password ||
            !formData.phone ||
            !formData.aadharNumber
        ) {
            setError("All fields are required.");
            setLoading(false);
            return;
        }

        try {
            const apiUrl = `${API_BASE_URL}/user/register`;
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setSubmitted(true);
                setTimeout(() => {
                    window.location.href = "/login-user?registered=true";
                }, 2000);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.detail || "Registration failed. Please check your inputs.");
            }
        } catch (err) {
            console.error(err);
            setError("Connection error. Is the backend server running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.card}>
                {error && (
                    <div
                        style={{
                            backgroundColor: "#ffe3e3",
                            color: "#d32f2f",
                            padding: "12px",
                            borderRadius: "8px",
                            marginBottom: "20px",
                            fontSize: "14px",
                            textAlign: "center",
                            border: "1px solid #fbc2c2",
                        }}
                    >
                        {error}
                    </div>
                )}

                <div className={styles.brand}>
                    <span className={styles.brandName}>Mukijo</span>
                    <span className={styles.brandTag}>User Account Sign Up</span>
                </div>

                {submitted ? (
                    <div style={{ textAlign: "center", padding: "24px 0" }}>
                        <div
                            style={{
                                width: "60px",
                                height: "60px",
                                borderRadius: "50%",
                                background: "rgba(198, 255, 61, 0.1)",
                                color: "#c6ff3d",
                                fontSize: "24px",
                                fontWeight: "bold",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 16px auto",
                                border: "2px solid #c6ff3d",
                            }}
                        >
                            ✓
                        </div>
                        <h2 className={styles.stepTitle}>Account Created!</h2>
                        <p className={styles.stepSubtitle} style={{ marginBottom: "30px" }}>
                            Your standard user account was created successfully. You can now login.
                        </p>
                        <Link
                            href="/login-user"
                            className={styles.nextButton}
                            style={{ display: "inline-block", textDecoration: "none" }}
                        >
                            Go to Sign In
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
                        <Link
                            href="/"
                            className={styles.prevButton}
                            style={{
                                display: "inline-block",
                                alignSelf: "flex-start",
                                marginBottom: "16px",
                                textDecoration: "none",
                                width: "fit-content",
                            }}
                        >
                            ← Back to Home
                        </Link>

                        <h2 className={styles.stepTitle}>Create User Account</h2>
                        <p className={styles.stepSubtitle}>Register as a sports user to start booking slots</p>

                        <div className={styles.twoColumns}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="John"
                                    className={styles.input}
                                    required
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Doe"
                                    className={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Date of Birth</label>
                            <input
                                type="date"
                                name="dob"
                                value={formData.dob}
                                onChange={handleChange}
                                className={styles.input}
                                required
                            />
                        </div>

                        <div className={styles.twoColumns}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Email address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john@example.com"
                                    className={styles.input}
                                    required
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="10-digit number"
                                    className={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.twoColumns}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className={styles.input}
                                    required
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Aadhar Number</label>
                                <input
                                    type="text"
                                    name="aadharNumber"
                                    value={formData.aadharNumber}
                                    onChange={handleChange}
                                    placeholder="12-digit number"
                                    className={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={styles.nextButton}
                            style={{ marginTop: "16px", width: "100%" }}
                            disabled={loading}
                        >
                            {loading ? "Registering User..." : "Register"}
                        </button>

                        <div
                            style={{
                                textAlign: "center",
                                marginTop: "20px",
                                fontSize: "14px",
                                color: "rgba(148, 163, 184, 0.6)",
                            }}
                        >
                            Already have an account?{" "}
                            <Link
                                href="/login-user"
                                style={{ color: "#d9ff6e", textDecoration: "none", fontWeight: "bold" }}
                            >
                                Sign In
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
