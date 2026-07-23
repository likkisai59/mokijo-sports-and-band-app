"use client";
import { API_BASE_URL } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import styles from "../styles/signup.module.css";

const SPORTS = ["Tennis", "Cricket", "Football (Soccer)", "Basketball", "Badminton", "Swimming"];

const emptyForm = {
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
    specialization: "",
    experience: "",
    aadhar: "",
    sports: [],
};

export default function RegisterTrainerPage() {
    const [formData, setFormData] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitted, setSubmitted] = useState(false);

    function handleFieldChange(name, value) {
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitError("");

        const newErrors = {};
        if (!String(formData.first_name || "").trim()) newErrors.first_name = "First Name is required";
        if (!String(formData.last_name || "").trim()) newErrors.last_name = "Last Name is required";
        if (!String(formData.email || "").trim()) newErrors.email = "Email Address is required";
        if (!String(formData.password || "").trim()) newErrors.password = "Password is required";
        if (!String(formData.phone || "").trim()) newErrors.phone = "Phone Number is required";
        if (!String(formData.specialization || "").trim()) newErrors.specialization = "Specialization / Sport is required";
        if (!(formData.sports && formData.sports.length > 0)) {
            newErrors.sports = "Selecting at least one sport is required";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/trainer/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    first_name: formData.first_name.trim(),
                    last_name: formData.last_name.trim(),
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password.trim(),
                    phone: formData.phone.trim(),
                    specialization: formData.specialization.trim(),
                    experience: formData.experience ? String(formData.experience).trim() : null,
                    aadhar: formData.aadhar ? formData.aadhar.trim() : null,
                    sports: formData.sports,
                }),
            });

            if (response.ok) {
                setSubmitted(true);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setSubmitError(errorData.detail || "Failed to register. Please check details.");
            }
        } catch (err) {
            console.error("Error registering trainer:", err);
            setSubmitError("Server connection error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.card}>
                <div className={styles.brand}>
                    <span className={styles.brandName}>Mukijo</span>
                    <span className={styles.brandTag}>Trainer Registration Portal</span>
                </div>

                {submitted ? (
                    <div className={styles.successContainer}>
                        <div className={styles.successIcon}>OK</div>
                        <h2 className={styles.successTitle}>Registration Successful</h2>
                        <p className={styles.successText}>
                            Your trainer account has been created. You can now sign in and start creating trainings.
                        </p>
                        <Link
                            href="/login-trainer"
                            className={styles.submitButton}
                            style={{
                                display: "inline-block",
                                marginTop: "20px",
                                textDecoration: "none",
                            }}
                        >
                            Go to Trainer Login
                        </Link>
                    </div>
                ) : (
                    <div className={styles.stepContainer}>
                        <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "16px" }}>
                            <Link
                                href="/"
                                className={styles.prevButton}
                                style={{ textDecoration: "none", display: "inline-block" }}
                            >
                                &lt;- Back to Home
                            </Link>
                        </div>

                        {submitError && (
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
                                {submitError}
                            </div>
                        )}

                        <h2 className={styles.stepTitle}>Trainer Registration</h2>
                        <p className={styles.stepSubtitle}>
                            Create your independent trainer account. Fill in your details below.
                        </p>

                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>
                                    First Name <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="Enter first name"
                                    value={formData.first_name}
                                    onChange={(e) => handleFieldChange("first_name", e.target.value)}
                                />
                                {errors.first_name && (
                                    <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                                        {errors.first_name}
                                    </span>
                                )}
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>
                                    Last Name <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="Enter last name"
                                    value={formData.last_name}
                                    onChange={(e) => handleFieldChange("last_name", e.target.value)}
                                />
                                {errors.last_name && (
                                    <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                                        {errors.last_name}
                                    </span>
                                )}
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>
                                    Email Address <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    type="email"
                                    className={styles.input}
                                    placeholder="trainer@example.com"
                                    value={formData.email}
                                    onChange={(e) => handleFieldChange("email", e.target.value)}
                                />
                                {errors.email && (
                                    <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                                        {errors.email}
                                    </span>
                                )}
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>
                                    Create Password <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    type="password"
                                    className={styles.input}
                                    placeholder="Choose a password for your account"
                                    value={formData.password}
                                    onChange={(e) => handleFieldChange("password", e.target.value)}
                                />
                                {errors.password && (
                                    <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                                        {errors.password}
                                    </span>
                                )}
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>
                                    Phone Number <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    type="tel"
                                    className={styles.input}
                                    placeholder="10-digit number"
                                    value={formData.phone}
                                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                                />
                                {errors.phone && (
                                    <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                                        {errors.phone}
                                    </span>
                                )}
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>
                                    Specialization / Sport <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="e.g., Football, Cricket"
                                    value={formData.specialization}
                                    onChange={(e) => handleFieldChange("specialization", e.target.value)}
                                />
                                {errors.specialization && (
                                    <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                                        {errors.specialization}
                                    </span>
                                )}
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Coaching Experience (Years)</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    placeholder="e.g., 5"
                                    value={formData.experience}
                                    onChange={(e) => handleFieldChange("experience", e.target.value)}
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Aadhar Number</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="12-digit Aadhar"
                                    value={formData.aadhar}
                                    onChange={(e) => handleFieldChange("aadhar", e.target.value)}
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>
                                    Interested Sports <span style={{ color: "#ef4444" }}>*</span> (Select all that apply)
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
                                    {SPORTS.map((sport) => {
                                        const selectedSports = formData.sports || [];
                                        const isChecked = selectedSports.includes(sport);
                                        return (
                                            <label
                                                key={sport}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    cursor: "pointer",
                                                    fontSize: "14px",
                                                    color: "#f4f4f5",
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        let updated;
                                                        if (e.target.checked) {
                                                            updated = [...selectedSports, sport];
                                                        } else {
                                                            updated = selectedSports.filter((s) => s !== sport);
                                                        }
                                                        handleFieldChange("sports", updated);
                                                    }}
                                                    style={{
                                                        cursor: "pointer",
                                                        width: "16px",
                                                        height: "16px",
                                                        accentColor: "#c6ff3d",
                                                    }}
                                                />
                                                <span>{sport}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                                {errors.sports && (
                                    <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                                        {errors.sports}
                                    </span>
                                )}
                            </div>

                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={loading}
                                style={{
                                    width: "100%",
                                    marginTop: "10px",
                                    opacity: loading ? 0.7 : 1,
                                    cursor: loading ? "not-allowed" : "pointer",
                                }}
                            >
                                {loading ? "Creating Account..." : "Create Trainer Account"}
                            </button>
                        </form>

                        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#94a3b8" }}>
                            Already have an account?{" "}
                            <Link href="/login-trainer" style={{ color: "#c6ff3d" }}>
                                Sign in
                            </Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
