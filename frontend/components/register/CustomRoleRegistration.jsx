"use client";
import { API_BASE_URL } from "@/lib/api";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import styles from "../../app/styles/signup.module.css";
import PasswordField from "@/components/ui/PasswordField";
import PhoneInput from "@/components/ui/PhoneInput";
import {
    personNameError,
    emailError,
    passwordError,
    phoneError,
    aadhaarError,
    digitsOnly,
    formatAadhaarDisplay,
    formatPhoneForStorage,
} from "@/lib/validation";

function fieldKey(name = "") {
    return String(name).toLowerCase();
}

function isNameField(name) {
    const n = fieldKey(name);
    return n === "first_name" || n === "lastname" || n === "last_name" || n === "firstname" || n === "child_name";
}

function isPhoneField(name) {
    const n = fieldKey(name);
    return n === "phone" || n === "emergency_contact" || n.includes("phone");
}

function isAadhaarField(name) {
    const n = fieldKey(name);
    return n === "aadhar" || n === "aadhaar" || n === "aadharnumber";
}

export default function CustomRoleRegistration({ role, selectedClub, onBack, onComplete, backLabel = "<- Back" }) {
    const router = useRouter();
    const redirectedRef = useRef(false);
    const [formConfig, setFormConfig] = useState(null);
    const [formData, setFormData] = useState({});
    const [phoneMeta, setPhoneMeta] = useState({});
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState("");

    useEffect(() => {
        if (!selectedClub) {
            setFormConfig(null);
            return;
        }

        const fetchFormConfig = async () => {
            setLoading(true);
            setFormConfig(null);
            try {
                const res = await fetch(
                    `${API_BASE_URL}/signup-forms/${role.toLowerCase()}?owner_id=${selectedClub.id}`
                );
                if (res.ok) {
                    const data = await res.json();
                    let parsedFields = [];
                    try {
                        parsedFields = typeof data.fields === "string" ? JSON.parse(data.fields) : data.fields;
                    } catch {
                        parsedFields = [];
                    }
                    setFormConfig({ ...data, fields: parsedFields });

                    const initialData = {};
                    const initialPhone = {};
                    parsedFields.forEach((f) => {
                        initialData[f.name] = "";
                        if (isPhoneField(f.name)) {
                            initialPhone[f.name] = { countryCode: "+91", digits: "" };
                        }
                    });
                    setFormData(initialData);
                    setPhoneMeta(initialPhone);
                }
            } catch (err) {
                console.error("Error fetching custom form:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFormConfig();
    }, [selectedClub, role]);

    function handleFieldChange(name, value) {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: null,
            }));
        }
    }

    function validateAll() {
        const newErrors = {};
        if (formConfig && formConfig.fields) {
            formConfig.fields.forEach((field) => {
                const name = field.name;
                const value = formData[name];
                const key = fieldKey(name);

                if (field.required && !String(value || "").trim() && !isPhoneField(name) && !isAadhaarField(name)) {
                    newErrors[name] = `${field.label} is required`;
                }

                if (isNameField(name) && String(value || "").trim()) {
                    const err = personNameError(value, field.label || "Name");
                    if (err) newErrors[name] = err;
                }

                if (key === "email") {
                    const err = emailError(value);
                    if (err) newErrors[name] = err;
                }

                if (isPhoneField(name)) {
                    const meta = phoneMeta[name] || { countryCode: "+91", digits: "" };
                    const err = phoneError(meta.digits, meta.countryCode);
                    if (err) newErrors[name] = err;
                }

                if (isAadhaarField(name)) {
                    const roleNeedsAadhaar =
                        /coach|referee|refree/i.test(role) || field.required;
                    if (roleNeedsAadhaar || String(value || "").trim()) {
                        const err = aadhaarError(value);
                        if (err) newErrors[name] = err;
                    }
                }
            });
        }

        const hasEmail = formConfig?.fields?.some((f) => fieldKey(f.name) === "email");
        if (hasEmail) {
            const pwErr = passwordError(formData["password"]);
            if (pwErr) newErrors["password"] = pwErr;
        }

        if (!(formData["sports"] && formData["sports"].length > 0)) {
            newErrors["sports"] = "Selecting at least one sport is required";
        }

        return newErrors;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitError("");

        const newErrors = validateAll();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            const submittedData = {
                ...formData,
                sports: formData["sports"] || [],
                sport: formData["sports"] ? formData["sports"].join(", ") : "",
                email: String(formData.email || "")
                    .trim()
                    .toLowerCase(),
                password: String(formData.password || "").trim(),
            };

            Object.keys(phoneMeta).forEach((name) => {
                const meta = phoneMeta[name];
                if (meta) {
                    submittedData[name] = formatPhoneForStorage(meta.countryCode, meta.digits);
                }
            });

            Object.keys(submittedData).forEach((name) => {
                if (isAadhaarField(name)) {
                    submittedData[name] = digitsOnly(submittedData[name]);
                }
            });

            const response = await fetch(`${API_BASE_URL}/signup-submissions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    owner_id: selectedClub.id,
                    role: role,
                    submitted_data: JSON.stringify(submittedData),
                }),
            });

            if (response.ok) {
                if (redirectedRef.current) return;
                redirectedRef.current = true;

                toast.success(
                    "Application submitted! Club admin must approve your application before you can log in.",
                    { duration: 4000 }
                );
                onComplete();
                setTimeout(() => {
                    router.push("/");
                }, 1500);
            } else {
                const errorData = await response.json().catch(() => ({}));
                let detail = errorData.detail || "Failed to submit application. Please check details.";
                if (Array.isArray(detail)) {
                    detail = detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
                }
                setSubmitError(detail);
            }
        } catch (err) {
            console.error("Error submitting form application:", err);
            setSubmitError("Server connection error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    if (loading && !formConfig) {
        return (
            <div style={{ textAlign: "center", padding: "40px" }}>
                <div
                    style={{
                        width: "30px",
                        height: "30px",
                        border: "3px solid #cbd5e1",
                        borderTopColor: "#2563eb",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        margin: "0 auto 12px",
                    }}
                ></div>
                <p style={{ color: "#64748b", fontSize: "14px" }}>Fetching customized form configuration...</p>
                <style jsx>{`
                    @keyframes spin {
                        to {
                            transform: rotate(360deg);
                        }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className={styles.stepContainer}>
            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "16px" }}>
                <button type="button" className={styles.prevButton} onClick={onBack}>
                    {backLabel}
                </button>
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

            <h2 className={styles.stepTitle}>{formConfig?.title || `${role} Signup`}</h2>
            <p className={styles.stepSubtitle}>
                {selectedClub?.club_name ? `Joining ${selectedClub.club_name}. ` : ""}
                {formConfig?.description || "Apply to join our organisation by filling in your details below."}
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {formConfig?.fields
                    ?.filter((field) => !fieldKey(field.name).includes("password"))
                    .map((field) => {
                        const isEmailField = fieldKey(field.name) === "email";
                        const phone = isPhoneField(field.name);
                        const aadhaar = isAadhaarField(field.name);

                        return (
                            <div key={field.name} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>
                                        {field.label} {field.required && <span style={{ color: "#ef4444" }}>*</span>}
                                    </label>
                                    {field.type === "select" ? (
                                        <select
                                            className={styles.select}
                                            value={formData[field.name] || ""}
                                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                        >
                                            <option value="">{field.placeholder || "Select option..."}</option>
                                            {(
                                                field.options || [
                                                    "Father",
                                                    "Mother",
                                                    "Guardian",
                                                    "Male",
                                                    "Female",
                                                    "Other",
                                                ]
                                            ).map((opt) => (
                                                <option key={opt} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>
                                    ) : phone ? (
                                        <PhoneInput
                                            countryCode={phoneMeta[field.name]?.countryCode || "+91"}
                                            digits={phoneMeta[field.name]?.digits || ""}
                                            selectClassName={styles.select}
                                            inputClassName={styles.input}
                                            placeholder={field.placeholder || "10-digit number"}
                                            onChange={({ countryCode, digits, full }) => {
                                                setPhoneMeta((prev) => ({
                                                    ...prev,
                                                    [field.name]: { countryCode, digits },
                                                }));
                                                handleFieldChange(field.name, full);
                                            }}
                                        />
                                    ) : aadhaar ? (
                                        <input
                                            type="text"
                                            className={styles.input}
                                            placeholder="XXXX XXXX XXXX"
                                            maxLength={14}
                                            value={formatAadhaarDisplay(formData[field.name])}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    field.name,
                                                    digitsOnly(e.target.value).slice(0, 12)
                                                )
                                            }
                                        />
                                    ) : (
                                        <input
                                            type={field.type}
                                            className={styles.input}
                                            placeholder={field.placeholder || ""}
                                            value={formData[field.name] || ""}
                                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                        />
                                    )}
                                    {errors[field.name] && (
                                        <span
                                            style={{
                                                color: "#ef4444",
                                                fontSize: "12px",
                                                marginTop: "4px",
                                                display: "block",
                                            }}
                                        >
                                            {errors[field.name]}
                                        </span>
                                    )}
                                </div>
                                {isEmailField && (
                                    <div className={styles.fieldGroup}>
                                        <label className={styles.label}>
                                            Create Password <span style={{ color: "#ef4444" }}>*</span>
                                        </label>
                                        <PasswordField
                                            className={styles.input}
                                            placeholder="Choose a strong password"
                                            value={formData["password"] || ""}
                                            onChange={(e) => handleFieldChange("password", e.target.value)}
                                            required
                                        />
                                        <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "6px" }}>
                                            Min 8 chars with uppercase, lowercase, number, and special character.
                                        </p>
                                        {errors["password"] && (
                                            <span
                                                style={{
                                                    color: "#ef4444",
                                                    fontSize: "12px",
                                                    marginTop: "4px",
                                                    display: "block",
                                                }}
                                            >
                                                {errors["password"]}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                <div className={styles.fieldGroup}>
                    <label className={styles.label}>
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
                        {["Tennis", "Cricket", "Football (Soccer)", "Basketball", "Badminton", "Swimming"].map(
                            (sport) => {
                                const selectedSports = formData["sports"] || [];
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
                                            color: "#f1f5f9",
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
                                                accentColor: "#bffe00",
                                            }}
                                        />
                                        <span>{sport}</span>
                                    </label>
                                );
                            }
                        )}
                    </div>
                    {errors["sports"] && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                            {errors["sports"]}
                        </span>
                    )}
                </div>

                <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={loading}
                    style={{
                        width: "100%",
                        marginTop: "10px",
                        opacity: loading ? 0.7 : 1,
                        cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? "Submitting Application..." : "Submit Application"}
                </button>
            </form>
        </div>
    );
}
