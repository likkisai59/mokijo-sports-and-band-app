"use client";
import { API_BASE_URL } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import PhoneInput from "@/components/ui/PhoneInput";
import PasswordField from "@/components/ui/PasswordField";
import SuccessScreen from "@/components/register/SuccessScreen";
import {
    AuthShell,
    AuthCard,
    AuthBrand,
    AuthField,
    AuthErrorBanner,
    AuthNavLinks,
    getAuthClasses,
} from "@/components/auth";

const c = getAuthClasses("dark");
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

export default function RegisterUserPage() {
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [phoneCode, setPhoneCode] = useState("+91");
    const [phoneDigits, setPhoneDigits] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

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

        setFormData((prev) => ({ ...prev, [name]: nextValue }));
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
        if (!confirmPassword) {
            nextErrors.confirmPassword = "Please confirm your password.";
        } else if (confirmPassword !== formData.password) {
            nextErrors.confirmPassword = "Passwords do not match.";
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
            const response = await fetch(`${API_BASE_URL}/user/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setSubmitted(true);
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
        <AuthShell variant="dark">
            <AuthCard size="md" variant="dark">
                <Link href="/" className={c.backLink}>
                    ← Back to Home
                </Link>

                <AuthBrand
                    variant="dark"
                    align="center"
                    title="Create User Account"
                    subtitle="Register as a sports user to start booking slots"
                />

                {submitted ? (
                    <SuccessScreen role="user" />
                ) : (
                    <>
                        <AuthErrorBanner variant="dark">{error}</AuthErrorBanner>

                        <form className="block" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AuthField variant="dark" label="First Name" required error={fieldErrors.firstName}>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="John"
                                        className={c.input}
                                    />
                                </AuthField>
                                <AuthField variant="dark" label="Last Name" required error={fieldErrors.lastName}>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Doe"
                                        className={c.input}
                                    />
                                </AuthField>
                            </div>

                            <AuthField variant="dark" label="Date of Birth" required error={fieldErrors.dob}>
                                <input
                                    type="date"
                                    name="dob"
                                    className={c.input}
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
                                    style={{ colorScheme: "dark" }}
                                />
                            </AuthField>

                            <AuthField variant="dark" label="Email address" required error={fieldErrors.email}>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john@example.com"
                                    className={c.input}
                                />
                            </AuthField>

                            <AuthField variant="dark" label="Phone Number" required error={fieldErrors.phone}>
                                <PhoneInput
                                    id="user-register-phone"
                                    className={c.input}
                                    selectClassName={c.select}
                                    countryCode={phoneCode}
                                    digits={phoneDigits}
                                    onCountryCodeChange={(code) => syncPhone(code, phoneDigits)}
                                    onDigitsChange={(digits) => syncPhone(phoneCode, digits)}
                                />
                            </AuthField>

                            <AuthField
                                variant="dark"
                                label="Password"
                                required
                                error={fieldErrors.password}
                                hint="Min 8 chars with upper, lower, number, and special character."
                            >
                                <PasswordField
                                    tone="dark"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className={c.input}
                                />
                            </AuthField>

                            <AuthField variant="dark" label="Confirm Password" required error={fieldErrors.confirmPassword}>
                                <PasswordField
                                    tone="dark"
                                    name="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        setFieldErrors((prev) => ({
                                            ...prev,
                                            confirmPassword:
                                                e.target.value && e.target.value !== formData.password
                                                    ? "Passwords do not match."
                                                    : "",
                                        }));
                                    }}
                                    placeholder="••••••••"
                                    className={c.input}
                                    autoComplete="new-password"
                                />
                            </AuthField>

                            <AuthField variant="dark" label="Aadhaar Number" required error={fieldErrors.aadharNumber}>
                                <input
                                    type="text"
                                    name="aadharNumber"
                                    inputMode="numeric"
                                    value={formData.aadharNumber}
                                    onChange={handleChange}
                                    placeholder="12-digit number"
                                    className={c.input}
                                    maxLength={12}
                                />
                            </AuthField>

                            <button type="submit" className={c.primaryBtn} disabled={loading}>
                                {loading ? "Registering User..." : "Register"}
                            </button>
                        </form>

                        <AuthNavLinks
                            variant="dark"
                            showBackHome={false}
                            footerPrompt="Already have an account?"
                            footerHref="/login-user"
                            footerLabel="Sign In"
                        />
                    </>
                )}
            </AuthCard>
        </AuthShell>
    );
}
