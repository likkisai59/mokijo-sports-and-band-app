"use client";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
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
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-[#c6ff3d] text-[#08080f] shadow-[0_0_12px_rgba(198,255,61,0.4)]">1</div>
                <div className="flex-1 h-[1px] bg-white/8 max-w-[60px]"></div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-white/5 border border-white/8 text-slate-500">2</div>
            </div>

            <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-white tracking-tight">Club Information</h2>
                <p className="text-sm text-slate-400 mt-1">Tell us about your club or organisation</p>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-white/40">Club Name *</label>
                <input
                    type="text"
                    className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-200 focus:outline-none focus:border-[#c6ff3d] focus:bg-white/5"
                    placeholder="Enter your club name"
                    value={formData.clubName}
                    onChange={(e) => handleClubNameChange(e.target.value)}
                />
                {fieldErrors.clubName ? <p style={fieldErrorStyle}>{fieldErrors.clubName}</p> : null}
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-white/40">
                    Club ID <span style={{ fontSize: "12px", color: "#c6ff3d", marginLeft: "4px" }}>(Auto-Generated)</span>
                </label>
                <input
                    type="text"
                    className="w-full bg-white/8 border border-white/8 rounded-xl px-4 py-3 text-sm text-[#c6ff3d] font-bold cursor-not-allowed tracking-wider"
                    value={formData.clubId || "Auto-generating..."}
                    readOnly
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-white/40">Country *</label>
                <select
                    className="w-full bg-[#0e0e19] border border-white/8 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c6ff3d]"
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

            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-white/40">State *</label>
                {stateList ? (
                    <select
                        className="w-full bg-[#0e0e19] border border-white/8 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c6ff3d]"
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
                        className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-200 focus:outline-none focus:border-[#c6ff3d] focus:bg-white/5"
                        placeholder={formData.country ? "Enter state / province" : "Select a country first"}
                        value={formData.state}
                        onChange={(e) => onChange("state", e.target.value)}
                        disabled={!formData.country}
                    />
                )}
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-white/40">Number of Members *</label>
                <select
                    className="w-full bg-[#0e0e19] border border-white/8 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c6ff3d]"
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

            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-white/40">Sports / Activities * (Select all that apply)</label>
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

            <div className="flex justify-between items-center mt-4">
                <div></div>
                <button type="button" className="bg-[#c6ff3d] text-[#08080f] font-bold text-sm px-6 py-3.5 rounded-xl transition-all duration-200 hover:bg-[#b5eb29] hover:shadow-[0_0_15px_rgba(198,255,61,0.3)]" onClick={handleNext}>
                    Next →
                </button>
            </div>
        </div>
    );
}
