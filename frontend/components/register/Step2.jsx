"use client";
import { useState } from "react";
import PasswordField from "@/components/ui/PasswordField";
import PhoneInput from "@/components/ui/PhoneInput";
import { getAuthClasses } from "@/components/auth";
import { hearAboutOptions, termsOptions } from "./constants";
import {
    applyNameInput,
    applyEmailInput,
    isValidPhone,
    isValidAadhaar,
    isStrongPassword,
    composePhone,
    NAME_MESSAGE,
    EMAIL_MESSAGE,
    AADHAAR_MESSAGE,
    STRONG_PASSWORD_MESSAGE,
    phoneLengthMessage,
} from "@/lib/validation";

const c = getAuthClasses("light");
const fieldErrorStyle = { color: "#ef4444", fontSize: "12px", marginTop: "6px", marginBottom: 0 };

export default function Step2({ formData, onChange, onPrevious, onSubmit, loading }) {
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [phoneCode, setPhoneCode] = useState("+91");
    const [phoneDigits, setPhoneDigits] = useState("");

    function syncPhone(code, digits) {
        setPhoneCode(code);
        setPhoneDigits(digits);
        const full = composePhone(code, digits);
        onChange("phone", full);

        if (digits && !isValidPhone(digits, code)) {
            setFieldErrors((prev) => ({ ...prev, phone: phoneLengthMessage(code) }));
        } else {
            setFieldErrors((prev) => ({ ...prev, phone: "" }));
        }
        setFormError("");
    }

    function handleNameChange(field, raw) {
        const { sanitized, error } = applyNameInput(raw);
        onChange(field, sanitized);
        setFieldErrors((prev) => ({ ...prev, [field]: error }));
        setFormError("");
    }

    function handleAadhaarChange(raw) {
        const digits = raw.replace(/\D/g, "").slice(0, 12);
        onChange("aadharNumber", digits);
        if (digits && !isValidAadhaar(digits)) {
            setFieldErrors((prev) => ({ ...prev, aadharNumber: AADHAAR_MESSAGE }));
        } else {
            setFieldErrors((prev) => ({ ...prev, aadharNumber: "" }));
        }
        setFormError("");
    }

    function handleSubmit() {
        const nextErrors = {};

        if (!formData.firstName?.trim()) {
            nextErrors.firstName = "First name is required.";
        } else if (!/^[A-Za-z\s]+$/.test(formData.firstName)) {
            nextErrors.firstName = NAME_MESSAGE;
        }

        if (!formData.lastName?.trim()) {
            nextErrors.lastName = "Last name is required.";
        } else if (!/^[A-Za-z\s]+$/.test(formData.lastName)) {
            nextErrors.lastName = NAME_MESSAGE;
        }

        if (!formData.email?.trim()) {
            nextErrors.email = "Email is required.";
        } else if (!applyEmailInput(formData.email).error && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            nextErrors.email = EMAIL_MESSAGE;
        }

        if (!formData.password) {
            nextErrors.password = "Password is required.";
        } else if (!isStrongPassword(formData.password)) {
            nextErrors.password = STRONG_PASSWORD_MESSAGE;
        }

        if (!formData.phone) {
            nextErrors.phone = "Phone number is required.";
        }

        if (!formData.aadharNumber) {
            nextErrors.aadharNumber = "Aadhar number is required.";
        } else if (!isValidAadhaar(formData.aadharNumber)) {
            nextErrors.aadharNumber = AADHAAR_MESSAGE;
        }

        if (!formData.termsAgreed) {
            nextErrors.termsAgreed = "You must accept terms & conditions.";
        }

        if (Object.keys(nextErrors).length) {
            setFieldErrors(nextErrors);
            setFormError("Please fix the highlighted errors before submitting.");
            return;
        }

        setFormError("");
        onSubmit();
    }

    return (
        <div className="flex flex-col gap-6 w-full items-center">
            <div className="flex items-center justify-center gap-4 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 border border-gray-300 text-gray-500">1</div>
                <div className="flex-1 h-px bg-gray-200 max-w-[60px]"></div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-black text-white">2</div>
            </div>

            <div className="text-center mb-4">
                <h2 className="text-2xl font-black text-black tracking-tight">Admin Details</h2>
                <p className="text-sm font-medium text-gray-600 mt-1">Tell us about the club administrator</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-[380px] mx-auto text-left">
                <div className="flex flex-col gap-2 text-left">
                    <label className={c.label}>First Name *</label>
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
                <div className="flex flex-col gap-2 text-left">
                    <label className={c.label}>Last Name *</label>
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

            <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                <label className={c.label}>Club Admin Email *</label>
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

            <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                <label className={c.label}>Password *</label>
                <PasswordField
                    tone="light"
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

            <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                <label className={c.label}>Club Admin Phone Number *</label>
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

            <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                <label className={c.label}>Club Admin Aadhar Number *</label>
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

            <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                <label className={c.label}>How did you hear about Mukijo? *</label>
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

            <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                <label className={c.label}>Terms &amp; Conditions *</label>
                <p className="text-xs leading-relaxed text-gray-600">
                    I hereby confirm that I have read and accept the Terms &amp; Conditions, and that I have the right to
                    enter this agreement on behalf of my club or organisation.
                </p>
                <div className="flex gap-5 items-center justify-start pt-1">
                    {termsOptions.map((option) => (
                        <label
                            key={option}
                            className={`flex items-center gap-2 text-sm font-bold text-black ${loading ? "cursor-not-allowed" : "cursor-pointer"}`}
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
                                className="accent-black"
                            />
                            {option}
                        </label>
                    ))}
                </div>
                {fieldErrors.termsAgreed ? <p style={fieldErrorStyle}>{fieldErrors.termsAgreed}</p> : null}
            </div>

            {formError ? <p style={fieldErrorStyle}>{formError}</p> : null}

            <div className="flex justify-between items-center mt-6 gap-3 w-full max-w-[380px] mx-auto">
                <button
                    type="button"
                    className="h-10 px-5 bg-white border-2 border-gray-300 text-black font-bold text-sm rounded-xl transition-all duration-200 hover:border-black hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                    onClick={onPrevious}
                    disabled={loading}
                >
                    ← Previous
                </button>
                <button
                    type="button"
                    className="h-10 px-6 bg-black text-white font-bold text-sm rounded-xl transition-all duration-200 hover:bg-gray-800 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Registering..." : "Sign Up ✓"}
                </button>
            </div>
        </div>
    );
}
