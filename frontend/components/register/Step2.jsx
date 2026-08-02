"use client";
import { useState } from "react";
import { hearAboutOptions, termsOptions } from "./constants";
import { getAuthClasses } from "@/components/auth";
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

const c = getAuthClasses("dark");
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
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-center gap-4 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-[rgba(244,244,245,0.5)]">1</div>
                <div className="flex-1 h-px bg-[rgba(255,255,255,0.1)] max-w-[60px]"></div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-[#c6ff3d] text-[#08080f]">2</div>
            </div>

            <div className="text-center mb-4">
                <h2 className={c.heading}>Admin Details</h2>
                <p className={`${c.subtext} mt-1`}>Tell us about the club administrator</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <label className={`${c.label} text-[rgba(244,244,245,0.75)]`}>First Name *</label>
                    <input
                        type="text"
                        className={c.input}
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={(e) => handleNameChange("firstName", e.target.value)}
                        disabled={loading}
                    />
                    {fieldErrors.firstName ? <p style={fieldErrorStyle}>{fieldErrors.firstName}</p> : null}
                </div>
                <div className="flex flex-col gap-2">
                    <label className={`${c.label} text-[rgba(244,244,245,0.75)]`}>Last Name *</label>
                    <input
                        type="text"
                        className={c.input}
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={(e) => handleNameChange("lastName", e.target.value)}
                        disabled={loading}
                    />
                    {fieldErrors.lastName ? <p style={fieldErrorStyle}>{fieldErrors.lastName}</p> : null}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label className={`${c.label} text-[rgba(244,244,245,0.75)]`}>Club Admin Email *</label>
                <input
                    type="email"
                    className={c.input}
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

            <div className="flex flex-col gap-2">
                <label className={`${c.label} text-[rgba(244,244,245,0.75)]`}>Password *</label>
                <PasswordField
                    tone="dark"
                    className={c.input}
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

            <div className="flex flex-col gap-2">
                <label className={`${c.label} text-[rgba(244,244,245,0.75)]`}>Club Admin Phone Number *</label>
                <PhoneInput
                    id="club-admin-phone"
                    className={c.input}
                    selectClassName={c.select}
                    countryCode={phoneCode}
                    digits={phoneDigits}
                    onCountryCodeChange={(code) => syncPhone(code, phoneDigits)}
                    onDigitsChange={(digits) => syncPhone(phoneCode, digits)}
                    disabled={loading}
                />
                {fieldErrors.phone ? <p style={fieldErrorStyle}>{fieldErrors.phone}</p> : null}
            </div>

            <div className="flex flex-col gap-2">
                <label className={`${c.label} text-[rgba(244,244,245,0.75)]`}>Club Admin Aadhar Number *</label>
                <input
                    type="text"
                    className={c.input}
                    placeholder="12-digit Aadhar Number"
                    inputMode="numeric"
                    maxLength={12}
                    value={formData.aadharNumber}
                    onChange={(e) => handleAadhaarChange(e.target.value)}
                    disabled={loading}
                />
                {fieldErrors.aadharNumber ? <p style={fieldErrorStyle}>{fieldErrors.aadharNumber}</p> : null}
            </div>

            <div className="flex flex-col gap-2">
                <label className={`${c.label} text-[rgba(244,244,245,0.75)]`}>How did you hear about Mukijo? *</label>
                <select
                    className={c.select}
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

            <div className="flex flex-col gap-2">
                <label className={`${c.label} text-[rgba(244,244,245,0.75)]`}>Terms & Conditions *</label>
                <p className="text-xs leading-relaxed text-[rgba(244,244,245,0.5)]">
                    I hereby confirm that I have read and accept the Terms & Conditions, and that I have the right to
                    enter this agreement on behalf of my club or organisation.
                </p>
                <div className="flex gap-5 items-center pt-1">
                    {termsOptions.map((option) => (
                        <label
                            key={option}
                            className={`flex items-center gap-2 text-sm font-semibold text-[#f4f4f5] ${loading ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                            <input
                                type="radio"
                                name="termsAgreed"
                                value={option}
                                checked={formData.termsAgreed === option}
                                onChange={() => {
                                    onChange("termsAgreed", option);
                                    setFieldErrors((prev) => ({ ...prev, termsAgreed: "" }));
                                }}
                                disabled={loading}
                                className="accent-[#c6ff3d]"
                            />
                            {option}
                        </label>
                    ))}
                </div>
                {fieldErrors.termsAgreed ? <p style={fieldErrorStyle}>{fieldErrors.termsAgreed}</p> : null}
            </div>

            {formError ? <p style={fieldErrorStyle}>{formError}</p> : null}

            <div className="flex justify-between items-center mt-4 gap-3">
                <button type="button" className={c.secondaryBtn} onClick={onPrevious} disabled={loading}>
                    ← Previous
                </button>
                <button
                    type="button"
                    className={c.primaryBtn}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Registering..." : "Sign Up"}
                </button>
            </div>
        </div>
    );
}
