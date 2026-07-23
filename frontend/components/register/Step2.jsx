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
    PERSON_NAME_MESSAGE,
    EMAIL_MESSAGE,
    STRONG_PASSWORD_MESSAGE,
    AADHAAR_MESSAGE,
    phoneLengthMessage,
} from "@/lib/validation";

export default function Step2({ formData, onChange, onPrevious, onSubmit, loading }) {
    const [phoneCode, setPhoneCode] = useState("+91");
    const [phoneDigits, setPhoneDigits] = useState("");

    function syncPhone(code, digits) {
        setPhoneCode(code);
        setPhoneDigits(digits);
        onChange("phone", composePhone(code, digits));
    }

    function handleSubmit() {
        if (loading) return;
        if (
            !formData.firstName ||
            !formData.lastName ||
            !formData.email ||
            !formData.password ||
            !phoneDigits ||
            !formData.aadharNumber ||
            !formData.hearAbout ||
            !formData.termsAgreed
        ) {
            alert("Please fill in all fields before submitting.");
            return;
        }
        if (!isValidPersonName(formData.firstName) || !isValidPersonName(formData.lastName)) {
            alert(PERSON_NAME_MESSAGE);
            return;
        }
        if (!isValidEmail(formData.email)) {
            alert(EMAIL_MESSAGE);
            return;
        }
        if (!isStrongPassword(formData.password)) {
            alert(STRONG_PASSWORD_MESSAGE);
            return;
        }
        if (!isValidPhone(phoneDigits, phoneCode)) {
            alert(phoneLengthMessage(phoneCode));
            return;
        }
        if (!isValidAadhaar(formData.aadharNumber)) {
            alert(AADHAAR_MESSAGE);
            return;
        }
        if (formData.termsAgreed === "No") {
            alert("You must agree to the terms and conditions to sign up.");
            return;
        }
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
                        onChange={(e) => onChange("firstName", e.target.value)}
                        disabled={loading}
                    />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Last Name *</label>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={(e) => onChange("lastName", e.target.value)}
                        disabled={loading}
                    />
                </div>
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Club Admin Email *</label>
                <input
                    type="email"
                    className={styles.input}
                    placeholder="admin@yourclub.com"
                    value={formData.email}
                    onChange={(e) => onChange("email", e.target.value)}
                    disabled={loading}
                />
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Password *</label>
                <PasswordField
                    className={styles.input}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => onChange("password", e.target.value)}
                    disabled={loading}
                />
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
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Club Admin Aadhar Number *</label>
                <input
                    type="text"
                    className={styles.input}
                    placeholder="12-digit Aadhar Number"
                    maxLength={12}
                    value={formData.aadharNumber}
                    onChange={(e) => onChange("aadharNumber", e.target.value.replace(/\D/g, ""))}
                    disabled={loading}
                />
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
                    onChange={(e) => onChange("termsAgreed", e.target.value)}
                    disabled={loading}
                >
                    <option value="">-- Select --</option>
                    {termsOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </div>

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
