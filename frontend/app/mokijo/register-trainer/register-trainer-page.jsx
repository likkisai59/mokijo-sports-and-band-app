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

const c = getAuthClasses("light");
import {
    digitsOnly,
    applyNameInput,
    applyEmailInput,
    isValidPersonName,
    isValidEmail,
    isValidPhone,
    isValidAadhaar,
    isStrongPassword,
    composePhone,
    PERSON_NAME_MESSAGE,
    EMAIL_MESSAGE,
    AADHAAR_MESSAGE,
    STRONG_PASSWORD_MESSAGE,
    phoneLengthMessage,
} from "@/lib/validation";

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
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [phoneCode, setPhoneCode] = useState("+91");
    const [phoneDigits, setPhoneDigits] = useState("");

    function syncPhone(code, digits) {
        setPhoneCode(code);
        setPhoneDigits(digits);
        setFormData((prev) => ({ ...prev, phone: composePhone(code, digits) }));
        setErrors((prev) => ({
            ...prev,
            phone: digits && !isValidPhone(digits, code) ? phoneLengthMessage(code) : null,
        }));
    }

    function handleFieldChange(name, value) {
        let nextValue = value;
        let fieldError = null;

        if (name === "first_name" || name === "last_name") {
            const result = applyNameInput(value);
            nextValue = result.sanitized;
            fieldError = result.error || null;
        } else if (name === "email") {
            const result = applyEmailInput(value);
            nextValue = result.value;
            fieldError = result.error || null;
        } else if (name === "password") {
            nextValue = value;
            fieldError = value && !isStrongPassword(value) ? STRONG_PASSWORD_MESSAGE : null;
        } else if (name === "aadhar") {
            nextValue = digitsOnly(value).slice(0, 12);
            fieldError = nextValue && nextValue.length !== 12 ? AADHAAR_MESSAGE : null;
        }

        setFormData((prev) => ({ ...prev, [name]: nextValue }));
        setErrors((prev) => ({ ...prev, [name]: fieldError }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitError("");

        const newErrors = {};
        if (!String(formData.first_name || "").trim()) {
            newErrors.first_name = "First Name is required";
        } else if (!isValidPersonName(formData.first_name)) {
            newErrors.first_name = PERSON_NAME_MESSAGE;
        }
        if (!String(formData.last_name || "").trim()) {
            newErrors.last_name = "Last Name is required";
        } else if (!isValidPersonName(formData.last_name)) {
            newErrors.last_name = PERSON_NAME_MESSAGE;
        }
        if (!String(formData.email || "").trim()) {
            newErrors.email = "Email Address is required";
        } else if (!isValidEmail(formData.email)) {
            newErrors.email = EMAIL_MESSAGE;
        }
        if (!String(formData.password || "").trim()) {
            newErrors.password = "Password is required";
        } else if (!isStrongPassword(formData.password)) {
            newErrors.password = STRONG_PASSWORD_MESSAGE;
        }
        if (!confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password.";
        } else if (confirmPassword !== formData.password) {
            newErrors.confirmPassword = "Passwords do not match.";
        }
        if (!phoneDigits) {
            newErrors.phone = "Phone Number is required";
        } else if (!isValidPhone(phoneDigits, phoneCode)) {
            newErrors.phone = phoneLengthMessage(phoneCode);
        }
        if (formData.aadhar && !isValidAadhaar(formData.aadhar)) {
            newErrors.aadhar = AADHAAR_MESSAGE;
        }
        if (!String(formData.specialization || "").trim()) {
            newErrors.specialization = "Specialization / Sport is required";
        }
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
                    phone: composePhone(phoneCode, phoneDigits),
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
        <AuthShell variant="light">
            <AuthCard size="register" variant="light">
                <Link href="/" className={c.backLink}>
                    ← Back to Home
                </Link>

                <AuthBrand
                    variant="light"
                    align="center"
                    title="Trainer Registration"
                    subtitle="Create your independent trainer account"
                />

                {submitted ? (
                    <SuccessScreen role="trainer" />
                ) : (
                    <>
                        <AuthErrorBanner variant="light">{submitError}</AuthErrorBanner>

                        <form className="flex flex-col gap-6 w-full items-center" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-[380px] mx-auto text-left">
                                <AuthField variant="light" label="First Name" required error={errors.first_name}>
                                    <input
                                        type="text"
                                        className={c.input}
                                        placeholder="Enter first name"
                                        value={formData.first_name}
                                        onChange={(e) => handleFieldChange("first_name", e.target.value)}
                                    />
                                </AuthField>

                                <AuthField variant="light" label="Last Name" required error={errors.last_name}>
                                    <input
                                        type="text"
                                        className={c.input}
                                        placeholder="Enter last name"
                                        value={formData.last_name}
                                        onChange={(e) => handleFieldChange("last_name", e.target.value)}
                                    />
                                </AuthField>
                            </div>

                            <AuthField variant="light" label="Email Address" required error={errors.email}>
                                <input
                                    type="email"
                                    className={c.input}
                                    placeholder="trainer@example.com"
                                    value={formData.email}
                                    onChange={(e) => handleFieldChange("email", e.target.value)}
                                />
                            </AuthField>

                            <AuthField
                                variant="light"
                                label="Create Password"
                                required
                                error={errors.password}
                                hint="Min 8 chars with upper, lower, number, and special character."
                            >
                                <PasswordField
                                    tone="light"
                                    className={c.input}
                                    placeholder="Choose a password"
                                    value={formData.password}
                                    onChange={(e) => handleFieldChange("password", e.target.value)}
                                />
                            </AuthField>

                            <AuthField variant="light" label="Confirm Password" required error={errors.confirmPassword}>
                                <PasswordField
                                    tone="light"
                                    className={c.input}
                                    placeholder="Re-enter password"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        setErrors((prev) => ({
                                            ...prev,
                                            confirmPassword:
                                                e.target.value && e.target.value !== formData.password
                                                    ? "Passwords do not match."
                                                    : null,
                                        }));
                                    }}
                                />
                            </AuthField>

                            <AuthField variant="light" label="Phone Number" required error={errors.phone}>
                                <PhoneInput
                                    id="trainer-register-phone"
                                    className={c.input}
                                    selectClassName={c.select}
                                    countryCode={phoneCode}
                                    digits={phoneDigits}
                                    onCountryCodeChange={(code) => syncPhone(code, phoneDigits)}
                                    onDigitsChange={(digits) => syncPhone(phoneCode, digits)}
                                />
                            </AuthField>

                            <AuthField variant="light" label="Specialization / Sport" required error={errors.specialization}>
                                <input
                                    type="text"
                                    className={c.input}
                                    placeholder="e.g., Football, Cricket"
                                    value={formData.specialization}
                                    onChange={(e) => handleFieldChange("specialization", e.target.value)}
                                />
                            </AuthField>

                            <AuthField variant="light" label="Coaching Experience (Years)">
                                <input
                                    type="number"
                                    className={c.input}
                                    placeholder="e.g., 5"
                                    value={formData.experience}
                                    onChange={(e) => handleFieldChange("experience", e.target.value)}
                                />
                            </AuthField>

                            <AuthField variant="light" label="Aadhaar Number" error={errors.aadhar}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className={c.input}
                                    placeholder="12-digit Aadhaar"
                                    maxLength={12}
                                    value={formData.aadhar}
                                    onChange={(e) => handleFieldChange("aadhar", e.target.value)}
                                />
                            </AuthField>

                            <AuthField variant="light" label="Interested Sports" required error={errors.sports}>
                                <div className="max-h-[180px] overflow-y-auto border-2 border-gray-300 rounded-xl p-3 bg-gray-50 flex flex-col gap-2 w-full max-w-[380px] mx-auto">
                                    {SPORTS.map((sport) => {
                                        const selectedSports = formData.sports || [];
                                        const isChecked = selectedSports.includes(sport);
                                        return (
                                            <label
                                                key={sport}
                                                className="flex items-center gap-2.5 cursor-pointer text-sm text-black font-bold"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        const updated = e.target.checked
                                                            ? [...selectedSports, sport]
                                                            : selectedSports.filter((s) => s !== sport);
                                                        handleFieldChange("sports", updated);
                                                    }}
                                                    className="w-4 h-4 accent-black cursor-pointer"
                                                />
                                                <span>{sport}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </AuthField>

                            <div className="w-full max-w-[380px] mx-auto mt-2">
                                <button type="submit" className={c.primaryBtn} disabled={loading}>
                                    {loading ? "Creating Account..." : "Create Trainer Account"}
                                </button>
                            </div>
                        </form>

                        <div className="mt-4 flex flex-col gap-4 w-full max-w-[380px] mx-auto">
                            <AuthNavLinks
                                variant="light"
                                showBackHome={false}
                                footerPrompt="Already have an account?"
                                footerHref="/login-trainer"
                                footerLabel="Sign in"
                            />
                        </div>
                    </>
                )}
            </AuthCard>
        </AuthShell>
    );
}
