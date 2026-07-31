"use client";
import { API_BASE_URL } from "@/lib/api";

import { useState } from "react";
import Link from "next/link";
import Step1 from "@/components/register/Step1";
import Step2 from "@/components/register/Step2";
import SuccessScreen from "@/components/register/SuccessScreen";

export default function SignupPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        clubName: "",
        country: "",
        state: "",
        memberCount: "",
        sport: [],
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        aadharNumber: "",
        hearAbout: "",
        termsAgreed: false,
    });

    function handleChange(fieldName, value) {
        setFormData((prev) => ({
            ...prev,
            [fieldName]: value,
        }));
    }

    function handleNext() {
        setCurrentStep(2);
    }

    function handlePrevious() {
        setCurrentStep(1);
    }

    async function handleSubmit() {
        setLoading(true);
        setError(null);
        try {
            const apiUrl = `${API_BASE_URL}/register`;
            console.log("Attempting registration at:", apiUrl);

            const submissionBody = {
                ...formData,
                sport: Array.isArray(formData.sport) ? formData.sport.join(", ") : formData.sport,
            };

            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(submissionBody),
            });

            if (response.ok) {
                try {
                    const data = await response.json();
                    console.log("Registration successful:", data);
                    localStorage.setItem("userName", formData.firstName || "Admin");
                } catch (e) {
                    console.warn("Error parsing response or saving to localStorage", e);
                }
                setSubmitted(true);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error("Registration failed:", errorData);

                let errorMessage = "Registration failed. Please check your data.";
                if (errorData.detail) {
                    if (typeof errorData.detail === "string") {
                        errorMessage = errorData.detail;
                    } else if (Array.isArray(errorData.detail)) {
                        errorMessage = errorData.detail.map((err) => err.msg || JSON.stringify(err)).join(", ");
                    }
                }
                setError(errorMessage);
            }
        } catch (error) {
            console.error("Connection Error:", error);
            setError("Cannot connect to server. Is the backend running?");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#08080f] flex items-center justify-center p-6 font-sans relative">
            {/* ── Animated Blur Glow Orbs (Volt + Magenta) ── */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_10%,rgba(198,255,61,0.12)_0%,transparent_60%),radial-gradient(ellipse_60%_80%_at_80%_80%,rgba(217,255,110,0.1)_0%,transparent_60%)] pointer-events-none z-0" aria-hidden="true" />

            <div className="bg-[#14141f]/90 backdrop-blur-[20px] border border-white/8 rounded-2xl w-full max-w-[560px] p-8 md:p-10 relative z-10 shadow-[0_24px_60px_rgba(0,0,0,0.7)] transition-all duration-250 hover:border-[#c6ff3d]/25 hover:shadow-[0_24px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(198,255,61,0.08)]">
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

                <div className="text-center mb-7">
                    <span className="block text-[28px] font-black italic uppercase tracking-wider bg-gradient-to-r from-[#c6ff3d] to-[#d9ff6e] bg-clip-text text-transparent drop-shadow-[0_0_16px_rgba(198,255,61,0.35)]">Mukijo</span>
                    <span className="block text-[11px] text-slate-500/45 mt-1 tracking-wider uppercase">Club Administrator Sign Up</span>
                </div>

                {submitted ? (
                    <SuccessScreen role="admin" />
                ) : currentStep === 1 ? (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <Link
                            href="/"
                            className="text-xs font-semibold text-slate-400 hover:text-white mb-4 transition-colors w-fit"
                        >
                            ← Back to Home
                        </Link>
                        <Step1 formData={formData} onChange={handleChange} onNext={handleNext} />
                    </div>
                ) : (
                    <Step2
                        formData={formData}
                        onChange={handleChange}
                        onPrevious={handlePrevious}
                        onSubmit={handleSubmit}
                        loading={loading}
                    />
                )}
            </div>
        </div>
    );
}
