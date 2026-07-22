"use client";
import styles from "../../app/styles/signup.module.css";
import { countries, memberOptions, sportsOptions, getStatesForCountry } from "./constants";
import { clubNameError } from "@/lib/validation";

export default function Step1({ formData, onChange, onNext }) {
    const stateOptions = getStatesForCountry(formData.country);

    function handleCountryChange(country) {
        onChange("country", country);
        onChange("state", "");
    }

    function handleNext() {
        const clubErr = clubNameError(formData.clubName);
        if (clubErr) {
            alert(clubErr);
            return;
        }
        if (
            !formData.country ||
            !formData.state ||
            !formData.memberCount ||
            !formData.sport ||
            (Array.isArray(formData.sport) && formData.sport.length === 0)
        ) {
            alert("Please fill in all fields before continuing.");
            return;
        }
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
                    onChange={(e) => onChange("clubName", e.target.value)}
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
                {stateOptions ? (
                    <select
                        className={styles.select}
                        value={formData.state}
                        onChange={(e) => onChange("state", e.target.value)}
                        disabled={!formData.country}
                    >
                        <option value="">-- Select State --</option>
                        {stateOptions.map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        type="text"
                        className={styles.input}
                        placeholder={
                            formData.country
                                ? "Enter state / province"
                                : "Select a country first"
                        }
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
                                        onChange("sport", updated);
                                    }}
                                    style={{ width: "16px", height: "16px", accentColor: "#bffe00", cursor: "pointer" }}
                                />
                                <span>{sport}</span>
                            </label>
                        );
                    })}
                </div>
            </div>

            <div className={styles.buttonRow}>
                <div></div>
                <button type="button" className={styles.nextButton} onClick={handleNext}>
                    Next →
                </button>
            </div>
        </div>
    );
}
