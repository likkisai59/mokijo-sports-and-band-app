"use client";
import { API_BASE_URL } from "@/lib/api";

import { useState } from "react";
import Link from "next/link";
import styles from "../styles/signup.module.css";
import PhoneInput from "@/components/ui/PhoneInput";
import PasswordField from "@/components/ui/PasswordField";
import {
    digitsOnly,
    isValidPhone,
    isValidAadhaar,
    isValidPersonName,
    isValidEmail,
    isValidDob,
    isStrongPassword,
    applyNameInput,
    applyEmailInput,
    composePhone,
    isoToDob,
    dobToIso,
    AADHAAR_MESSAGE,
    DOB_MESSAGE,
    PERSON_NAME_MESSAGE,
    EMAIL_MESSAGE,
    STRONG_PASSWORD_MESSAGE,
    phoneLengthMessage,
} from "@/lib/validation";

const fieldErrorStyle = { color: "#ef4444", fontSize: "12px", marginTop: "6px", marginBottom: 0 };

export default function RegisterUserPage() {
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [phoneCode, setPhoneCode] = useState("+91");
    const [phoneDigits, setPhoneDigits] = useState("");

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        dob: "",
        email: "",
        password: "",
        phone: "",
        aadharNumber: "",
    });

    const syncPhone = (code, digits) => {
        setPhoneCode(code);
        setPhoneDigits(digits);
        setFormData((prev) => ({ ...prev, phone: composePhone(code, digits) }));
        setFieldErrors((prev) => ({
            ...prev,
            phone: digits && !isValidPhone(digits, code) ? phoneLengthMessage(code) : "",
        }));
        setError(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setError(null);

        let nextValue = value;
        let fieldError = "";

        if (name === "firstName" || name === "lastName") {
            const result = applyNameInput(value);
            nextValue = result.sanitized;
            fieldError = result.error;
        } else if (name === "email") {
            const result = applyEmailInput(value);
            nextValue = result.value;
            fieldError = result.error;
        } else if (name === "password") {
            nextValue = value;
            if (value && !isStrongPassword(value)) {
                fieldError = STRONG_PASSWORD_MESSAGE;
            }
        } else if (name === "aadharNumber") {
            nextValue = digitsOnly(value).slice(0, 12);
            if (nextValue && nextValue.length !== 12) {
                fieldError = AADHAAR_MESSAGE;
            }
        }

        setFormData((prev) => ({
            ...prev,
            [name]: nextValue,
        }));
        setFieldErrors((prev) => ({ ...prev, [name]: fieldError }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const nextErrors = {};
        if (!formData.firstName?.trim()) {
            nextErrors.firstName = "First name is required.";
        } else if (!isValidPersonName(formData.firstName)) {
            nextErrors.firstName = PERSON_NAME_MESSAGE;
        }
        if (!formData.lastName?.trim()) {
            nextErrors.lastName = "Last name is required.";
        } else if (!isValidPersonName(formData.lastName)) {
            nextErrors.lastName = PERSON_NAME_MESSAGE;
        }
        if (!formData.dob) {
            nextErrors.dob = "Date of birth is required.";
        } else if (!isValidDob(formData.dob)) {
            nextErrors.dob = DOB_MESSAGE;
        }
        if (!formData.email?.trim()) {
            nextErrors.email = "Email is required.";
        } else if (!isValidEmail(formData.email)) {
            nextErrors.email = EMAIL_MESSAGE;
        }
        if (!formData.password) {
            nextErrors.password = "Password is required.";
        } else if (!isStrongPassword(formData.password)) {
            nextErrors.password = STRONG_PASSWORD_MESSAGE;
        }
        if (!phoneDigits) {
            nextErrors.phone = "Phone number is required.";
        } else if (!isValidPhone(phoneDigits, phoneCode)) {
            nextErrors.phone = phoneLengthMessage(phoneCode);
        }
        if (!formData.aadharNumber) {
            nextErrors.aadharNumber = "Aadhaar number is required.";
        } else if (!isValidAadhaar(formData.aadharNumber)) {
            nextErrors.aadharNumber = AADHAAR_MESSAGE;
        }

        if (Object.keys(nextErrors).length) {
            setFieldErrors(nextErrors);
            setLoading(false);
            return;
        }

        const payload = {
            ...formData,
            phone: composePhone(phoneCode, phoneDigits),
        };

        try {
            const apiUrl = `${API_BASE_URL}/user/register`;
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
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
                                {fieldErrors.firstName ? <p style={fieldErrorStyle}>{fieldErrors.firstName}</p> : null}
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
                                {fieldErrors.lastName ? <p style={fieldErrorStyle}>{fieldErrors.lastName}</p> : null}
                            </div>
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Date of Birth (DD/MM/YYYY)</label>
                            <input
                                type="date"
                                name="dob"
                                className={styles.input}
                                value={dobToIso(formData.dob)}
                                onChange={(e) => {
                                    setError(null);
                                    const next = isoToDob(e.target.value);
                                    setFormData((prev) => ({ ...prev, dob: next }));
                                    setFieldErrors((prev) => ({
                                        ...prev,
                                        dob: next && !isValidDob(next) ? DOB_MESSAGE : "",
                                    }));
                                }}
                                min="1900-01-01"
                                max={new Date().toISOString().slice(0, 10)}
                                required
                                style={{ colorScheme: "dark" }}
                            />
                            {fieldErrors.dob ? <p style={fieldErrorStyle}>{fieldErrors.dob}</p> : null}
                        </div>

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
                            {fieldErrors.email ? <p style={fieldErrorStyle}>{fieldErrors.email}</p> : null}
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Phone Number</label>
                            <PhoneInput
                                id="user-register-phone"
                                className={styles.input}
                                selectClassName={styles.select}
                                countryCode={phoneCode}
                                digits={phoneDigits}
                                onCountryCodeChange={(code) => syncPhone(code, phoneDigits)}
                                onDigitsChange={(digits) => syncPhone(phoneCode, digits)}
                            />
                            {fieldErrors.phone ? <p style={fieldErrorStyle}>{fieldErrors.phone}</p> : null}
                        </div>

                        <div className={styles.twoColumns}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Password</label>
                                <PasswordField
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className={styles.input}
                                />
                                {fieldErrors.password ? <p style={fieldErrorStyle}>{fieldErrors.password}</p> : null}
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Aadhar Number</label>
                                <input
                                    type="text"
                                    name="aadharNumber"
                                    inputMode="numeric"
                                    value={formData.aadharNumber}
                                    onChange={handleChange}
                                    placeholder="12-digit number"
                                    className={styles.input}
                                    maxLength={12}
                                    required
                                />
                                {fieldErrors.aadharNumber ? (
                                    <p style={fieldErrorStyle}>{fieldErrors.aadharNumber}</p>
                                ) : null}
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
