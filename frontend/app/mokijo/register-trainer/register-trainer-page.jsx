"use client";
import { API_BASE_URL } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import PhoneInput from "@/components/ui/PhoneInput";
import {
    digitsOnly,
    applyNameInput,
    applyEmailInput,
    isValidPersonName,
    isValidEmail,
    isValidPhone,
    isValidAadhaar,
    composePhone,
    PERSON_NAME_MESSAGE,
    EMAIL_MESSAGE,
    AADHAAR_MESSAGE,
    phoneLengthMessage,
} from "@/lib/validation";

const SPORTS = ["Tennis", "Cricket", "Football (Soccer)", "Basketball", "Badminton", "Swimming"];
const fieldErrorStyle = { color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" };

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
        if (!String(formData.password || "").trim()) newErrors.password = "Password is required";
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
        <div className="min-h-screen bg-[#08080f] bg-[radial-gradient(ellipse_80%_60%_at_20%_10%,rgba(198,255,61,0.12)_0%,transparent_60%),radial-gradient(ellipse_60%_80%_at_80%_80%,rgba(217,255,110,0.1)_0%,transparent_60%)] flex items-center justify-center p-6 font-sans relative">
            <div className="bg-[#14141f]/90 backdrop-blur-[20px] border border-white/8 rounded-2xl w-full max-w-[560px] p-8 md:p-10 relative z-10 shadow-[0_24px_60px_rgba(0,0,0,0.7)] transition-all duration-250 hover:border-[#c6ff3d]/25 hover:shadow-[0_24px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(198,255,61,0.08)]">
                <div className="text-center mb-7">
                    <span className="block text-[28px] font-black italic uppercase tracking-wider bg-gradient-to-r from-[#c6ff3d] to-[#d9ff6e] bg-clip-text text-transparent drop-shadow-[0_0_16px_rgba(198,255,61,0.35)]">Mukijo</span>
                    <span className="block text-[11px] text-slate-500/45 mt-1 tracking-wider uppercase">Trainer Registration Portal</span>
                </div>

                {submitted ? (
                    <div className="flex flex-col items-center text-center p-6 bg-white/3 border border-white/8 rounded-2xl">
                        <div className="w-16 h-16 rounded-full bg-[#c6ff3d]/10 border border-[#c6ff3d]/20 text-[#c6ff3d] flex items-center justify-center text-xl font-bold mb-4 shadow-[0_0_15px_rgba(198,255,61,0.15)]">OK</div>
                        <h2 className="text-xl font-bold text-white mb-2">Registration Successful</h2>
                        <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
                            Your trainer account has been created. You can now sign in and start creating trainings.
                        </p>
                        <Link
                            href="/login-trainer"
                            className="w-full bg-[#c6ff3d] text-[#08080f] font-bold text-sm px-6 py-3.5 rounded-xl transition-all duration-200 hover:bg-[#b5eb29] hover:shadow-[0_0_15px_rgba(198,255,61,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
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
                                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors w-fit"
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

                        <h2 className="text-xl font-bold text-white tracking-tight text-center">Trainer Registration</h2>
                        <p className="text-sm text-slate-400 mt-1 text-center mb-6">
                            Create your independent trainer account. Fill in your details below.
                        </p>

                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div className="flex flex-col gap-2 mb-4">
                                <label className="text-xs font-bold uppercase tracking-wider text-white/40">
                                    First Name <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-200 focus:outline-none focus:border-[#c6ff3d] focus:bg-white/5"
                                    placeholder="Enter first name"
                                    value={formData.first_name}
                                    onChange={(e) => handleFieldChange("first_name", e.target.value)}
                                />
                                {errors.first_name && <span style={fieldErrorStyle}>{errors.first_name}</span>}
                            </div>

                            <div className="flex flex-col gap-2 mb-4">
                                <label className="text-xs font-bold uppercase tracking-wider text-white/40">
                                    Last Name <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-200 focus:outline-none focus:border-[#c6ff3d] focus:bg-white/5"
                                    placeholder="Enter last name"
                                    value={formData.last_name}
                                    onChange={(e) => handleFieldChange("last_name", e.target.value)}
                                />
                                {errors.last_name && <span style={fieldErrorStyle}>{errors.last_name}</span>}
                            </div>

                            <div className="flex flex-col gap-2 mb-4">
                                <label className="text-xs font-bold uppercase tracking-wider text-white/40">
                                    Email Address <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    type="email"
                                    className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-200 focus:outline-none focus:border-[#c6ff3d] focus:bg-white/5"
                                    placeholder="trainer@example.com"
                                    value={formData.email}
                                    onChange={(e) => handleFieldChange("email", e.target.value)}
                                />
                                {errors.email && <span style={fieldErrorStyle}>{errors.email}</span>}
                            </div>

                            <div className="flex flex-col gap-2 mb-4">
                                <label className="text-xs font-bold uppercase tracking-wider text-white/40">
                                    Create Password <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    type="password"
                                    className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-200 focus:outline-none focus:border-[#c6ff3d] focus:bg-white/5"
                                    placeholder="Choose a password for your account"
                                    value={formData.password}
                                    onChange={(e) => handleFieldChange("password", e.target.value)}
                                />
                                {errors.password && <span style={fieldErrorStyle}>{errors.password}</span>}
                            </div>

                            <div className="flex flex-col gap-2 mb-4">
                                <label className="text-xs font-bold uppercase tracking-wider text-white/40">
                                    Phone Number <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <PhoneInput
                                    id="trainer-register-phone"
                                    className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-200 focus:outline-none focus:border-[#c6ff3d] focus:bg-white/5"
                                    selectClassName="w-full bg-[#0e0e19] border border-white/8 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c6ff3d]"
                                    countryCode={phoneCode}
                                    digits={phoneDigits}
                                    onCountryCodeChange={(code) => syncPhone(code, phoneDigits)}
                                    onDigitsChange={(digits) => syncPhone(phoneCode, digits)}
                                />
                                {errors.phone && <span style={fieldErrorStyle}>{errors.phone}</span>}
                            </div>

                            <div className="flex flex-col gap-2 mb-4">
                                <label className="text-xs font-bold uppercase tracking-wider text-white/40">
                                    Specialization / Sport <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-200 focus:outline-none focus:border-[#c6ff3d] focus:bg-white/5"
                                    placeholder="e.g., Football, Cricket"
                                    value={formData.specialization}
                                    onChange={(e) => handleFieldChange("specialization", e.target.value)}
                                />
                                {errors.specialization && (
                                    <span style={fieldErrorStyle}>{errors.specialization}</span>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 mb-4">
                                <label className="text-xs font-bold uppercase tracking-wider text-white/40">Coaching Experience (Years)</label>
                                <input
                                    type="number"
                                    className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-200 focus:outline-none focus:border-[#c6ff3d] focus:bg-white/5"
                                    placeholder="e.g., 5"
                                    value={formData.experience}
                                    onChange={(e) => handleFieldChange("experience", e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col gap-2 mb-4">
                                <label className="text-xs font-bold uppercase tracking-wider text-white/40">Aadhar Number</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-200 focus:outline-none focus:border-[#c6ff3d] focus:bg-white/5"
                                    placeholder="12-digit Aadhar"
                                    maxLength={12}
                                    value={formData.aadhar}
                                    onChange={(e) => handleFieldChange("aadhar", e.target.value)}
                                />
                                {errors.aadhar && <span style={fieldErrorStyle}>{errors.aadhar}</span>}
                            </div>

                            <div className="flex flex-col gap-2 mb-4">
                                <label className="text-xs font-bold uppercase tracking-wider text-white/40">
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
                                {errors.sports && <span style={fieldErrorStyle}>{errors.sports}</span>}
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-[#c6ff3d] text-[#08080f] font-bold text-sm px-6 py-3.5 rounded-xl transition-all duration-200 hover:bg-[#b5eb29] hover:shadow-[0_0_15px_rgba(198,255,61,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
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
