"use client";
import { API_BASE_URL } from "@/lib/api";
import { useState } from "react";
import Step1 from "@/components/register/Step1";
import Step2 from "@/components/register/Step2";
import SuccessScreen from "@/components/register/SuccessScreen";
import {
    AuthShell,
    AuthCard,
    AuthBrand,
    AuthErrorBanner,
    getAuthClasses,
} from "@/components/auth";
import Link from "next/link";

const c = getAuthClasses("light");

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
            const submissionBody = {
                ...formData,
                sport: Array.isArray(formData.sport) ? formData.sport.join(", ") : formData.sport,
            };

            const response = await fetch(`${API_BASE_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submissionBody),
            });

            if (response.ok) {
                try {
                    localStorage.setItem("userName", formData.firstName || "Admin");
                } catch {
                    /* ignore */
                }
                setSubmitted(true);
            } else {
                const errorData = await response.json().catch(() => ({}));
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
        } catch {
            setError("Cannot connect to server. Is the backend running?");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthShell variant="light">
            <AuthCard size="register" variant="light">
                {!submitted ? (
                    <Link href="/" className={c.backLink}>
                        ← Back to Home
                    </Link>
                ) : null}

                <AuthBrand
                    variant="light"
                    align="center"
                    title="Club Administrator Sign Up"
                    subtitle={submitted ? undefined : `Step ${currentStep} of 2`}
                />

                {error ? <AuthErrorBanner variant="light">{error}</AuthErrorBanner> : null}

                {submitted ? (
                    <SuccessScreen role="admin" />
                ) : currentStep === 1 ? (
                    <Step1 formData={formData} onChange={handleChange} onNext={handleNext} />
                ) : (
                    <Step2
                        formData={formData}
                        onChange={handleChange}
                        onPrevious={handlePrevious}
                        onSubmit={handleSubmit}
                        loading={loading}
                    />
                )}
            </AuthCard>
        </AuthShell>
    );
}
