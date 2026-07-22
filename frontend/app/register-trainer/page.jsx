"use client";
import { API_BASE_URL } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../styles/signup.module.css";

const SPORTS = ["Tennis", "Cricket", "Football (Soccer)", "Basketball", "Badminton", "Swimming"];

const emptyForm = {
    first_name: "",
    last_name: "",
    dob: "",
    gender: "",
    email: "",
    password: "",
    phone: "",
    aadhar_number: "",
    experience_years: "",
    sports: [],
};

export default function RegisterTrainerPage() {
    const router = useRouter();
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const update = (field, value) => {
        setError("");
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const toggleSport = (sport) => {
        setForm((prev) => {
            const sports = prev.sports.includes(sport)
                ? prev.sports.filter((s) => s !== sport)
                : [...prev.sports, sport];
            return { ...prev, sports };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.sports.length) {
            setError("Select at least one sport.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/trainer/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    first_name: form.first_name.trim(),
                    last_name: form.last_name.trim(),
                    dob: form.dob || null,
                    gender: form.gender || null,
                    email: form.email.trim().toLowerCase(),
                    password: form.password,
                    phone: form.phone.trim(),
                    aadhar_number: form.aadhar_number.trim() || null,
                    experience_years: form.experience_years ? Number(form.experience_years) : null,
                    sports: form.sports,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                router.push("/login-trainer");
            } else {
                setError(data.detail || "Registration failed.");
            }
        } catch {
            setError("Cannot connect to server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.card}>
                <div className={styles.brand}>
                    <span className={styles.brandName}>Mukijo</span>
                    <span className={styles.brandTag}>Trainer Registration</span>
                </div>

                <h2 className={styles.stepTitle}>Trainer Registration</h2>
                <p className={styles.stepSubtitle}>Create your trainer account to offer trainings on Mukijo.</p>

                {error && (
                    <div
                        style={{
                            background: "#fef2f2",
                            color: "#ef4444",
                            padding: "10px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            marginBottom: "16px",
                            textAlign: "center",
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>
                            First Name <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                            className={styles.input}
                            required
                            value={form.first_name}
                            onChange={(e) => update("first_name", e.target.value)}
                            placeholder="Enter first name"
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>
                            Last Name <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                            className={styles.input}
                            required
                            value={form.last_name}
                            onChange={(e) => update("last_name", e.target.value)}
                            placeholder="Enter last name"
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>
                            Date of Birth <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                            type="date"
                            className={styles.input}
                            required
                            value={form.dob}
                            onChange={(e) => update("dob", e.target.value)}
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>
                            Gender <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <select
                            className={styles.select}
                            required
                            value={form.gender}
                            onChange={(e) => update("gender", e.target.value)}
                        >
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>
                            Email Address <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                            type="email"
                            className={styles.input}
                            required
                            value={form.email}
                            onChange={(e) => update("email", e.target.value)}
                            placeholder="trainer@example.com"
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>
                            Create Password <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                            type="password"
                            className={styles.input}
                            required
                            value={form.password}
                            onChange={(e) => update("password", e.target.value)}
                            placeholder="Choose a password"
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>
                            Phone Number <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                            type="tel"
                            className={styles.input}
                            required
                            value={form.phone}
                            onChange={(e) => update("phone", e.target.value)}
                            placeholder="10-digit number"
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Aadhar Number</label>
                        <input
                            className={styles.input}
                            value={form.aadhar_number}
                            onChange={(e) => update("aadhar_number", e.target.value)}
                            placeholder="12-digit Aadhar"
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Experience (Years)</label>
                        <input
                            type="number"
                            min="0"
                            className={styles.input}
                            value={form.experience_years}
                            onChange={(e) => update("experience_years", e.target.value)}
                            placeholder="e.g., 5"
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>
                            All Sports <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <div
                            style={{
                                maxHeight: "180px",
                                overflowY: "auto",
                                border: "1.5px solid rgba(255, 255, 255, 0.08)",
                                borderRadius: "10px",
                                padding: "12px 14px",
                                background: "rgba(255, 255, 255, 0.05)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                                marginTop: "8px",
                            }}
                        >
                            {SPORTS.map((sport) => (
                                <label
                                    key={sport}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        color: "#f1f5f9",
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={form.sports.includes(sport)}
                                        onChange={() => toggleSport(sport)}
                                    />
                                    {sport}
                                </label>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className={styles.nextButton} disabled={loading}>
                        {loading ? "Submitting…" : "Submit"}
                    </button>
                </form>

                <p style={{ marginTop: "20px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
                    Already have an account?{" "}
                    <Link href="/login-trainer" style={{ color: "#bffe00" }}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
