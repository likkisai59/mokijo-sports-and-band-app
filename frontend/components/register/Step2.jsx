"use client";
import { useState } from "react";
import styles from "../../app/styles/signup.module.css";
import { hearAboutOptions, termsOptions } from "./constants";
import PasswordField from "@/components/ui/PasswordField";
import PhoneInput from "@/components/ui/PhoneInput";
import {
    isValidPersonName,
    isValidEmail,
    isStrongPassword,
    isValidPhone,
    isValidAadhaar,
    composePhone,
    digitsOnly,
    applyNameInput,
    applyEmailInput,
    PERSON_NAME_MESSAGE,
    EMAIL_MESSAGE,
    STRONG_PASSWORD_MESSAGE,
    AADHAAR_MESSAGE,
    phoneLengthMessage,
} from "@/lib/validation";

const fieldErrorStyle = { color: "#ef4444", fontSize: "12px", marginTop: "6px", marginBottom: 0 };

export default function Step2({ formData, onChange, onPrevious, onSubmit, loading }) {
    const [phoneCode, setPhoneCode] = useState("+91");
    const [phoneDigits, setPhoneDigits] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState("");

    function syncPhone(code, digits) {
        setPhoneCode(code);
        setPhoneDigits(digits);
        onChange("phone", composePhone(code, digits));
        setFieldErrors((prev) => ({
            ...prev,
            phone: digits && !isValidPhone(digits, code) ? phoneLengthMessage(code) : "",
        }));
    }

    function handleNameChange(field, raw) {
        const { sanitized, error } = applyNameInput(raw);
        onChange(field, sanitized);
        setFieldErrors((prev) => ({ ...prev, [field]: error }));
        setFormError("");
    }

    function handleAadhaarChange(raw) {
        const next = digitsOnly(raw).slice(0, 12);
        onChange("aadharNumber", next);
        setFieldErrors((prev) => ({
            ...prev,
            aadharNumber: next && next.length !== 12 ? AADHAAR_MESSAGE : "",
        }));
        setFormError("");
    }

    function handleSubmit() {
        if (loading) return;

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
        if (!formData.email) {
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

        const missingOther = !formData.hearAbout || !formData.termsAgreed;
        if (formData.termsAgreed === "No") {
            nextErrors.termsAgreed = "You must agree to the terms and conditions to sign up.";
        }

        setFieldErrors(nextErrors);

        if (Object.keys(nextErrors).length || missingOther) {
            if (missingOther && !Object.keys(nextErrors).length) {
                setFormError("Please fill in all fields before submitting.");
            } else if (missingOther) {
                setFormError("Please fill in all fields before submitting.");
            } else {
                setFormError("");
            }
            return;
        }

        setFormError("");
        onChange("phone", composePhone(phoneCode, phoneDigits));
        onSubmit();
    }

    return (
        <div className={styles.stepContainer}>
            <div className={styles.stepIndicator}>
                <div className={styles.stepDot}>1</div>
                <div className={styles.stepLine}></div>
                <div className={`${styles.stepDot} ${styles.activeDot}`}>2</div>
            </div>

            <h2 className={styles.stepTitle}>Admin Details</h2>
            <p className={styles.stepSubtitle}>Tell us about the club administrator</p>

            <div className={styles.twoColumns}>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>First Name *</label>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={(e) => handleNameChange("firstName", e.target.value)}
                        disabled={loading}
                    />
                    {fieldErrors.firstName ? <p style={fieldErrorStyle}>{fieldErrors.firstName}</p> : null}
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Last Name *</label>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={(e) => handleNameChange("lastName", e.target.value)}
                        disabled={loading}
                    />
                    {fieldErrors.lastName ? <p style={fieldErrorStyle}>{fieldErrors.lastName}</p> : null}
                </div>
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Club Admin Email *</label>
                <input
                    type="email"
                    className={styles.input}
                    placeholder="admin@yourclub.com"
                    value={formData.email}
                    onChange={(e) => {
                        const { value, error } = applyEmailInput(e.target.value);
                        onChange("email", value);
                        setFieldErrors((prev) => ({ ...prev, email: error }));
                        setFormError("");
                    }}
                    disabled={loading}
                />
                {fieldErrors.email ? <p style={fieldErrorStyle}>{fieldErrors.email}</p> : null}
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Password *</label>
                <PasswordField
                    className={styles.input}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => {
                        onChange("password", e.target.value);
                        setFieldErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    disabled={loading}
                />
                {fieldErrors.password ? <p style={fieldErrorStyle}>{fieldErrors.password}</p> : null}
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Club Admin Phone Number *</label>
                <PhoneInput
                    id="club-admin-phone"
                    className={styles.input}
                    selectClassName={styles.select}
                    countryCode={phoneCode}
                    digits={phoneDigits}
                    onCountryCodeChange={(code) => syncPhone(code, phoneDigits)}
                    onDigitsChange={(digits) => syncPhone(phoneCode, digits)}
                    disabled={loading}
                />
                {fieldErrors.phone ? <p style={fieldErrorStyle}>{fieldErrors.phone}</p> : null}
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Club Admin Aadhar Number *</label>
                <input
                    type="text"
                    className={styles.input}
                    placeholder="12-digit Aadhar Number"
                    inputMode="numeric"
                    maxLength={12}
                    value={formData.aadharNumber}
                    onChange={(e) => handleAadhaarChange(e.target.value)}
                    disabled={loading}
                />
                {fieldErrors.aadharNumber ? <p style={fieldErrorStyle}>{fieldErrors.aadharNumber}</p> : null}
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>How did you hear about Mukijo? *</label>
                <select
                    className={styles.select}
                    value={formData.hearAbout}
                    onChange={(e) => onChange("hearAbout", e.target.value)}
                    disabled={loading}
                >
                    <option value="">-- Select an Option --</option>
                    {hearAboutOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Terms & Conditions *</label>
                <p className={styles.termsText}>
                    I hereby confirm that I have read and accept the Terms & Conditions, and that I have the right to
                    enter this agreement on behalf of my club or organisation.
                </p>
                <select
                    className={styles.select}
                    value={formData.termsAgreed}
                    onChange={(e) => {
                        onChange("termsAgreed", e.target.value);
                        setFieldErrors((prev) => ({ ...prev, termsAgreed: "" }));
                    }}
                    disabled={loading}
                >
                    <option value="">-- Select --</option>
                    {termsOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                {fieldErrors.termsAgreed ? <p style={fieldErrorStyle}>{fieldErrors.termsAgreed}</p> : null}
            </div>

            {formError ? <p style={fieldErrorStyle}>{formError}</p> : null}

            <div className={styles.buttonRow}>
                <button type="button" className={styles.prevButton} onClick={onPrevious} disabled={loading}>
                    ← Previous
                </button>
                <button
                    type="button"
                    className={styles.submitButton}
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                >
                    {loading ? "Registering..." : "Sign Up"}
                </button>
            </div>
        </div>
    );
}
