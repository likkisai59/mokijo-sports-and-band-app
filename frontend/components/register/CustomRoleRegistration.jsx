"use client";
import { API_BASE_URL } from "@/lib/api";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import styles from "../../app/styles/signup.module.css";
import PasswordField from "@/components/ui/PasswordField";
import PhoneInput from "@/components/ui/PhoneInput";
import {
    isValidEmail,
    isValidPersonName,
    isStrongPassword,
    isValidPhone,
    isValidAadhaar,
    digitsOnly,
    composePhone,
    phoneLengthMessage,
    isValidDob,
    isoToDob,
    dobToIso,
    applyNameInput,
    applyEmailInput,
    PHONE_LENGTH_BY_CODE,
    EMAIL_MESSAGE,
    PERSON_NAME_MESSAGE,
    STRONG_PASSWORD_MESSAGE,
    AADHAAR_MESSAGE,
    DOB_MESSAGE,
} from "@/lib/validation";

const AADHAAR_REQUIRED_ROLES = ["coach", "referee", "trainer"];

function isPersonNameField(field) {
    return field.type === "text" && /name$/i.test(field.name) && field.name.toLowerCase() !== "username";
}

function isAadhaarField(field) {
    const n = field.name.toLowerCase();
    return n.includes("aadhar") || n.includes("aadhaar");
}

function isPhoneField(field) {
    return field.type === "tel";
}

function isDobField(field) {
    const n = String(field.name || "").toLowerCase();
    return n === "dob" || n.includes("birth") || field.type === "date";
}

function isYesNoSelect(field) {
    if (field.type !== "select" || !Array.isArray(field.options) || field.options.length !== 2) return false;
    const normalized = field.options.map((o) => String(o).trim().toLowerCase()).sort();
    return normalized[0] === "no" && normalized[1] === "yes";
}

export default function CustomRoleRegistration({ role, selectedClub, onBack, onComplete, backLabel = "<- Back" }) {
    const router = useRouter();
    const redirectedRef = useRef(false);
    const [formConfig, setFormConfig] = useState(null);
    const [formData, setFormData] = useState({});
    const [phoneMeta, setPhoneMeta] = useState({});
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState("");

    // Fetch form configuration once club is selected
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

                    // Initialise formData state with empty values
                    const initialData = {};
                    const initialPhoneMeta = {};
                    parsedFields.forEach((f) => {
                        initialData[f.name] = "";
                        if (isPhoneField(f)) {
                            initialPhoneMeta[f.name] = { countryCode: "+91", digits: "" };
                        }
                    });
                    setFormData(initialData);
                    setPhoneMeta(initialPhoneMeta);
                    setConfirmPassword("");
                    setErrors({});
                }
            } catch (err) {
                console.error("Error fetching custom form:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFormConfig();
    }, [selectedClub, role]);

    function handleFieldChange(name, value, fieldMeta = null) {
        let nextValue = value;
        let fieldError = null;

        if (fieldMeta && isPersonNameField(fieldMeta)) {
            const result = applyNameInput(value);
            nextValue = result.sanitized;
            fieldError = result.error || null;
        } else if (fieldMeta && fieldMeta.name?.toLowerCase() === "email") {
            const result = applyEmailInput(value);
            nextValue = result.value;
            fieldError = result.error || null;
        } else if (fieldMeta && isAadhaarField(fieldMeta)) {
            nextValue = digitsOnly(value).slice(0, 12);
            fieldError = nextValue && nextValue.length !== 12 ? AADHAAR_MESSAGE : null;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: nextValue,
        }));
        setErrors((prev) => ({
            ...prev,
            [name]: fieldError,
        }));
    }

    function handlePhoneMetaChange(name, partial) {
        setPhoneMeta((prev) => {
            const merged = { ...(prev[name] || { countryCode: "+91", digits: "" }), ...partial };
            const code = merged.countryCode || "+91";
            const range = PHONE_LENGTH_BY_CODE[code] || [8, 15];
            const digits = digitsOnly(merged.digits || "").slice(0, range[1]);
            return {
                ...prev,
                [name]: { ...merged, digits },
            };
        });
        const countryCode = partial.countryCode;
        const current = phoneMeta[name] || { countryCode: "+91", digits: "" };
        const code = countryCode || current.countryCode;
        const range = PHONE_LENGTH_BY_CODE[code] || [8, 15];
        const digits =
            partial.digits !== undefined ? digitsOnly(partial.digits).slice(0, range[1]) : undefined;
        setErrors((prev) => {
            const d = digits !== undefined ? digits : current.digits;
            return {
                ...prev,
                [name]: d && !isValidPhone(d, code) ? phoneLengthMessage(code) : null,
            };
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitError("");

        const fields = formConfig?.fields || [];
        const roleLower = String(role || "").toLowerCase();
        const newErrors = {};

        fields.forEach((field) => {
            if (isPhoneField(field)) {
                const meta = phoneMeta[field.name] || { countryCode: "+91", digits: "" };
                if (field.required && !meta.digits) {
                    newErrors[field.name] = `${field.label} is required`;
                } else if (meta.digits && !isValidPhone(meta.digits, meta.countryCode)) {
                    newErrors[field.name] = phoneLengthMessage(meta.countryCode);
                }
                return;
            }

            if (isAadhaarField(field)) {
                const digits = digitsOnly(formData[field.name]);
                const isRequired = field.required || AADHAAR_REQUIRED_ROLES.includes(roleLower);
                if (isRequired && !digits) {
                    newErrors[field.name] = `${field.label} is required`;
                } else if (digits && !isValidAadhaar(digits)) {
                    newErrors[field.name] = AADHAAR_MESSAGE;
                }
                return;
            }

            if (isDobField(field)) {
                const rawValue = formData[field.name];
                if (field.required && !String(rawValue || "").trim()) {
                    newErrors[field.name] = `${field.label} is required`;
                } else if (rawValue && !isValidDob(rawValue)) {
                    newErrors[field.name] = DOB_MESSAGE;
                }
                return;
            }

            const rawValue = formData[field.name];
            if (field.required && !String(rawValue || "").trim()) {
                newErrors[field.name] = `${field.label} is required`;
                return;
            }

            if (field.name.toLowerCase() === "email" && rawValue && !isValidEmail(rawValue)) {
                newErrors[field.name] = EMAIL_MESSAGE;
                return;
            }

            if (isPersonNameField(field) && rawValue && !isValidPersonName(rawValue)) {
                newErrors[field.name] = PERSON_NAME_MESSAGE;
            }
        });

        // Validate password + confirm password if email field exists
        const hasEmail = fields.some((f) => f.name.toLowerCase() === "email");
        if (hasEmail) {
            const password = String(formData["password"] || "");
            if (!password.trim()) {
                newErrors["password"] = "Password is required";
            } else if (!isStrongPassword(password)) {
                newErrors["password"] = STRONG_PASSWORD_MESSAGE;
            }

            if (!confirmPassword.trim()) {
                newErrors["confirmPassword"] = "Please confirm your password";
            } else if (confirmPassword !== password) {
                newErrors["confirmPassword"] = "Passwords do not match";
            }
        }

        // Validate interested sports
        if (!(formData["sports"] && formData["sports"].length > 0)) {
            newErrors["sports"] = "Selecting at least one sport is required";
        }

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

            fields.forEach((field) => {
                if (isPhoneField(field)) {
                    const meta = phoneMeta[field.name] || { countryCode: "+91", digits: "" };
                    submittedData[field.name] = meta.digits ? composePhone(meta.countryCode, meta.digits) : "";
                } else if (isAadhaarField(field)) {
                    submittedData[field.name] = digitsOnly(formData[field.name]);
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
                // Prevent duplicate redirect triggers
                if (redirectedRef.current) return;
                redirectedRef.current = true;

                toast.success(
                    "Registration successful! We've sent a verification email to your inbox - please verify it. The club admin must still approve your application before you can log in.",
                    { duration: 5000 }
                );
                onComplete();
                // Redirect to Landing Page after the toast is visible
                setTimeout(() => {
                    router.push("/");
                }, 1500);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setSubmitError(errorData.detail || "Failed to submit application. Please check details.");
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
                        borderTopColor: "#c6ff3d",
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
                {/* Customized Club Onboarding Fields */}
                {formConfig?.fields?.
                    filter((field) => !field.name.toLowerCase().includes("password"))
                    .map((field) => {
                        const isEmailField = field.name.toLowerCase() === "email";
                        return (
                            <div key={field.name} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>
                                        {field.label} {field.required && <span style={{ color: "#ef4444" }}>*</span>}
                                    </label>
                                    {isYesNoSelect(field) ? (
                                        <div style={{ display: "flex", gap: "20px", alignItems: "center", paddingTop: "4px" }}>
                                            {(field.options || ["Yes", "No"]).map((opt) => (
                                                <label
                                                    key={opt}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        color: "#ffffff",
                                                        fontSize: "14px",
                                                        fontWeight: 600,
                                                        cursor: "pointer",
                                                        textTransform: "none",
                                                        letterSpacing: "normal",
                                                    }}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={field.name}
                                                        value={opt}
                                                        checked={formData[field.name] === opt}
                                                        onChange={() => handleFieldChange(field.name, opt)}
                                                    />
                                                    {opt}
                                                </label>
                                            ))}
                                        </div>
                                    ) : field.type === "select" ? (
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
                                    ) : isPhoneField(field) ? (
                                        <PhoneInput
                                            id={field.name}
                                            countryCode={phoneMeta[field.name]?.countryCode || "+91"}
                                            digits={phoneMeta[field.name]?.digits || ""}
                                            onCountryCodeChange={(code) =>
                                                handlePhoneMetaChange(field.name, { countryCode: code })
                                            }
                                            onDigitsChange={(digits) =>
                                                handlePhoneMetaChange(field.name, { digits })
                                            }
                                            className={styles.input}
                                            selectClassName={styles.select}
                                            placeholder={field.placeholder || "00000 00000"}
                                        />
                                    ) : isAadhaarField(field) ? (
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            className={styles.input}
                                            placeholder={field.placeholder || "12-digit Aadhaar number"}
                                            maxLength={12}
                                            value={formData[field.name] || ""}
                                            onChange={(e) =>
                                                handleFieldChange(field.name, e.target.value, field)
                                            }
                                        />
                                    ) : isDobField(field) ? (
                                        <input
                                            type="date"
                                            className={styles.input}
                                            value={dobToIso(formData[field.name] || "")}
                                            min="1900-01-01"
                                            max={new Date().toISOString().slice(0, 10)}
                                            onChange={(e) =>
                                                handleFieldChange(field.name, isoToDob(e.target.value))
                                            }
                                            style={{ colorScheme: "dark" }}
                                        />
                                    ) : (
                                        <input
                                            type={field.type}
                                            className={styles.input}
                                            placeholder={field.placeholder || ""}
                                            value={formData[field.name] || ""}
                                            onChange={(e) =>
                                                handleFieldChange(field.name, e.target.value, field)
                                            }
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
                                    <>
                                        <div className={styles.fieldGroup}>
                                            <label className={styles.label}>
                                                Create Password <span style={{ color: "#ef4444" }}>*</span>
                                            </label>
                                            <PasswordField
                                                className={styles.input}
                                                placeholder="Choose a password for your account"
                                                value={formData["password"] || ""}
                                                onChange={(e) => handleFieldChange("password", e.target.value)}
                                            />
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
                                        <div className={styles.fieldGroup}>
                                            <label className={styles.label}>
                                                Confirm Password <span style={{ color: "#ef4444" }}>*</span>
                                            </label>
                                            <PasswordField
                                                className={styles.input}
                                                placeholder="Re-enter your password"
                                                value={confirmPassword}
                                                onChange={(e) => {
                                                    setConfirmPassword(e.target.value);
                                                    if (errors["confirmPassword"]) {
                                                        setErrors((prev) => ({ ...prev, confirmPassword: null }));
                                                    }
                                                }}
                                            />
                                            {errors["confirmPassword"] && (
                                                <span
                                                    style={{
                                                        color: "#ef4444",
                                                        fontSize: "12px",
                                                        marginTop: "4px",
                                                        display: "block",
                                                    }}
                                                >
                                                    {errors["confirmPassword"]}
                                                </span>
                                            )}
                                        </div>
                                    </>
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
