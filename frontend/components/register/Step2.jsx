"use client";
import { useState } from "react";
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
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-[#c6ff3d]/20 border border-[#c6ff3d]/30 text-white/50">1</div>
                <div className="flex-1 h-[1px] bg-white/8 max-w-[60px]"></div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-[#c6ff3d] text-[#08080f] shadow-[0_0_12px_rgba(198,255,61,0.4)]">2</div>
            </div>

            <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-white tracking-tight">Admin Details</h2>
                <p className="text-sm text-slate-400 mt-1">Tell us about the club administrator</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-white/40">First Name *</label>
                    <input
                        type="text"
                        className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-200 focus:outline-none focus:border-[#c6ff3d] focus:bg-white/5"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={(e) => handleNameChange("firstName", e.target.value)}
                        disabled={loading}
                    />
                    {fieldErrors.firstName ? <p style={fieldErrorStyle}>{fieldErrors.firstName}</p> : null}
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-white/40">Last Name *</label>
                    <input
                        type="text"
                        className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-200 focus:outline-none focus:border-[#c6ff3d] focus:bg-white/5"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={(e) => handleNameChange("lastName", e.target.value)}
                        disabled={loading}
                    />
                    {fieldErrors.lastName ? <p style={fieldErrorStyle}>{fieldErrors.lastName}</p> : null}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-white/40">Club Admin Email *</label>
                <input
                    type="email"
                    className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-200 focus:outline-none focus:border-[#c6ff3d] focus:bg-white/5"
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
                <label className="text-xs font-bold uppercase tracking-wider text-white/40">Password *</label>
                <PasswordField
                    className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-200 focus:outline-none focus:border-[#c6ff3d] focus:bg-white/5"
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
                <label className="text-xs font-bold uppercase tracking-wider text-white/40">Club Admin Phone Number *</label>
                <PhoneInput
                    id="club-admin-phone"
                    className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-200 focus:outline-none focus:border-[#c6ff3d] focus:bg-white/5"
                    selectClassName="bg-[#0e0e19] text-white border border-white/8 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#c6ff3d]"
                    countryCode={phoneCode}
                    digits={phoneDigits}
                    onCountryCodeChange={(code) => syncPhone(code, phoneDigits)}
                    onDigitsChange={(digits) => syncPhone(phoneCode, digits)}
                    disabled={loading}
                />
                {fieldErrors.phone ? <p style={fieldErrorStyle}>{fieldErrors.phone}</p> : null}
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-white/40">Club Admin Aadhar Number *</label>
                <input
                    type="text"
                    className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-200 focus:outline-none focus:border-[#c6ff3d] focus:bg-white/5"
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
                <label className="text-xs font-bold uppercase tracking-wider text-white/40">How did you hear about Mukijo? *</label>
                <select
                    className="w-full bg-[#0e0e19] border border-white/8 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c6ff3d]"
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
                <label className="text-xs font-bold uppercase tracking-wider text-white/40">Terms & Conditions *</label>
                <p className="text-xs leading-relaxed text-slate-400">
                    I hereby confirm that I have read and accept the Terms & Conditions, and that I have the right to
                    enter this agreement on behalf of my club or organisation.
                </p>
                <div style={{ display: "flex", gap: "20px", alignItems: "center", paddingTop: "4px" }}>
                    {termsOptions.map((option) => (
                        <label
                            key={option}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                color: "#ffffff",
                                fontSize: "14px",
                                fontWeight: 600,
                                cursor: loading ? "not-allowed" : "pointer",
                            }}
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
                            />
                            {option}
                        </label>
                    ))}
                </div>
                {fieldErrors.termsAgreed ? <p style={fieldErrorStyle}>{fieldErrors.termsAgreed}</p> : null}
            </div>

            {formError ? <p style={fieldErrorStyle}>{formError}</p> : null}

            <div className="flex justify-between items-center mt-4">
                <button type="button" className="bg-transparent border border-white/10 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all duration-200 hover:bg-white/5 hover:border-white/15" onClick={onPrevious} disabled={loading}>
                    ← Previous
                </button>
                <button
                    type="button"
                    className="bg-[#c6ff3d] text-[#08080f] font-bold text-sm px-6 py-3.5 rounded-xl transition-all duration-200 hover:bg-[#b5eb29] hover:shadow-[0_0_15px_rgba(198,255,61,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Registering..." : "Sign Up"}
                </button>
            </div>
        </div>
    );
}
