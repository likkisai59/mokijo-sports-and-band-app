"use client";
import styles from "../../app/styles/signup.module.css";
import { hearAboutOptions, termsOptions } from "./constants";
import PasswordField from "@/components/ui/PasswordField";
import PhoneInput from "@/components/ui/PhoneInput";
import {
    personNameError,
    emailError,
    passwordError,
    phoneError,
    aadhaarError,
    formatAadhaarDisplay,
    digitsOnly,
} from "@/lib/validation";

export default function Step2({ formData, onChange, onPrevious, onSubmit, loading }) {
    function handleSubmit() {
        if (loading) return;

        const firstErr = personNameError(formData.firstName, "First name");
        if (firstErr) {
            alert(firstErr);
            return;
        }
        const lastErr = personNameError(formData.lastName, "Last name");
        if (lastErr) {
            alert(lastErr);
            return;
        }
        const mailErr = emailError(formData.email);
        if (mailErr) {
            alert(mailErr);
            return;
        }
        const pwErr = passwordError(formData.password);
        if (pwErr) {
            alert(pwErr);
            return;
        }
        const phErr = phoneError(formData.phoneDigits, formData.phoneCountryCode || "+91");
        if (phErr) {
            alert(phErr);
            return;
        }
        const aadErr = aadhaarError(formData.aadharNumber);
        if (aadErr) {
            alert(aadErr);
            return;
        }
        if (!formData.hearAbout || !formData.termsAgreed) {
            alert("Please fill in all fields before submitting.");
            return;
        }
        if (formData.termsAgreed === "No") {
            alert("You must agree to the terms and conditions to sign up.");
            return;
        }
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
                <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "6px" }}>
                    Min 8 chars with uppercase, lowercase, number, and special character.
                </p>
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Club Admin Phone Number *</label>
                <PhoneInput
                    countryCode={formData.phoneCountryCode || "+91"}
                    digits={formData.phoneDigits || ""}
                    selectClassName={styles.select}
                    inputClassName={styles.input}
                    disabled={loading}
                    placeholder="10-digit number"
                    onChange={({ countryCode, digits, full }) => {
                        onChange("phoneCountryCode", countryCode);
                        onChange("phoneDigits", digits);
                        onChange("phone", full);
                    }}
                />
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Club Admin Aadhar Number *</label>
                <input
                    type="text"
                    className={styles.input}
                    placeholder="XXXX XXXX XXXX"
                    maxLength={14}
                    value={formatAadhaarDisplay(formData.aadharNumber)}
                    onChange={(e) => {
                        onChange("aadharNumber", digitsOnly(e.target.value).slice(0, 12));
                    }}
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
