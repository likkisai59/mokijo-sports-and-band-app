"use client";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import styles from "../../app/styles/signup.module.css";
import { countries, getStatesForCountry, memberOptions, sportsOptions } from "./constants";
import {
    isValidClubName,
    CLUB_NAME_MESSAGE,
    generateClubId,
    applyClubNameInput,
} from "@/lib/validation";

const fieldErrorStyle = { color: "#ef4444", fontSize: "12px", marginTop: "6px", marginBottom: 0 };

export default function Step1({ formData, onChange, onNext }) {
    const stateList = getStatesForCountry(formData.country);
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState("");

    useEffect(() => {
        if (!formData.clubId) {
            fetch(`${API_BASE_URL}/clubs`)
                .then((res) => res.json())
                .then((clubs) => {
                    const count = (clubs || []).length + 1;
                    onChange("clubId", generateClubId(count));
                })
                .catch(() => {
                    onChange("clubId", generateClubId(1));
                });
        }
    }, []);

    function handleCountryChange(value) {
        onChange("country", value);
        onChange("state", "");
    }

    function handleClubNameChange(raw) {
        const { sanitized, error } = applyClubNameInput(raw);
        onChange("clubName", sanitized);
        setFieldErrors((prev) => ({ ...prev, clubName: error }));
        setFormError("");
    }

    function handleNext() {
        const nextErrors = {};
        if (!formData.clubName?.trim()) {
            nextErrors.clubName = "Club name is required.";
        } else if (!isValidClubName(formData.clubName)) {
            nextErrors.clubName = CLUB_NAME_MESSAGE;
        }

        if (
            !formData.country ||
            !formData.state ||
            !formData.memberCount ||
            !formData.sport ||
            (Array.isArray(formData.sport) && formData.sport.length === 0)
        ) {
            setFormError("Please fill in all fields before continuing.");
            setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
            return;
        }

        if (Object.keys(nextErrors).length) {
            setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
            setFormError("");
            return;
        }

        setFormError("");
        onNext();
    }

    return (
        <div className={styles.stepContainer}>
            <div className={styles.stepIndicator}>
                <div className={`${styles.stepDot} ${styles.activeDot}`}>1</div>
                <div className={styles.stepLine}></div>
                <div className={styles.stepDot}>2</div>
            </div>

            <h2 className={styles.stepTitle}>Club Information</h2>
            <p className={styles.stepSubtitle}>Tell us about your club or organisation</p>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Club Name *</label>
                <input
                    type="text"
                    className={styles.input}
                    placeholder="Enter your club name"
                    value={formData.clubName}
                    onChange={(e) => handleClubNameChange(e.target.value)}
                />
                {fieldErrors.clubName ? <p style={fieldErrorStyle}>{fieldErrors.clubName}</p> : null}
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>
                    Club ID <span style={{ fontSize: "12px", color: "#c6ff3d", marginLeft: "4px" }}>(Auto-Generated)</span>
                </label>
                <input
                    type="text"
                    className={styles.input}
                    value={formData.clubId || "Auto-generating..."}
                    readOnly
                    style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        color: "#c6ff3d",
                        fontWeight: 700,
                        cursor: "not-allowed",
                        letterSpacing: "1px",
                    }}
                />
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Country *</label>
                <select
                    className={styles.select}
                    value={formData.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                >
                    <option value="">-- Select Country --</option>
                    {countries.map((country) => (
                        <option key={country} value={country}>
                            {country}
                        </option>
                    ))}
                </select>
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>State *</label>
                {stateList ? (
                    <select
                        className={styles.select}
                        value={formData.state}
                        onChange={(e) => onChange("state", e.target.value)}
                    >
                        <option value="">-- Select State --</option>
                        {stateList.map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        type="text"
                        className={styles.input}
                        placeholder={formData.country ? "Enter state / province" : "Select a country first"}
                        value={formData.state}
                        onChange={(e) => onChange("state", e.target.value)}
                        disabled={!formData.country}
                    />
                )}
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Number of Members *</label>
                <select
                    className={styles.select}
                    value={formData.memberCount}
                    onChange={(e) => onChange("memberCount", e.target.value)}
                >
                    <option value="">-- Select Member Range --</option>
                    {memberOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Sports / Activities * (Select all that apply)</label>
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
                    }}
                >
                    {sportsOptions.map((sport) => {
                        const selectedSports = Array.isArray(formData.sport) ? formData.sport : [];
                        const isChecked = selectedSports.includes(sport);
                        return (
                            <label
                                key={sport}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
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
                                        onChange("sport", updated);
                                    }}
                                    style={{ width: "16px", height: "16px", accentColor: "#c6ff3d", cursor: "pointer" }}
                                />
                                <span>{sport}</span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {formError ? <p style={fieldErrorStyle}>{formError}</p> : null}

            <div className={styles.buttonRow}>
                <div></div>
                <button type="button" className={styles.nextButton} onClick={handleNext}>
                    Next →
                </button>
            </div>
        </div>
    );
}
